/* Asanoha accounts: Google sign-in with Firebase, profile and order history in Firestore.
   Stays switched off until CONFIG.firebase is filled in (assets/js/site.js). */
const A = window.ASANOHA || {};
const cfg = A.config && A.config.firebase;
const btn = document.getElementById('account-btn');
const modal = document.getElementById('acct');
const SIGNED_OUT = btn ? btn.innerHTML : '';

if (!cfg || !cfg.apiKey) {
  if (btn) btn.remove();
} else {
  const V = '10.12.2';
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } = authMod;
  const { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } = fsMod;

  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const track = A.track || function () {};
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const saveLocal = (d) => { try { const cur = JSON.parse(localStorage.getItem('asanoha:details') || '{}'); localStorage.setItem('asanoha:details', JSON.stringify(Object.assign(cur, d))); } catch (e) {} };
  let user = null, profile = {};

  btn.hidden = false;
  btn.addEventListener('click', async () => {
    if (!user) {
      const provider = new GoogleAuthProvider();
      try { await signInWithPopup(auth, provider); }
      catch (e) { if (e && /popup/i.test(e.code || '')) await signInWithRedirect(auth, provider); else console.error(e); }
    } else openAccount();
  });

  onAuthStateChanged(auth, async (u) => {
    user = u;
    if (!u) { btn.innerHTML = SIGNED_OUT; btn.setAttribute('aria-label', 'Sign in with Google'); return; }
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    profile = snap.exists() ? snap.data() : {};
    const base = { name: profile.name || u.displayName || '', email: u.email || '', photo: u.photoURL || '', lastLogin: serverTimestamp() };
    if (!snap.exists()) { base.createdAt = serverTimestamp(); track('sign_up', { method: 'google' }); } else track('login', { method: 'google' });
    await setDoc(ref, base, { merge: true });
    profile = Object.assign(profile, base);
    saveLocal({ name: profile.name, email: profile.email, phone: profile.phone || '', addr: profile.addr || '', city: profile.city || '', pin: profile.pin || '' });
    const first = (profile.name || 'You').split(' ')[0];
    btn.innerHTML = (u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span class="ini">${esc(first[0])}</span>`) + `<span class="label">${esc(first)}</span>`;
    btn.setAttribute('aria-label', 'Your account');
  });

  // Save delivery details and a copy of each order request (no prescription files are stored).
  document.addEventListener('asanoha:order', async (e) => {
    if (!user) return;
    const d = e.detail || {};
    const det = d.details || {};
    try {
      await setDoc(doc(db, 'users', user.uid), { phone: det.phone || '', addr: det.addr || '', city: det.city || '', pin: det.pin || '', updatedAt: serverTimestamp() }, { merge: true });
      await addDoc(collection(db, 'users', user.uid, 'orders'), { orderId: d.id, items: d.items || [], rx: d.rx || '', slam: d.slam || '', createdAt: serverTimestamp() });
    } catch (err) { console.error('Asanoha: could not save order', err); }
  });

  async function openAccount() {
    let orders = [];
    try { const qs = await getDocs(query(collection(db, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc'), limit(10))); orders = qs.docs.map((x) => x.data()); } catch (e) {}
    $('#acct-body').innerHTML = `
      <div class="acct-head">${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : ''}<div><h2 id="acct-title">Hi, ${esc((profile.name || '').split(' ')[0] || 'there')}</h2><p>${esc(user.email)}</p></div></div>
      <form class="form" id="acct-form">
        <label>Full name<input type="text" name="name" value="${esc(profile.name)}" autocomplete="name"></label>
        <label>Phone<input type="tel" name="phone" value="${esc(profile.phone)}" autocomplete="tel"></label>
        <label>Delivery address<textarea name="addr" autocomplete="street-address">${esc(profile.addr)}</textarea></label>
        <div class="two"><label>City<input type="text" name="city" value="${esc(profile.city)}"></label><label>Pincode<input type="text" name="pin" maxlength="6" inputmode="numeric" value="${esc(profile.pin)}"></label></div>
        <p class="hint" id="acct-msg" role="status">Saved details fill in checkout for you. We never store prescriptions here.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn clay" type="submit">Save details</button><button class="btn ghost" type="button" id="acct-out">Sign out</button></div>
      </form>
      <h3 class="acct-orders-h">Your order requests</h3>
      ${orders.length ? '<ul class="acct-orders">' + orders.map((o) => `<li><b>${esc(o.orderId)}</b><span>${o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} \u00B7 ${(o.items || []).reduce((a, i) => a + (i.qty || 0), 0)} items</span></li>`).join('') + '</ul>' : '<p class="hint">No orders yet. Your first pair is waiting.</p>'}`;
    $('#acct-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      const upd = { name: f.name.value.trim(), phone: f.phone.value.trim(), addr: f.addr.value.trim(), city: f.city.value.trim(), pin: f.pin.value.trim(), updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'users', user.uid), upd, { merge: true });
      profile = Object.assign(profile, upd); saveLocal({ name: upd.name, phone: upd.phone, addr: upd.addr, city: upd.city, pin: upd.pin });
      $('#acct-msg').textContent = 'Saved. Checkout will use these details.';
    });
    $('#acct-out').addEventListener('click', async () => { await signOut(auth); closeAccount(); });
    modal.classList.add('open'); document.body.classList.add('lock'); $('#scrim').classList.add('open');
    setTimeout(() => $('#acct-close').focus(), 30);
  }
  function closeAccount() { modal.classList.remove('open'); document.body.classList.remove('lock'); $('#scrim').classList.remove('open'); btn.focus(); }
  $('#acct-close').addEventListener('click', closeAccount);
  $('#scrim').addEventListener('click', () => { if (modal.classList.contains('open')) closeAccount(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeAccount(); });
}
