/* Beauty version hero: a field of polymer granules.
   Orange (masterbatch) pellets are demand, milky natural pellets are supply. Each cloud swells and thins on its own
   rhythm (call-offs, seasons / price, force majeure); a few pellets reach for the middle and turn back. They never pair.
   Pellets shy away from the cursor. Paused when off-screen; one still frame under reduced motion. */
(() => {
  const cv = document.getElementById('granules'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, pellets = [], sprites = {}, mouse = { x: -1e4, y: -1e4 }, running = false, raf = 0;
  const t0 = performance.now();
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const gauss = (i, k) => Math.sqrt(-2 * Math.log(rnd(i, k) || 1e-6)) * Math.cos(6.283 * rnd(i, k + 1));

  function sprite(kind) {
    const w = 22, h = 15, pad = 6, s = 3; // drawn at 3x for crisp scaling
    const c = document.createElement('canvas'); c.width = (w + pad * 2) * s; c.height = (h + pad * 2) * s;
    const g = c.getContext('2d'); g.scale(s, s); g.translate(pad + w / 2, pad + h / 2);
    // soft contact shadow
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(1.5, 3, w / 2, h / 2.2, 0, 0, 6.283); g.filter = 'blur(2px)'; g.fill(); g.filter = 'none';
    const grad = g.createRadialGradient(-w * .18, -h * .22, 1, 0, 0, w * .62);
    const cs = getComputedStyle(document.documentElement), v = (n, f) => cs.getPropertyValue(n).trim() || f;
    if (kind === 'd') { grad.addColorStop(0, v('--pd-hi', '#ffc2a1')); grad.addColorStop(.35, v('--pd-mid', '#f5874f')); grad.addColorStop(.8, v('--pd-lo', '#cf5320')); grad.addColorStop(1, v('--pd-edge', '#8f3612')); }
    else { grad.addColorStop(0, v('--ps-hi', 'rgba(255,255,255,.98)')); grad.addColorStop(.4, v('--ps-mid', 'rgba(229,236,243,.9)')); grad.addColorStop(.85, v('--ps-lo', 'rgba(176,194,210,.78)')); grad.addColorStop(1, v('--ps-edge', 'rgba(120,140,160,.7)')); }
    g.fillStyle = grad; g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, 6.283); g.fill();
    // the cut face of a strand-cut granule, and a specular highlight
    g.strokeStyle = kind === 'd' ? v('--pd-rim', 'rgba(255,214,190,.35)') : 'rgba(255,255,255,.55)'; g.lineWidth = .8;
    g.beginPath(); g.ellipse(w * .22, 0, w * .12, h * .38, 0, 0, 6.283); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-w * .17, -h * .2, w * .14, h * .08, -.4, 0, 6.283); g.fill();
    return { img: c, w: w + pad * 2, h: h + pad * 2 };
  }

  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const narrow = W < 760;
    const homes = narrow ? { d: [W * .3, H * .37], s: [W * .72, H * .66] } : { d: [W * .27, H * .5], s: [W * .73, H * .5] };
    const R = Math.min(W, H) * (narrow ? .2 : .17);
    const n = Math.round(Math.max(150, Math.min(340, W * H / 4200)));
    pellets = Array.from({ length: n }, (_, i) => {
      const side = i % 2 ? 's' : 'd', [hx, hy] = homes[side];
      const hxp = hx + gauss(i, 1) * R * .9, hyp = hy + gauss(i, 3) * R * .55;
      const old = pellets[i];
      return { side, hx: hxp, hy: hyp, x: old ? old.x : hxp, y: old ? old.y : hyp, vx: 0, vy: 0, rot: rnd(i, 5) * 6.28, vr: (rnd(i, 6) - .5) * .02,
        sc: .55 + rnd(i, 7) * .75, rank: rnd(i, 8), seed: rnd(i, 9), a: old ? old.a : 0, out: rnd(i, 10) * 6.283 };
    });
    sprites = { d: sprite('d'), s: sprite('s') };
  }

  // how full each cloud is right now
  const demandFill = t => Math.min(1, Math.max(.12, .42 + .2 * Math.sin(t * .33) + .38 * Math.max(0, Math.sin(t * .9)) ** 14 + .25 * Math.max(0, Math.sin(t * .41 + 2)) ** 20));
  const supplyFill = t => Math.min(1, Math.max(.1, .66 + .1 * Math.sin(t * .8) + .06 * Math.sin(t * 2.1) - (Math.sin(t * .23 + 1) > .72 ? .42 : 0)));

  function frame(now) {
    const t = (now - t0) / 1000;
    const fill = { d: demandFill(t), s: supplyFill(t) };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of pellets) {
      const active = p.rank < fill[p.side];
      let tx, ty;
      if (active) {
        // a few reach for the middle and turn back
        const reach = Math.max(0, Math.sin(t * .45 + p.seed * 40)) ** 30;
        tx = p.hx + Math.sin(t * .7 + p.seed * 9) * 8 + (W / 2 - p.hx) * reach * .82;
        ty = p.hy + Math.cos(t * .6 + p.seed * 7) * 8 + (H * .5 - p.hy) * reach * .3;
      } else {
        tx = p.hx + Math.cos(p.out) * Math.min(W, H) * .32; ty = p.hy + Math.sin(p.out) * Math.min(W, H) * .22;
      }
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 9000) { const f = (9000 - d2) / 9000 * 1.6; p.vx += dx / Math.sqrt(d2 + 1) * f; p.vy += dy / Math.sqrt(d2 + 1) * f; }
      p.vx = (p.vx + (tx - p.x) * .012) * .88; p.vy = (p.vy + (ty - p.y) * .012) * .88;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr + p.vx * .004;
      p.a += ((active ? 1 : 0) - p.a) * .05;
      if (p.a < .02) continue;
      const s = sprites[p.side], k = p.sc;
      ctx.globalAlpha = p.a * (.55 + p.sc * .45);
      ctx.setTransform(dpr * Math.cos(p.rot) * k, dpr * Math.sin(p.rot) * k, -dpr * Math.sin(p.rot) * k, dpr * Math.cos(p.rot) * k, p.x * dpr, p.y * dpr);
      ctx.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
    }
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(frame);
  }

  function settle() { for (let i = 0; i < 160; i++) frame(t0 + 4000 + i * 16); } // start from a formed picture, not an empty one
  layout(); running = false; settle();
  new ResizeObserver(() => { layout(); if (!running) frame(performance.now()); }).observe(cv);
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting && !reduced;
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(frame);
  }).observe(cv);
  const hero = cv.parentNode;
  hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
})();
