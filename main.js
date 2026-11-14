// Scroll-driven page. Satu kristal 3D ringan di layer tetap, berpindah mengikuti bagian yang sedang dibaca.
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

let scene, camera, group, core, shell, ring, shards = [];
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

  core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1),
    new THREE.MeshStandardMaterial({ color: C1, roughness: .32, metalness: .3, flatShading: true }));
  shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.15, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .16 }));
  ring = new THREE.Mesh(new THREE.TorusGeometry(3, .012, 8, 160),
    new THREE.MeshBasicMaterial({ color: C2, transparent: true, opacity: .6 }));
  ring.rotation.x = Math.PI / 2.4;
  group.add(core, shell, ring);

  // tiga serpihan = tiga proyek
  [new THREE.OctahedronGeometry(.3), new THREE.TetrahedronGeometry(.36), new THREE.BoxGeometry(.4, .4, .4)].forEach((g, i) => {
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: [C2, 0xffffff, C1][i], roughness: .3, metalness: .3, flatShading: true, emissive: C2, emissiveIntensity: 0
    }));
    m.userData = { r: 2.9 + i * .25, sp: .5 + i * .18, o: i * 2.1, s: 1 };
    group.add(m); shards.push(m);
  });

  scene.add(new THREE.AmbientLight(0xffffff, .5));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 5, 6); scene.add(key);
  const rim = new THREE.PointLight(C2, 1.5, 20); rim.position.set(-5, -2, 3); scene.add(rim);
  const fill = new THREE.PointLight(C1, .9, 20); fill.position.set(5, -4, 2); scene.add(fill);
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
    { x: .4,  y: .3,  s: .74, a: 1,   e: 0 },   // hero
    { x: .52, y: 0,   s: 1.15, a: .95, e: 0 },  // about: mengintip dari balik foto
    { x: .5,  y: .1,  s: .62, a: .9,  e: 0 },   // now
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
  group.rotation.y = mouse.x * .35 + scrollY * .0013 * m;
  group.rotation.x = mouse.y * .22;
  renderer.domElement.style.opacity = cur.a.toFixed(3);

  const e = cur.e;
  core.rotation.x += dt * .18 * m; core.rotation.y += dt * .26 * m;
  core.scale.setScalar(lerp(1, .62, e));
  shell.rotation.x -= dt * .08 * m; shell.rotation.y -= dt * .12 * m;
  shell.scale.setScalar(lerp(1, 1.3, e)); shell.material.opacity = lerp(.16, .06, e);
  ring.rotation.z += dt * (.15 + (1 - e) * 0) * m; ring.material.opacity = lerp(.6, .2, e);

  shards.forEach((s, i) => {
    const d = s.userData, a = t * d.sp * m + d.o;
    const ox = Math.cos(a) * d.r, oy = Math.sin(a * .8) * 1.3, oz = Math.sin(a) * d.r * .6;
    const cx = 2.5, cy = (1 - i) * 1.6, cz = .3;
    s.position.set(lerp(ox, cx, e), lerp(oy, cy, e), lerp(oz, cz, e));
    const on = e > .5 && i === activeIdx;
    const ts = e > .5 ? (on ? 2.1 : .8) : 1;
    d.s += (ts - d.s) * .12;
    s.scale.setScalar(d.s);
    s.material.emissiveIntensity += ((on ? .9 : 0) - s.material.emissiveIntensity) * .12;
    s.rotation.x += dt * 1.2 * m; s.rotation.y += dt * .9 * m;
  });

  if (visible) renderer.render(scene, camera);
}
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

addEventListener('resize', resize);
addEventListener('load', resize);
resize();
requestAnimationFrame(frame);
