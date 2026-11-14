// Scroll-driven page. Satu jaring 3D ringan di layer tetap, berpindah mengikuti bagian yang sedang dibaca.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year').textContent = new Date().getFullYear();

// Tema: ?theme=dusk|mocha (default forest)
{
  const t = new URLSearchParams(location.search).get('theme');
  if (t) document.documentElement.dataset.theme = t;
}

// Reveal saat masuk layar
{
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) items.forEach(i => i.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    items.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
  }
}

// ---------- elemen scroll ----------
const hero = $('.hero');
const aboutPin = $('#about');
const words = (() => {
  const p = $('.lit');
  p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  return $$('.w', p);
})();
const skills = $('#skills');
const track = $('.track', skills);
const projectItems = $$('.project-list li');

const pinP = el => {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
};

let skillDist = 0;
function sizeSkills() {
  if (reduce) return;
  skillDist = Math.max(0, track.scrollWidth - innerWidth);
  skills.style.height = (innerHeight + skillDist) + 'px';
}

// ---------- 3D ----------
const stage = $('#stage');
let renderer = null;
try {
  if (window.THREE) renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
} catch (e) { renderer = null; }
if (!renderer) stage.remove();

let scene, camera, group, pts, lines, ptsPos, ptsCol, linePos, lineCol;
const nodes = [], glow = [0, 0, 0];
const COLS = 12, ROWS = 7, N = COLS * ROWS, MAXSEG = 1400;
let C1, C2;
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  stage.appendChild(renderer.domElement);
  const css = getComputedStyle(document.documentElement);
  C1 = new THREE.Color(css.getPropertyValue('--accent').trim());
  C2 = new THREE.Color(css.getPropertyValue('--accent2').trim());

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.z = 8;
  group = new THREE.Group();
  scene.add(group);

  // jaring: titik tersebar rata (grid + jitter), garis menghubungkan titik yang berdekatan
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    nodes.push({
      bx: (c / (COLS - 1) - .5) * 9 + (Math.random() - .5) * .7,
      by: (r / (ROWS - 1) - .5) * 5.4 + (Math.random() - .5) * .7,
      bz: (Math.random() - .5) * 3,
      f: .35 + Math.random() * .4, p: Math.random() * 6.28, q: Math.random() * 6.28,
      k: (c + r) % 3
    });
  }
  ptsPos = new Float32Array(N * 3); ptsCol = new Float32Array(N * 3);
  linePos = new Float32Array(MAXSEG * 6); lineCol = new Float32Array(MAXSEG * 6);

  const sprite = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();

  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(ptsPos, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(ptsCol, 3));
  pts = new THREE.Points(pg, new THREE.PointsMaterial({
    size: .26, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lg.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
  lg.setDrawRange(0, 0);
  lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  pts.frustumCulled = lines.frustumCulled = false;
  group.add(lines, pts);
}

function resize() {
  if (renderer) {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  sizeSkills();
  measure();
}

// Waypoint tiap bagian: posisi (pecahan setengah lebar/tinggi layar), skala, opasitas, 'pecah'
const WP = {
  desk: [
    { x: .3,  y: .1,  s: .95, a: 1,   e: 0 },   // hero
    { x: .45, y: 0,   s: 1.05, a: .6,  e: 0 },  // about: jaring tipis di belakang teks dan foto
    { x: -.5, y: .5,  s: .5,  a: .8,  e: 0 },   // now: di area kosong kiri atas
    { x: 0,   y: 0,   s: 1.7, a: .11, e: 0 },   // skills: bayangan besar di belakang kata
    { x: .7,  y: 0,   s: .85, a: 1,   e: 1 },   // projects: pecah jadi tiga
    { x: 0,   y: -.05, s: 1.3, a: .24, e: 0 }   // contact: tenang, utuh lagi
  ],
  mob: [
    { x: 0,  y: .5,  s: .62, a: 1,   e: 0 },
    { x: 0,  y: .02, s: .8,  a: .8,  e: 0 },
    { x: .6, y: .7,  s: .4,  a: .5,  e: 0 },
    { x: 0,  y: 0,   s: 1.3, a: .12, e: 0 },
    { x: .72, y: .72, s: .5, a: .55, e: 1 },
    { x: 0,  y: 0,   s: 1,   a: .2,  e: 0 }
  ]
};
const secs = [$('.hero'), $('#about'), $('.now'), $('#skills'), $('#projects'), $('#contact')];
let anchors = [];
function measure() {
  anchors = secs.map((el, i) => i === 0 ? 0 : el.offsetTop + el.offsetHeight / 2 - innerHeight / 2);
  for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
}

const cur = { x: .4, y: .3, s: .74, a: 1, e: 0 };
function target(y) {
  const W = innerWidth < 860 ? WP.mob : WP.desk;
  let i = 0;
  while (i < anchors.length - 2 && y > anchors[i + 1]) i++;
  const t = ease(clamp((y - anchors[i]) / (anchors[i + 1] - anchors[i])));
  const A = W[i], B = W[i + 1];
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), s: lerp(A.s, B.s, t), a: lerp(A.a, B.a, t), e: lerp(A.e, B.e, t) };
}

const mouse = { x: 0, y: 0 }, mt = { x: 0, y: 0 };
addEventListener('pointermove', e => { mt.x = (e.clientX / innerWidth - .5) * 2; mt.y = (e.clientY / innerHeight - .5) * 2; });

let activeIdx = -1;
function updateScroll() {
  const y = scrollY;

  // hero: nama terbelah, teks memudar
  hero.style.setProperty('--p', clamp(y / innerHeight).toFixed(3));

  if (reduce) return;

  // about: foto terbuka dari bawah, kata menyala
  const ap = pinP(aboutPin);
  aboutPin.style.setProperty('--wipe', clamp(ap / .42).toFixed(3));
  const n = words.length;
  words.forEach((w, i) => w.classList.toggle('on', ap > .2 + .6 * (i / n)));

  // skills: geser ke samping
  track.style.transform = `translate3d(${(-pinP(skills) * skillDist).toFixed(1)}px,0,0)`;

  // projects: baris yang paling dekat tengah layar menyala
  let best = -1, bd = 1e9;
  projectItems.forEach((li, i) => {
    const r = li.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - innerHeight * .5);
    if (d < bd) { bd = d; best = i; }
  });
  const sr = $('#projects').getBoundingClientRect();
  const inProjects = sr.top < innerHeight * .6 && sr.bottom > innerHeight * .4;
  const idx = inProjects ? best : -1;
  if (idx !== activeIdx) {
    activeIdx = idx;
    projectItems.forEach((li, i) => li.classList.toggle('active', i === idx));
  }
}

