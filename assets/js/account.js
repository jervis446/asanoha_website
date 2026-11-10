/* Asanoha accounts: "Continue with Google / Apple" sign-in and profile sync.
   Exposes window.ASANOHA.auth for the profile page in shop.js.
   Two back ends, chosen by CONFIG.authProvider in assets/js/site.js:
   - 'firebase' (current): Firebase Auth + Firestore users/<uid>.
   - 'supabase': the shared Asanoha account, also used by Wearday (wearday.asanoha.co.in and the app),
     with Noha Money from the shared wallet. Sign-in is shared across *.asanoha.co.in. */
const A = (window.ASANOHA = window.ASANOHA || {});
const provider = (A.config && A.config.authProvider) || 'firebase';
const cfg = provider === 'firebase' && A.config && A.config.firebase;
const sbCfg = provider === 'supabase' && A.config && A.config.supabase;
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

if (sbCfg && sbCfg.url) {
  await startSupabase(sbCfg);
} else if (cfg && cfg.apiKey) {
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


/* ---------- Supabase (shared Asanoha account) ---------- */

// Keeps the sign-in in cookies on .asanoha.co.in so asanoha.co.in and wearday.asanoha.co.in share it.
// Elsewhere (local testing) it uses localStorage. Cookies hold about 4 KB, so the session is split.
function sharedStorage() {
  const host = location.hostname;
  if (!/(^|\.)asanoha\.co\.in$/.test(host)) return undefined;
  const CHUNK = 3500, YEAR = 31536000;
  const read = (n) => { const m = document.cookie.match('(?:^|; )' + n.replace(/\./g, '\\.') + '=([^;]*)'); return m ? m[1] : null; };
  const write = (n, v, age) => { document.cookie = n + '=' + v + '; Domain=.asanoha.co.in; Path=/; Max-Age=' + age + '; SameSite=Lax; Secure'; };
  return {
    getItem(k) {
      const n = Number(read(k + '.n') || 0); if (!n) return null;
      let s = ''; for (let i = 0; i < n; i++) { const p = read(k + '.' + i); if (p == null) return null; s += p; }
      try { return decodeURIComponent(s); } catch (e) { return null; }
    },
    setItem(k, v) {
      const enc = encodeURIComponent(v), old = Number(read(k + '.n') || 0), parts = [];
      for (let i = 0; i < enc.length; i += CHUNK) parts.push(enc.slice(i, i + CHUNK));
      parts.forEach((p, i) => write(k + '.' + i, p, YEAR));
      write(k + '.n', String(parts.length), YEAR);
      for (let i = parts.length; i < old; i++) write(k + '.' + i, '', 0);
    },
    removeItem(k) {
      const old = Number(read(k + '.n') || 0);
      for (let i = 0; i < old; i++) write(k + '.' + i, '', 0);
      write(k + '.n', '', 0);
    }
  };
}

async function startSupabase(sc) {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
    const native = window.AsanohaNative && window.AsanohaNative.isNative;
    const sb = createClient(sc.url, sc.key, {
      auth: { flowType: 'pkce', storageKey: 'asanoha-auth', storage: sharedStorage(), persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    A.supabase = sb;
    auth.available = true;
    const back = () => location.origin + location.pathname;
    const fail = (error) => { if (error) { const e = new Error(error.message); e.code = 'auth/' + (error.code || error.status || 'error'); throw e; } };

    // Inside the iOS app: native Google / Apple sheets hand us an ID token.
    const viaNative = async (kind) => {
      const c = await window.AsanohaNative.auth[kind]();
      const { data, error } = await sb.auth.signInWithIdToken(kind === 'apple'
        ? { provider: 'apple', token: c.idToken, nonce: c.nonce }
        : { provider: 'google', token: c.idToken, access_token: c.accessToken });
      fail(error);
      if (kind === 'apple' && c.name && !(data.user.user_metadata || {}).full_name) { try { await sb.auth.updateUser({ data: { full_name: c.name } }); } catch (e) {} }
    };
    // Google's own sign-in sheet (Google Identity Services) names Asanoha instead of the Supabase server
    // and needs no redirect. If it can't show (blocked, dismissed recently), fall back to the redirect flow.
    const redirectGoogle = async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back(), queryParams: { prompt: 'select_account' } } });
      fail(error);
    };
    let gsi = null;
    const loadGsi = () => gsi || (gsi = new Promise((ok, bad) => {
      if (!sc.googleClientId) return bad(new Error('no client id'));
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => ok(window.google.accounts.id); s.onerror = bad; document.head.appendChild(s);
    }));
    auth.signIn = async () => {
      if (native) return viaNative('google');
      let id;
      try { id = await loadGsi(); } catch (e) { return redirectGoogle(); }
      const raw = crypto.randomUUID() + crypto.randomUUID();
      const hashed = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map((b) => b.toString(16).padStart(2, '0')).join('');
      return new Promise((resolve, reject) => {
        id.initialize({
          client_id: sc.googleClientId,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            try { const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: credential, nonce: raw }); fail(error); resolve(); }
            catch (e) { reject(e); }
          }
        });
        id.prompt((n) => {
          if ((n.isNotDisplayed && n.isNotDisplayed()) || (n.isSkippedMoment && n.isSkippedMoment())) redirectGoogle().then(resolve, reject);
        });
      });
    };
    auth.signInApple = async () => {
      if (native) return viaNative('apple');
      const { error } = await sb.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: back() } });
      fail(error);
    };
    const forget = () => ['addresses', 'profile', 'orders2', 'pushToken', 'noha'].forEach((k) => { try { localStorage.removeItem('asanoha:' + k); } catch (e) {} });
    auth.signOut = async () => {
      if (native) await window.AsanohaNative.auth.signOut();
      await sb.auth.signOut();
      try { localStorage.removeItem('asanoha:noha'); } catch (e) {}
    };

    // Permanently delete the account. Removes Wearday photos too, then the account and everything linked to it.
    // Noha Money payment records are kept for 8 years, as the law requires.
    auth.deleteAccount = async () => {
      const { data: s } = await sb.auth.getSession(); const u = s.session && s.session.user; if (!u) return;
      try {
        for (;;) {
          const { data: files } = await sb.storage.from('photos').list(u.id, { limit: 100 });
          if (!files || !files.length) break;
          await sb.storage.from('photos').remove(files.map((f) => u.id + '/' + f.name));
          if (files.length < 100) break;
        }
      } catch (e) { console.error('Asanoha: photo clean-up failed', e); }
      const { error } = await sb.rpc('delete_my_account'); fail(error);
      if (native) await window.AsanohaNative.auth.signOut();
      await sb.auth.signOut({ scope: 'local' });
      forget();
    };

    // Save addresses, profile and orders to the signed-in account (merged like Firestore's merge: true).
    let remote = {};
    auth.push = async (data) => {
      const { data: s } = await sb.auth.getSession(); const u = s.session && s.session.user; if (!u) return;
      remote = Object.assign({}, remote, JSON.parse(JSON.stringify(data || {})));
      const { error } = await sb.from('asanoha_profiles').upsert({ user_id: u.id, data: remote, updated_at: new Date().toISOString() });
      fail(error);
    };

    // Noha Money comes from the shared wallet, so it matches Wearday. Stored where shop.js reads it.
    const loadWallet = async () => {
      const [bal, tx] = await Promise.all([
        sb.rpc('noha_balance'),
        sb.from('noha_transactions').select('amount_paise,description,created_at').order('created_at', { ascending: false }).limit(50)
      ]);
      if (bal.error || tx.error) return; // wallet not set up on the server yet
      const b = (bal.data || [])[0] || { total_paise: 0 };
      writeLocal('noha', {
        balance: b.total_paise / 100,
        txns: (tx.data || []).slice().reverse().map((t) => ({
          note: t.description,
          date: new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          amt: t.amount_paise / 100
        }))
      });
    };
    A.refreshNoha = async () => { await loadWallet(); emit(); };

    const onUser = async (u) => {
      const meta = u.user_metadata || {};
      const via = (u.app_metadata && u.app_metadata.provider) || 'email';
      auth.user = { uid: u.id, name: meta.full_name || meta.name || '', email: u.email || '', photo: meta.avatar_url || meta.picture || '' };
      try {
        const { data: row, error } = await sb.from('asanoha_profiles').select('data, created_at').eq('user_id', u.id).maybeSingle();
        if (error) throw error;
        remote = (row && row.data) || {};
        const local = { addresses: readLocal('addresses', []), profile: readLocal('profile', {}), orders: readLocal('orders2', []) };
        const byId = {};
        (remote.addresses || []).concat(local.addresses || []).forEach((a) => { if (a && a.id) byId[a.id] = a; });
        const addresses = Object.values(byId);
        const profile = Object.assign({}, remote.profile || {}, local.profile || {});
        if (!profile.name) profile.name = auth.user.name;
        profile.email = auth.user.email;
        const seen = {}; const orders = (remote.orders || []).concat(local.orders || []).filter((o) => o && o.id && !seen[o.id] && (seen[o.id] = 1)).slice(-50);
        writeLocal('addresses', addresses); writeLocal('profile', profile); writeLocal('orders2', orders);
        await auth.push({ name: auth.user.name, email: auth.user.email, photo: auth.user.photo, addresses, profile, orders, lastLogin: new Date().toISOString() });
        if (A.track) A.track(row ? 'login' : 'sign_up', { method: via });
      } catch (e) { console.error('Asanoha: profile sync failed', e); }
      try { await loadWallet(); } catch (e) { console.error('Asanoha: Noha Money failed to load', e); }
    };

    let last = null;
    sb.auth.onAuthStateChange((event, session) => {
      const u = session && session.user;
      if (event === 'TOKEN_REFRESHED' || (u && last === u.id && event !== 'USER_UPDATED')) return;
      last = u ? u.id : null;
      // Supabase calls must not run inside this callback, so continue on the next tick.
      setTimeout(async () => {
        if (!u) { auth.user = null; auth.ready = true; emit(); return; }
        await onUser(u);
        auth.ready = true; emit();
      }, 0);
    });
  } catch (e) {
    console.error('Asanoha: sign-in could not load', e);
    auth.ready = true; emit();
  }
}
