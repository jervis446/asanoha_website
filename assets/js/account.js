/* Asanoha accounts: "Continue with Google" sign-in (Firebase Auth) and profile sync (Firestore).
   Exposes window.ASANOHA.auth for the profile page in shop.js.
   Switched off until CONFIG.firebase is filled in (assets/js/site.js). */
const A = (window.ASANOHA = window.ASANOHA || {});
const cfg = A.config && A.config.firebase;
const oldBtn = document.getElementById('account-btn');
if (oldBtn) oldBtn.remove();

const listeners = [];
const auth = (A.auth = {
  available: false,
  ready: false,
  user: null,               // { uid, name, email, photo }
  onChange(fn) { listeners.push(fn); },
  signIn() { return Promise.reject(new Error('Sign-in is not set up yet')); },
  signInApple() { return Promise.reject(new Error('Sign-in is not set up yet')); },
  signOut() { return Promise.resolve(); },
  deleteAccount() { return Promise.reject(new Error('Sign-in is not set up yet')); },
  push() { return Promise.resolve(); }
});
const emit = () => {
  listeners.forEach((fn) => { try { fn(auth.user); } catch (e) { console.error(e); } });
  document.dispatchEvent(new CustomEvent('asanoha:auth', { detail: auth.user }));
};

const readLocal = (k, d) => { try { const v = localStorage.getItem('asanoha:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const writeLocal = (k, v) => { try { localStorage.setItem('asanoha:' + k, JSON.stringify(v)); } catch (e) {} };

if (cfg && cfg.apiKey) {
  try {
    const V = '10.12.2';
    const [{ initializeApp }, am, fm] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const app = initializeApp(cfg);
    const native = window.AsanohaNative && window.AsanohaNative.isNative;
    // Inside the iOS app there is no popup or redirect, so use local persistence and native sign-in credentials
    const fa = native ? am.initializeAuth(app, { persistence: am.indexedDBLocalPersistence }) : am.getAuth(app);
    const db = fm.getFirestore(app);
    const provider = new am.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.available = true;

    const appleProvider = new am.OAuthProvider('apple.com');
    appleProvider.addScope('email'); appleProvider.addScope('name');
    const viaNative = async (kind) => {
      const c = await window.AsanohaNative.auth[kind]();
      const cred = kind === 'apple'
        ? appleProvider.credential({ idToken: c.idToken, rawNonce: c.nonce })
        : am.GoogleAuthProvider.credential(c.idToken, c.accessToken);
      const r = await am.signInWithCredential(fa, cred);
      if (kind === 'apple' && c.name && !r.user.displayName) { try { await am.updateProfile(r.user, { displayName: c.name }); } catch (e) {} }
    };
    auth.signInApple = async () => {
      if (native) return viaNative('apple');
      try { await am.signInWithPopup(fa, appleProvider); }
      catch (e) { if (/popup-blocked|operation-not-supported/i.test(e.code || '')) await am.signInWithRedirect(fa, appleProvider); else throw e; }
    };
    auth.signIn = async () => {
      if (native) return viaNative('google');
      try { await am.signInWithPopup(fa, provider); }
      catch (e) {
        if (/popup-blocked|operation-not-supported|popup-closed-by-browser/i.test(e.code || '')) await am.signInWithRedirect(fa, provider);
        else throw e;
      }
    };
    auth.signOut = async () => { if (native) await window.AsanohaNative.auth.signOut(); await am.signOut(fa); };

    // Permanently delete the account and its saved data. Required by the App Store.
    auth.deleteAccount = async () => {
      const u = fa.currentUser; if (!u) return;
      await fm.deleteDoc(fm.doc(db, 'users', u.uid));
      try { await am.deleteUser(u); }
      catch (e) {
        if ((e.code || '') !== 'auth/requires-recent-login') throw e;
        const pid = (u.providerData[0] || {}).providerId;
        if (native) await viaNative(pid === 'apple.com' ? 'apple' : 'google');
        else await am.reauthenticateWithPopup(u, pid === 'apple.com' ? appleProvider : provider);
        await am.deleteUser(fa.currentUser);
      }
      if (native) await window.AsanohaNative.auth.signOut();
      ['addresses', 'profile', 'orders2', 'pushToken'].forEach((k) => { try { localStorage.removeItem('asanoha:' + k); } catch (e) {} });
    };

    // Save addresses, profile and orders to the signed-in user's own document.
    auth.push = async (data) => {
      if (!fa.currentUser) return;
      const clean = JSON.parse(JSON.stringify(data || {}));
      await fm.setDoc(fm.doc(db, 'users', fa.currentUser.uid), Object.assign(clean, { updatedAt: fm.serverTimestamp() }), { merge: true });
    };

    am.onAuthStateChanged(fa, async (u) => {
      if (!u) { auth.user = null; auth.ready = true; emit(); return; }
      auth.user = { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' };
      // Merge what is on this device with what is saved in the account.
      try {
        const ref = fm.doc(db, 'users', u.uid);
        const snap = await fm.getDoc(ref);
        const remote = snap.exists() ? snap.data() : {};
        const local = { addresses: readLocal('addresses', []), profile: readLocal('profile', {}), orders: readLocal('orders2', []) };
        const byId = {};
        (remote.addresses || []).concat(local.addresses || []).forEach((a) => { if (a && a.id) byId[a.id] = a; });
        const addresses = Object.values(byId);
        const profile = Object.assign({}, remote.profile || {}, local.profile || {});
        if (!profile.name) profile.name = auth.user.name;
        profile.email = auth.user.email;
        const seen = {}; const orders = (remote.orders || []).concat(local.orders || []).filter((o) => o && o.id && !seen[o.id] && (seen[o.id] = 1)).slice(-50);
        writeLocal('addresses', addresses); writeLocal('profile', profile); writeLocal('orders2', orders);
        await fm.setDoc(ref, { name: auth.user.name, email: auth.user.email, photo: auth.user.photo, addresses, profile, orders, lastLogin: fm.serverTimestamp(), createdAt: remote.createdAt || fm.serverTimestamp() }, { merge: true });
        if (A.track) A.track(snap.exists() ? 'login' : 'sign_up', { method: ((u.providerData[0] || {}).providerId === 'apple.com') ? 'apple' : 'google' });
      } catch (e) { console.error('Asanoha: profile sync failed', e); }
      auth.ready = true; emit();
    });
  } catch (e) {
    console.error('Asanoha: Google sign-in could not load', e);
    auth.ready = true; emit();
  }
} else {
  auth.ready = true; emit();
}