let last = performance.now(), visible = true;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, .05); last = now;
  updateScroll();
  if (!renderer) return;

  const T = target(scrollY);
  const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
  for (const key in cur) cur[key] += (T[key] - cur[key]) * k;

  mouse.x += (mt.x - mouse.x) * .06;
  mouse.y += (mt.y - mouse.y) * .06;
  const t = now / 1000, m = reduce ? 0 : 1;

  const halfH = Math.tan(19 * Math.PI / 180) * 8, halfW = halfH * camera.aspect;
  group.position.set(cur.x * halfW, cur.y * halfH, 0);
  group.scale.setScalar(cur.s);
  group.rotation.y = mouse.x * .22 + Math.sin(scrollY * .0011) * .3 * m;
  group.rotation.x = mouse.y * .12;
  renderer.domElement.style.opacity = cur.a.toFixed(3);

  const e = cur.e, tm = t * m;
  const R = lerp(1.75, .85, e), R2 = R * R;
  const mx = (mouse.x * halfW - group.position.x) / cur.s, my = (-mouse.y * halfH - group.position.y) / cur.s;
  for (let c = 0; c < 3; c++) glow[c] += ((e > .5 && c === activeIdx ? 1 : 0) - glow[c]) * .1;

  for (let i = 0; i < N; i++) {
    const n = nodes[i];
    let x = n.bx + Math.sin(tm * n.f + n.p) * .22;
    let y = n.by + Math.cos(tm * n.f * .9 + n.q) * .22;
    let z = n.bz + Math.sin(tm * .5 + n.p) * .3;
    const kk = .3 + glow[n.k] * .08;   // tiga gugus: yang aktif sedikit lebih besar
    x = lerp(x, x * kk, e); y = lerp(y, (1 - n.k) * 2.4 + y * kk, e); z = lerp(z, z * kk, e);
    if (!reduce) {                       // titik menjauh dari kursor
      const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
      if (d2 < 2.25) { const d = Math.sqrt(d2) || .001, f = (1 - d / 1.5) * .5; x += dx / d * f; y += dy / d * f; }
    }
    n.x = x; n.y = y; n.z = z;
    ptsPos[i * 3] = x; ptsPos[i * 3 + 1] = y; ptsPos[i * 3 + 2] = z;
    const g = glow[n.k], br = .95 + g * .3;
    ptsCol[i * 3] = lerp(C1.r, C2.r, g) * br; ptsCol[i * 3 + 1] = lerp(C1.g, C2.g, g) * br; ptsCol[i * 3 + 2] = lerp(C1.b, C2.b, g) * br;
  }

  let seg = 0;
  for (let i = 0; i < N && seg < MAXSEG; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < N && seg < MAXSEG; j++) {
      const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 >= R2) continue;
      const fade = 1 - Math.sqrt(d2) / R;
      const gi = a.k === b.k ? (glow[a.k] + glow[b.k]) / 2 : 0;
      const w = fade * (1.05 + .8 * gi);
      const cr = lerp(C1.r, C2.r, gi) * w, cg = lerp(C1.g, C2.g, gi) * w, cb = lerp(C1.b, C2.b, gi) * w;
      const o = seg * 6;
      linePos[o] = a.x; linePos[o + 1] = a.y; linePos[o + 2] = a.z; linePos[o + 3] = b.x; linePos[o + 4] = b.y; linePos[o + 5] = b.z;
      lineCol[o] = lineCol[o + 3] = cr; lineCol[o + 1] = lineCol[o + 4] = cg; lineCol[o + 2] = lineCol[o + 5] = cb;
      seg++;
    }
  }
  lines.geometry.setDrawRange(0, seg * 2);
  lines.geometry.attributes.position.needsUpdate = true; lines.geometry.attributes.color.needsUpdate = true;
  pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;

  if (visible) renderer.render(scene, camera);
}
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

addEventListener('resize', resize);
addEventListener('load', resize);
resize();
requestAnimationFrame(frame);
