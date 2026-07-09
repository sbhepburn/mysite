/* stirlinghepburn.com — theme, cursor, scroll reveals, Three.js hero */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

/* ==================== Theme ==================== */

const THEME_COLORS = {
  dark: {
    wire: 0xf08a3c,
    inner: 0x4a3522,
    particles: 0x8cc9f0,
    fog: 0x1c130d,
  },
  light: {
    wire: 0xc2590f,
    inner: 0xe0d2bd,
    particles: 0x1f6fa8,
    fog: 0xfaf4ea,
  },
};

const themeToggle = document.getElementById('theme-toggle');

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('theme', next);
  } catch (e) { /* private mode — theme just won't persist */ }
  applyTheme(next);
});

// Follow OS changes unless the user has chosen explicitly
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
  if (!stored) applyTheme(e.matches ? 'light' : 'dark');
});

applyTheme(currentTheme());

/* ==================== Footer year ==================== */

document.getElementById('year').textContent = new Date().getFullYear();

/* ==================== Custom cursor + magnetic hovers ==================== */

if (finePointer && !prefersReducedMotion) {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  document.body.classList.add('has-custom-cursor');

  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }, { passive: true });

  (function followLoop() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(followLoop);
  })();

  const hoverables = 'a, button, .work-card, .cap-card, input, textarea';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(hoverables)) document.body.classList.add('cursor-hovering');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(hoverables)) document.body.classList.remove('cursor-hovering');
  });

  // Magnetic pull on tagged elements
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 0.3;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 400);
    });
  });

  // Gentle tilt on work cards
  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

/* ==================== GSAP scroll reveals ==================== */

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words
    .map((w) => `<span class="word-mask" style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span class="word" style="display:inline-block;">${w}</span></span>`)
    .join(' ');
}

if (!prefersReducedMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.split-words').forEach((el) => {
    splitWords(el);
    gsap.from(el.querySelectorAll('.word'), {
      yPercent: 110,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Grid children animate as a staggered group below, not individually
  document.querySelectorAll('.reveal, .reveal-line').forEach((el) => {
    if (el.closest('.cap-grid, .work-grid')) return;
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  document.querySelectorAll('.work-grid').forEach((grid) => {
    gsap.from(grid.children, {
      y: 36,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
    });
  });

  // Capability cards: fade in as a squared-up deck, then fan open.
  // GSAP must not touch the cards' own transforms — CSS owns the fan.
  const capGrid = document.querySelector('.cap-grid');
  if (capGrid) {
    capGrid.classList.add('fan-stacked');
    gsap.from(capGrid, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: capGrid, start: 'top 88%', once: true },
    });
    ScrollTrigger.create({
      trigger: capGrid,
      start: 'top 70%',
      once: true,
      onEnter: () => capGrid.classList.remove('fan-stacked'),
    });
  }
}

/* ==================== Three.js hero ==================== */

(async function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const hero = document.querySelector('.hero');
  if (!canvas || prefersReducedMotion) return;
  if (navigator.connection && navigator.connection.saveData) return;

  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (e) {
    return; // CDN unavailable — CSS gradient fallback stays visible
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    return; // no WebGL — fallback stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 7;

  const colors = THEME_COLORS[currentTheme()];

  // Wireframe icosahedron — the "craftsman polyhedron"
  const wireMat = new THREE.MeshBasicMaterial({ color: colors.wire, wireframe: true, transparent: true, opacity: 0.55 });
  const shape = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), wireMat);
  scene.add(shape);

  const innerMat = new THREE.MeshBasicMaterial({ color: colors.inner, transparent: true, opacity: 0.18 });
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 0), innerMat);
  scene.add(inner);

  // Drifting particle field
  const COUNT = 350;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 18;
    positions[i + 1] = (Math.random() - 0.5) * 11;
    positions[i + 2] = (Math.random() - 0.5) * 7 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: colors.particles, size: 0.035, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  document.addEventListener('themechange', (e) => {
    const c = THEME_COLORS[e.detail.theme];
    wireMat.color.setHex(c.wire);
    innerMat.color.setHex(c.inner);
    pMat.color.setHex(c.particles);
  });

  // Pointer parallax (eased)
  let targetX = 0;
  let targetY = 0;
  addEventListener('pointermove', (e) => {
    targetX = (e.clientX / innerWidth - 0.5) * 2;
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  // Render only while visible and tab is active
  let inView = true;
  let rafId = null;
  const clock = new THREE.Clock();

  function frame() {
    const t = clock.getElapsedTime();
    shape.rotation.y = t * 0.12 + targetX * 0.45;
    shape.rotation.x = t * 0.07 + targetY * 0.35;
    inner.rotation.y = -t * 0.09 + targetX * 0.25;
    inner.rotation.x = -t * 0.05 + targetY * 0.2;
    particles.rotation.y = t * 0.012 + targetX * 0.05;
    shape.position.x = targetX * 0.35;
    shape.position.y = -targetY * 0.25;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function setRunning(run) {
    if (run && rafId === null) {
      clock.start();
      rafId = requestAnimationFrame(frame);
    } else if (!run && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      clock.stop();
    }
  }

  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    setRunning(inView && !document.hidden);
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    setRunning(inView && !document.hidden);
  });

  hero.classList.add('canvas-live');
  setRunning(true);
})();

/* ==================== Contact form (mailto, no backend) ==================== */

const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const biz = form.elements.business.value.trim();
    const msg = form.elements.message.value.trim();
    const subject = encodeURIComponent(`Website project${biz ? ' — ' + biz : ''}`);
    const body = encodeURIComponent(
      `Hi Stirling,\n\n${msg}\n\n— ${name}${biz ? `\n${biz}` : ''}`
    );
    location.href = `mailto:stirhep@gmail.com?subject=${subject}&body=${body}`;
  });
}
