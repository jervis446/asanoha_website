/* Asanoha in three layers: the six-part star from our logo, built in 3D.
   Top: Asanoha Store. Middle: People Pitchers, Kosmik, Wearday. Base: the open-source rails.
   three.js r170 (MIT), pinned. Loaded only when WebGL works and the visitor allows motion;
   otherwise the static SVG in the page stays. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

// The petals of the Asanoha star, same numbers as the SVG mark (radius 45)
const PETALS = [
  [[0, 0], [-16.67, -28.87], [0, -45], [16.67, -28.87]],
  [[0, 0], [16.67, -28.87], [38.97, -22.5], [33.33, 0]],
  [[0, 0], [33.33, 0], [38.97, 22.5], [16.67, 28.87]],
  [[0, 0], [16.67, 28.87], [0, 45], [-16.67, 28.87]],
  [[0, 0], [-16.67, 28.87], [-38.97, 22.5], [-33.33, 0]],
  [[0, 0], [-33.33, 0], [-38.97, -22.5], [-16.67, -28.87]],
];

// Where each part sits: tier height, angle around the middle, distance, size
const TIERS = { top: 1.55, mid: 0, base: -1.55 };
const PARTS = [
  { k: 'store', tier: 'top', a: 0, d: 0, r: 1.15 },
  { k: 'pp', tier: 'mid', a: 90, d: 1.3, r: 0.5 },
  { k: 'kosmik', tier: 'mid', a: 210, d: 1.3, r: 0.5 },
  { k: 'wearday', tier: 'mid', a: 330, d: 1.3, r: 0.5 },
  { k: 'pay', tier: 'base', a: 30, d: 1.45, r: 0.45, open: true },
  { k: 'money', tier: 'base', a: 150, d: 1.45, r: 0.45, open: true },
  { k: 'learn', tier: 'base', a: 270, d: 1.45, r: 0.45, open: true },
];

function cssColor(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || '#888888');
}

function petalGeometry(pts, depth) {
  // Shrink each petal toward its own middle so the star shows the logo's thin seams
  const cx = (pts[1][0] + pts[2][0] + pts[3][0]) / 4, cy = (pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => {
    const px = (cx + (x - cx) * 0.9) / 45, py = -(cy + (y - cy) * 0.9) / 45;
    if (i === 0) s.moveTo(px, py); else s.lineTo(px, py);
  });
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function star(radius, open) {
  const group = new THREE.Group();
  const mats = [];
  PETALS.forEach((p, i) => {
    const geo = petalGeometry(p, open ? 0.06 : 0.18);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.42, metalness: 0.18,
      transparent: !!open, opacity: open ? 0.32 : 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.shade = i % 2 ? 0.86 : 1;
    group.add(mesh);
    mats.push(mat);
    if (open) {
      // Open source: you can see every edge
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 }));
      group.add(edges);
      mats.push(edges.material);
    }
  });
  group.scale.setScalar(radius);
  return { group, mats };
}

export function mount(host, opts) {
  const onPick = opts.onPick || (() => {});
  const tags = Array.from(host.querySelectorAll('[data-k]'));
  const canvas = document.createElement('canvas');
  canvas.className = 'stack-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { canvas.remove(); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  // Base platform: a hexagon you can see through
  const hex = new THREE.CylinderGeometry(2.25, 2.25, 0.04, 6, 1);
  const hexFill = new THREE.Mesh(hex, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, depthWrite: false }));
  const hexEdge = new THREE.LineSegments(new THREE.EdgesGeometry(hex), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 }));
  hexFill.position.y = hexEdge.position.y = TIERS.base - 0.06;
  world.add(hexFill, hexEdge);
  // Middle ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.008, 6, 96), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = TIERS.mid;
  world.add(ring);

  const parts = PARTS.map((p) => {
    const s = star(p.r, p.open);
    const a = (p.a * Math.PI) / 180;
    const home = new THREE.Vector3(Math.cos(a) * p.d, TIERS[p.tier], Math.sin(a) * p.d);
    s.group.position.copy(home);
    s.group.position.y += 2.5; // drops into place on first view
    world.add(s.group);
    return Object.assign({}, p, s, { home, hot: 0 });
  });
  const byK = Object.fromEntries(parts.map((p) => [p.k, p]));

  // Threads from each rail and earner up to the store: value flows to the top
  const threadPts = [];
  const top = byK.store.home;
  ['pp', 'kosmik', 'wearday'].forEach((k) => { threadPts.push(byK[k].home.clone(), top.clone()); });
  ['pay', 'money', 'learn'].forEach((k, i) => {
    const up = byK[['pp', 'kosmik', 'wearday'][i]].home;
    threadPts.push(byK[k].home.clone(), up.clone());
  });
  const threads = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(threadPts), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.28 }));
  world.add(threads);

  // Dots that climb the threads (the dots are a motif across the page)
  const N = 90;
  const dotPos = new Float32Array(N * 3);
  const dotSeed = Array.from({ length: N }, (_, i) => ({ seg: i % (threadPts.length / 2), t: Math.random() }));
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({ size: 0.045, transparent: true, opacity: 0.85, depthWrite: false }));
  world.add(dots);

  function paint() {
    const line = cssColor('--line-2');
    const text = cssColor('--text-2');
    const accent = cssColor('--accent');
    parts.forEach((p) => {
      const c = cssColor('--' + p.k);
      p.mats.forEach((m) => {
        if (m.isLineBasicMaterial) m.color.copy(c);
        else { m.color.copy(c); m.emissive = c.clone(); m.emissiveIntensity = 0.08; }
      });
      p.group.children.forEach((ch) => { if (ch.isMesh && ch.userData.shade !== 1) ch.material.color.multiplyScalar(ch.userData.shade); });
    });
    hexFill.material.color.copy(text);
    hexEdge.material.color.copy(text);
    ring.material.color.copy(text);
    threads.material.color.copy(text);
    dots.material.color.copy(accent);
    void line;
  }
  paint();

  // Size
  let w = 0, h = 0;
  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow screens: step back so the base still fits
    const dist = w < 420 ? 10.6 : w < 700 ? 9.6 : 8.8;
    camera.position.set(0, dist * 0.46, dist);
    camera.lookAt(0, -0.2, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Pointer: drag to turn, hover to light a part
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hover = null, focusK = null, spin = 0, drag = null, vel = 0, tiltX = 0, tiltY = 0;
  function pick() {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(parts.map((p) => p.group), true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !parts.some((p) => p.group === o)) o = o.parent;
    const p = parts.find((q) => q.group === o);
    return p ? p.k : null;
  }
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tiltX = ndc.y * 0.06; tiltY = ndc.x * 0.12;
    if (drag) { const dx = e.clientX - drag.x; vel = dx * 0.004; spin += vel; drag.x = e.clientX; drag.moved += Math.abs(dx); }
    hover = pick();
    canvas.style.cursor = hover ? 'pointer' : drag ? 'grabbing' : 'grab';
  });
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', (e) => {
    const moved = drag ? drag.moved : 0;
    drag = null;
    if (moved < 6) { const k = pick(); if (k) onPick(k); }
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
  });
  canvas.addEventListener('pointerleave', () => { hover = null; ndc.set(9, 9); tiltX = tiltY = 0; });
  tags.forEach((t) => {
    const k = t.getAttribute('data-k');
    t.addEventListener('mouseenter', () => { focusK = k; });
    t.addEventListener('mouseleave', () => { focusK = null; });
    t.addEventListener('focus', () => { focusK = k; });
    t.addEventListener('blur', () => { focusK = null; });
  });

  // Loop, only while on screen and the tab is visible
  const v = new THREE.Vector3();
  let visible = true, raf = 0, born = performance.now(), last = born;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const age = (now - born) / 1000;
    if (!drag) { vel *= 0.94; spin += vel + dt * 0.16; }
    world.rotation.y = spin + tiltY;
    world.rotation.x = tiltX;
    const lit = hover || focusK;
    parts.forEach((p, i) => {
      // Entrance: top first, then middle, then base
      const delay = p.tier === 'top' ? 0 : p.tier === 'mid' ? 0.25 : 0.5;
      const e = Math.min(1, Math.max(0, (age - delay) / 1.1));
      const ease = 1 - Math.pow(1 - e, 4);
      const bob = Math.sin(age * 1.2 + i) * 0.03;
      p.group.position.set(p.home.x, p.home.y + (1 - ease) * 2.5 + bob, p.home.z);
      p.group.rotation.y = p.tier === 'top' ? -age * 0.25 : age * 0.4 + i;
      p.hot += ((lit === p.k ? 1 : 0) - p.hot) * 0.15;
      p.group.scale.setScalar(p.r * (1 + p.hot * 0.14));
      p.mats.forEach((m) => { if (!m.isLineBasicMaterial) m.emissiveIntensity = 0.08 + p.hot * 0.5; });
    });
    // Dots climb
    const n = threadPts.length / 2;
    for (let i = 0; i < N; i++) {
      const d = dotSeed[i];
      d.t += dt * 0.22;
      if (d.t > 1) { d.t = 0; d.seg = (d.seg + 1) % n; }
      v.lerpVectors(threadPts[d.seg * 2], threadPts[d.seg * 2 + 1], d.t);
      dotPos[i * 3] = v.x; dotPos[i * 3 + 1] = v.y; dotPos[i * 3 + 2] = v.z;
    }
    dotGeo.attributes.position.needsUpdate = true;
    dots.material.opacity = Math.min(0.85, age * 0.6);
    renderer.render(scene, camera);
    // Labels follow their part
    tags.forEach((t) => {
      const p = byK[t.getAttribute('data-k')];
      if (!p) return;
      v.set(0, p.tier === 'top' ? 0.32 : 0.22, 0);
      p.group.localToWorld(v);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      t.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
      t.style.zIndex = String(Math.round((1 - v.z) * 1000));
      t.classList.toggle('on', lit === p.k);
    });
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); }, { threshold: 0.05 });
  io.observe(host);
  document.addEventListener('visibilitychange', wake);
  // Theme changes repaint the materials
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);

  host.classList.add('is-3d');
  wake();
  return { paint, focus: (k) => { focusK = k; } };
}
