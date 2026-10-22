/* Version 5: the pilot (#start) and the roadmap (#roadmap), both drawn here.
   1. The pilot as thirty days: a ruler of 30 days with the three phases on it, a playhead that runs from day 1 to
      day 30, the phase it is in lit up, and one small picture for that phase: the scope set at kick-off, real requests
      passing the autopilot in daily work, hours and margin measured against today, then the decision. The phases can
      be clicked to jump there.
   2. The roadmap as a band that widens: from the pilot to one Biesterfeld the band grows, a light runs along it, and
      each milestone pops up when the light reaches it, with a tag for its scope.
   Like the film both run on their own clock (frame(t) draws everything from the time), pause off screen and show the
   end state for reduced motion. Where the page is narrow the roadmap stacks and each step appears as it scrolls in. */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b, e = p => p) => e(clamp((t - a) / (b - a)));
  const out = p => 1 - (1 - p) ** 3, io = p => (p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2), back = p => 1 + 2.5 * (p - 1) ** 3 + 1.5 * (p - 1) ** 2;
  const txt = k => window.UI_TEXT?.[lang()]?.[k] || '';

  // one clock per part: runs while the part is in view
  function clock(node, frame, start = .35) {
    let t = 0, raf = 0, last = 0;
    const tick = now => { t += Math.min(.1, (now - last) / 1000); last = now; frame(t); raf = requestAnimationFrame(tick); };
    const play = () => { if (raf || reduced) return; last = performance.now(); raf = requestAnimationFrame(tick); };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(([e]) => { if (e.isIntersecting && e.intersectionRatio >= start) play(); else if (!e.isIntersecting) pause(); }, { threshold: [0, start] }).observe(node);
    return { get t() { return t; }, set: s => { t = s; frame(t); }, seek: s => { pause(); t = s; frame(t); } };
  }

  // ------------------------------------------------------------------ 1. the pilot: thirty days
  const pilot = document.getElementById('pilot');
  if (pilot) {
    // days 1–3 kick-off, 4–27 daily work, 28–30 measured; the playhead's day for a time t
    const KEY = [[.3, 1], [1.8, 3], [2.3, 4], [6.1, 27], [6.6, 28], [7.8, 30]];
    const dayAt = t => { if (t <= KEY[0][0]) return 1; for (let i = 1; i < KEY.length; i++) if (t <= KEY[i][0]) { const [a, da] = KEY[i - 1], [b, db] = KEY[i]; return da + (db - da) * io((t - a) / (b - a)); } return 30; };
    const FLOW = () => [['envelope-simple', L('Request', 'Anfrage'), L('Offer', 'Angebot')], ['plugs-connected', L('Call-off', 'Abruf'), L('Order', 'Auftrag')], ['file-text', 'CoA', L('Sent', 'Gesendet')], ['tag', L('Price', 'Preis'), L('Scale', 'Staffel')], ['boat', 'ETA', L('Informed', 'Informiert')]];
    let el = {};
    const render = () => {
      pilot.innerHTML = `<div class="pl-card">
          <div class="pl-head"><span class="pl-k">${ph('flask')}${L('Pilot', 'Pilot')} · 30 ${L('days', 'Tage')}</span><span class="pl-day"><b data-day>1</b> / 30</span></div>
          <div class="pl-ruler"><div class="pl-ticks">${Array.from({ length: 30 }, (_, i) => `<i class="${i < 3 ? 'k' : i >= 27 ? 'm' : 'a'}"></i>`).join('')}</div><span class="pl-head-dot"><i></i></span></div>
          <div class="pl-phases">${[['flag', 'st_1', 'st_1s'], ['calendar-check', 'st_2', 'st_2s'], ['chart-line-up', 'st_3', 'st_3s']].map(([ic, a, b], i) => `<button type="button" class="pl-ph" data-ph="${i}">${ph(ic)}<span><b>${txt(a)}</b><small>${txt(b)}</small></span></button>`).join('')}</div>
          <div class="pl-stage" aria-hidden="true">
            <div class="pl-sc sc0">${[['flask', L('One grade family', 'Eine Typenfamilie')], ['users', L('One team', 'Ein Team')], ['plugs-connected', L('SAP & CRM, read-only', 'SAP & CRM, lesend')]].map(([ic, x]) => `<span class="pl-chip">${ph(ic)}${x}</span>`).join('')}</div>
            <div class="pl-sc sc1"><span class="pl-gate">${ph('sparkle')}Autopilot</span><div class="pl-lane">${FLOW().map(([ic, a, b]) => `<span class="pl-tok">${ph(ic)}<span class="a">${a}</span><span class="b">${ph('check')}${b}</span></span>`).join('')}</div></div>
            <div class="pl-sc sc2"><div class="pl-bars">${[L('Hours', 'Stunden'), L('Margin', 'Marge')].map(x => `<span class="pl-m"><small>${x}</small><span class="pl-track"><i class="base"></i><i class="now"></i></span></span>`).join('')}<span class="pl-legend"><i></i>${L('today', 'heute')}<i class="n"></i>${L('in the pilot', 'im Pilot')}</span></div><span class="pl-decide">${ph('seal-check')}${L('Decision', 'Entscheidung')}</span></div>
          </div>
        </div>`;
      const q = s => pilot.querySelector(s), qa = s => [...pilot.querySelectorAll(s)];
      el = { day: q('[data-day]'), ticks: qa('.pl-ticks i'), dot: q('.pl-head-dot'), phs: qa('.pl-ph'), sc: qa('.pl-sc'), chips: qa('.pl-chip'), toks: qa('.pl-tok'), gate: q('.pl-gate'), now: qa('.pl-track .now'), decide: q('.pl-decide') };
      frame(reduced ? 99 : c?.t ?? 0);
    };
    const frame = t => {
      if (!el.day) return;
      const d = dayAt(t), n = Math.max(1, Math.floor(d)), cur = d < 3.5 ? 0 : d < 27.5 ? 1 : 2;
      el.day.textContent = n;
      el.ticks.forEach((x, i) => x.classList.toggle('on', i < n));
      el.dot.style.left = `${(d - .5) / 30 * 100}%`;
      el.phs.forEach((p, i) => { p.classList.toggle('on', i === cur); p.classList.toggle('done', i < cur); });
      el.sc.forEach((s, i) => { const o = i === cur ? 1 : 0; s.style.opacity = o; s.style.visibility = o ? 'visible' : 'hidden'; });
      // kick-off: the scope is set, one chip at a time
      el.chips.forEach((c, i) => { const p = seg(t, .4 + i * .35, .8 + i * .35, back); c.style.opacity = seg(t, .4 + i * .35, .6 + i * .35); c.style.transform = `scale(${.7 + .3 * p})`; });
      // daily work: requests pass the autopilot and come out done, on and on
      el.toks.forEach((k, i) => {
        const x = ((t - 2.3) * .18 + i / el.toks.length) % 1, done = x > .5;
        k.style.left = `${x * 100}%`; k.style.opacity = Math.min(1, x * 8, (1 - x) * 8, Math.abs(x - .5) * 7); k.classList.toggle('done', done); // hidden while it passes the gate
      });
      el.gate.style.setProperty('--p', .5 + .5 * Math.sin(t * 5));
      // measured: hours and margin against today, then the decision
      el.now.forEach((b, i) => { b.style.transform = `scaleX(${seg(t, 6.6 + i * .25, 7.6 + i * .25, out)})`; });
      const dp = seg(t, 7.9, 8.4, back); el.decide.style.opacity = seg(t, 7.9, 8.1); el.decide.style.transform = `scale(${.6 + .4 * dp})`;
    };
    const c = clock(pilot, frame);
    pilot.addEventListener('click', e => { const b = e.target.closest('[data-ph]'); if (!b) return; const i = +b.dataset.ph; c.set([.3, 2.3, 6.6][i]); });
    pilot.addEventListener('mousedown', e => { if (e.target.closest('[data-ph]')) e.preventDefault(); });
    pilot.seek = s => c.seek(s); // for checking single frames
    render();
    window.UI?.onLang(() => requestAnimationFrame(render));
  }

  // ------------------------------------------------------------------ 2. the roadmap: a band that widens
  const road = document.getElementById('roadmap');
  if (road) {
    const STEPS = () => [
      ['Q4 2026', L('Pilot', 'Pilot'), 'flag', L('One tight grade, one inbox, 30 days. Allocation and offers, measured in hours and margin.', 'Ein knapper Werkstoff, ein Postfach, 30 Tage. Allokation und Angebote, gemessen in Stunden und Marge.'), [L('1 grade · 1 inbox', '1 Werkstoff · 1 Postfach')], true],
      ['Q1 2027', L('Order intake and documents', 'Auftragseingang und Dokumente'), 'tray-arrow-down', L('Orders, call-offs, CoA, SDS and PPWR declarations from the inbox into SAP S/4HANA, each with an approval click.', 'Bestellungen, Abrufe, CoA, SDB und PPWR-Erklärungen aus dem Postfach in SAP S/4HANA, jeweils mit einem Freigabeklick.'), ['SAP S/4HANA']],
      ['Q2 2027', L('Prices and allocations', 'Preise und Allokationen'), 'scales', L('Read producer notices, reprice open offers, share scarce supply by clear rules.', 'Herstellerschreiben lesen, offene Angebote neu bepreisen, knappes Inventar nach klaren Regeln verteilen.'), [L('Pricing rules', 'Preisregeln')]],
      ['H2 2027', L('New subsidiaries', 'Neue Gesellschaften'), 'globe-hemisphere-east', L('Italy, Türkiye, Singapore, Korea: one AI layer over inbox and ERP, before any SAP migration.', 'Italien, Türkei, Singapur, Korea: eine KI-Ebene über Postfach und ERP, noch vor jeder SAP-Migration.'), ['IT', 'TR', 'SG', 'KR']],
      ['2027+', L('One Biesterfeld', 'Ein Biesterfeld'), 'users-three', L('One sales cockpit connected to Biesterfeld CRM across divisions. Every approval teaches the system.', 'Ein Vertriebscockpit mit Anbindung an das Biesterfeld CRM für alle Geschäftsbereiche. Jede Freigabe macht das System besser.'), [L('All divisions', 'Alle Geschäftsbereiche')]],
    ];
    let el = {}, geo = null;
    const render = () => {
      road.innerHTML = `<div class="wrap">
          <h2 class="h2 rm-h reveal in">${txt('h2_roadmap') || L('From Q4 2026 into 2027.', 'Von Q4 2026 ins Jahr 2027.')}</h2>
          <div class="rb">
            <svg class="rb-band" aria-hidden="true"><defs><linearGradient id="rb-g" x1="0" x2="1"><stop offset="0" stop-color="rgb(var(--d-rgb))" stop-opacity=".95"/><stop offset="1" stop-color="rgb(var(--d-rgb))" stop-opacity=".28"/></linearGradient><linearGradient id="rb-s" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="rb-c"><rect class="rb-clip" x="0" y="0" width="0" height="400"/></clipPath></defs>
              <path class="rb-ghost"/><g clip-path="url(#rb-c)"><path class="rb-fill" fill="url(#rb-g)"/><path class="rb-shine" fill="url(#rb-s)"/></g><circle class="rb-head" r="7"/></svg>
            <span class="rb-goal">${ph('arrow-right')}${L('One platform for the group', 'Eine Plattform für die Gruppe')}</span>
            <ol class="rb-steps">${STEPS().map(([q, ti, ic, d, tags, now], i) => `<li class="${now ? 'now' : ''}">
              <span class="rb-q">${q}${now ? `<em>${L('Now', 'Jetzt')}</em>` : ''}</span>
              <span class="rb-dot">${ph(ic)}</span>
              <b>${ti}</b><span class="rb-tags">${tags.map(x => `<i>${x}</i>`).join('')}</span><p>${d}</p></li>`).join('')}</ol>
          </div>
        </div>`;
      const q = s => road.querySelector(s), qa = s => [...road.querySelectorAll(s)];
      el = { box: q('.rb'), svg: q('.rb-band'), ghost: q('.rb-ghost'), fill: q('.rb-fill'), shine: q('.rb-shine'), clip: q('.rb-clip'), head: q('.rb-head'), goal: q('.rb-goal'), steps: qa('.rb-steps li'), dots: qa('.rb-dot') };
      layout(); frame(reduced ? 99 : c?.t ?? 0);
      stepIO.disconnect(); el.steps.forEach(s => stepIO.observe(s));
    };
    // the band: through the centre of each milestone, a little wider at each one, out to the right edge
    const layout = () => {
      if (!el.box) return;
      const B = el.box.getBoundingClientRect(), W = B.width;
      const pts = el.dots.map(d => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2 - B.left, r.top + r.height / 2 - B.top]; });
      if (!pts.length || !W) return;
      const cy = pts[0][1], th = i => 5 + i * 9, xs = [0, ...pts.map(p => p[0]), W], ts = [3, ...pts.map((_, i) => th(i)), th(pts.length)];
      let top = `M${xs[0]} ${cy - ts[0] / 2}`, bot = '';
      for (let i = 1; i < xs.length; i++) { const mx = (xs[i - 1] + xs[i]) / 2; top += `C${mx} ${cy - ts[i - 1] / 2} ${mx} ${cy - ts[i] / 2} ${xs[i]} ${cy - ts[i] / 2}`; }
      for (let i = xs.length - 1; i > 0; i--) { const mx = (xs[i - 1] + xs[i]) / 2; bot += `C${mx} ${cy + ts[i] / 2} ${mx} ${cy + ts[i - 1] / 2} ${xs[i - 1]} ${cy + ts[i - 1] / 2}`; }
      const d = `${top}L${xs[xs.length - 1]} ${cy + ts[ts.length - 1] / 2}${bot}Z`;
      el.svg.setAttribute('viewBox', `0 0 ${W} ${B.height}`);
      [el.ghost, el.fill, el.shine].forEach(p => p.setAttribute('d', d));
      el.head.setAttribute('cy', cy);
      el.goal.style.top = `${cy - ts[ts.length - 1] / 2 - 34}px`;
      geo = { W, xs: pts.map(p => p[0]) };
    };
    const narrow = matchMedia('(max-width: 960px)');
    const RUN = [.3, 4.2];
    const frame = t => {
      if (!el.box || !geo) return;
      const p = seg(t, RUN[0], RUN[1], io), x = p * geo.W;
      el.clip.setAttribute('width', x);
      el.head.setAttribute('cx', x); el.head.style.opacity = p < 1 ? 1 : 1 - seg(t, RUN[1], RUN[1] + .6);
      el.goal.style.opacity = seg(t, RUN[1] - .2, RUN[1] + .4);
      if (narrow.matches) return; // stacked: the steps show as they scroll in
      el.steps.forEach((s, i) => {
        const at = RUN[0] + (RUN[1] - RUN[0]) * clamp(geo.xs[i] / geo.W), a = seg(t, at - .1, at + .45, out), b = seg(t, at - .1, at + .4, back);
        s.style.setProperty('--on', a); s.style.setProperty('--pop', b);
      });
    };
    const stepIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && narrow.matches) { e.target.style.setProperty('--on', 1); e.target.style.setProperty('--pop', 1); } }), { threshold: .4 });
    const c = clock(road, frame, .3);
    road.seek = s => c.seek(s); // for checking single frames
    render();
    new ResizeObserver(() => { layout(); frame(reduced ? 99 : c.t); }).observe(road);
    document.fonts?.ready.then(() => { layout(); frame(reduced ? 99 : c.t); });
    window.UI?.onLang(() => requestAnimationFrame(render));
  }
})();
