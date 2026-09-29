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
  signIn() { return Promise.reject(new Error('Google sign-in is not set up yet')); },
  signOut() { return Promise.resolve(); },
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
    const fa = am.getAuth(app);
    const db = fm.getFirestore(app);
    const provider = new am.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.available = true;

    auth.signIn = async () => {
      try { await am.signInWithPopup(fa, provider); }
      catch (e) {
        if (/popup-blocked|operation-not-supported|popup-closed-by-browser/i.test(e.code || '')) await am.signInWithRedirect(fa, provider);
        else throw e;
      }
    };
    auth.signOut = () => am.signOut(fa);

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
        if (A.track) A.track(snap.exists() ? 'login' : 'sign_up', { method: 'google' });
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
