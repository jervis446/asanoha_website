const CACHE='asanoha-v11';
const ASSETS=["./", "index.html", "about.html", "story.html", "blog.html", "privacy.html", "terms.html", "404.html", "manifest.webmanifest", "assets/css/site.css?v=7", "assets/js/site.js?v=9", "assets/img/apple-touch-icon.png", "assets/img/ayush-badge.svg", "assets/img/foil.webp", "assets/img/founder-adarsh.webp", "assets/img/founder-joseph.webp", "assets/img/founder-soumyadev.webp", "assets/img/giftbox.webp", "assets/img/icon-192.png", "assets/img/icon-512.png", "assets/img/logo-night.webp", "assets/img/logo.png", "assets/img/logo.webp", "assets/img/mark.svg", "assets/img/og.jpg", "assets/img/oil-high.webp", "assets/img/oil-low.webp", "assets/img/oil-medium.webp", "assets/img/rolling-papers.webp", "assets/img/tablets.webp", "assets/img/tinback.webp", "assets/img/tins-high.webp", "assets/img/tins-low.webp", "assets/img/tins-medium.webp"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url); if(u.origin!==location.origin)return;
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}return res;})));
});
