/* Version 2: the same content as version 1, arranged for a CFO reading it the first time.
   1. "In one minute": the problem, what it does, what it is worth (live from the value calculator) and the ask.
   2. The "show more" buttons that value.js and workday.js render when window.PAGE asks for the compact layout:
      details stay one click away, and stay open across a language switch.
   3. A guide through the demo: a bouncing pointer shows the next click ("Start here", then "Now match"). Anyone who
      scrolls on to the result without clicking gets the sample data loaded and matched for them, so the chart is never
      empty. That never happens over the visitor's own upload, live call or API data. */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;

  // ------------------------------------------------------------------ in one minute, as a flow
  // Four cards hang on one line. When the section comes into view a pulse runs along it from 01 to 04 and switches
  // each card on; every card has a small live picture: requests scattered on five channels, one request matched
  // against stock and drafted, the yearly value counting up and splitting into hours and follow-ups, a 30-day pilot
  // filling day by day. Like the film it runs on one clock (frame(t) draws everything from the time), so a language
  // switch or a new value just redraws at the same moment. Off screen it pauses; reduced motion shows the end state.
  const host = document.getElementById('brief');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b, e = p => p) => e(clamp((t - a) / (b - a)));
  const out = p => 1 - (1 - p) ** 3, io = p => (p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2), back = p => 1 + 2.5 * (p - 1) ** 3 + 1.5 * (p - 1) ** 2;
  // the pulse reaches card i at AT(i); where the cards stack (no line), each card starts when it comes into view itself
  const RUN = 3, narrow = matchMedia('(max-width: 1100px)'), seen = [];
  const AT = i => (narrow.matches ? seen[i] ?? 1e9 : .4 + RUN * i / 3);
  let el = {}, t = 0, raf = 0, last = 0, total = 0, split = .6;

  // the pictures
  const CHIPS = () => [['envelope-simple', L('30 t PP?', '30 t PP?'), 6, 14], ['whatsapp-logo', L('By Friday!', 'Bis Freitag!'), 52, 4], ['phone', L('Price ABS?', 'Preis ABS?'), 62, 52], ['file-text', L('CoA please', 'CoA bitte'), 4, 60], ['plugs-connected', L('Call-off 5 t', 'Abruf 5 t'), 30, 36], ['envelope-simple', 'ETA?', 74, 28]];
  const vis = i => [
    `<div class="fl-chips">${CHIPS().map(([ic, txt, x, y]) => `<span class="fl-chip" style="left:${x}%;top:${y}%">${ph(ic)}${txt}</span>`).join('')}<span class="fl-badge">47 ${L('open', 'offen')}</span></div>`,
    `<div class="fl-match"><span class="fl-req">${ph('envelope-simple')}<span>${L('Request', 'Anfrage')}<b>30 t PP</b></span></span><span class="fl-wire"><i></i></span><span class="fl-stock">${ph('package')}<span>${L('Stock', 'Bestand')}<b>22 t ${L('free', 'frei')}</b></span></span>
      <span class="fl-draft">${ph('check-circle')}${L('Draft ready, data sheet attached', 'Entwurf fertig, Datenblatt anbei')}</span></div>`,
    `<div class="fl-split"><span class="fl-bar"><i class="a"></i><i class="b"></i></span><span class="fl-leg"><span><i class="a"></i>${L('Hours', 'Stunden')} <b data-v="a"></b></span><span><i class="b"></i>${L('Follow-ups', 'Nachfassen')} <b data-v="b"></b></span></span></div>`,
    `<div class="fl-days"><span class="fl-grid">${Array.from({ length: 30 }, () => '<i></i>').join('')}</span><span class="fl-dl"><span>Kick-off</span><b data-day></b><span>${L('Measured', 'Gemessen')}</span></span></div>`,
  ][i];

  function brief() {
    if (!host) return;
    const V = window.BFValue, r = V?.calc(), eur = V?.eur || (v => v);
    total = r ? r.cost + r.guide : 0; split = r && total ? r.cost / total : .6;
    const cards = [
      [L('The problem', 'Das Problem'), L('Scarce supply, scattered requests', 'Knappes Inventar, verstreute Anfragen'),
        L('Allocated quantities, moving prices, requests on five channels.', 'Zugeteilte Mengen, schwankende Preise, Anfragen auf fünf Kanälen.'), null],
      [L('What it does', 'Was es tut'), L('Every request against stock', 'Jede Anfrage gegen den Bestand'),
        L('Reads, matches, drafts. A person approves.', 'Liest, gleicht ab, entwirft. Ein Mensch gibt frei.'), ['#how', L('Try it', 'Ausprobieren')]],
      [L('What it is worth', 'Was es bringt'), r ? `<span data-total>${eur(total)}</span><small>${L('a year', 'pro Jahr')}</small>` : '',
        r ? L(`${eur(r.cost)} in hours, ${eur(r.guide)} from follow-ups. Every value is adjustable.`, `${eur(r.cost)} an Stunden, ${eur(r.guide)} aus Nachfassen. Jeder Wert ist einstellbar.`) : '', ['#value', L('Check the numbers', 'Zahlen prüfen')], 'acc'],
      [L('The ask', 'Der Vorschlag'), L('A 30-day pilot', 'Ein 30-Tage-Pilot'),
        L('One grade family, one team, measured in hours and margin.', 'Eine Typenfamilie, ein Team, gemessen in Stunden und Marge.'), ['#roadmap', L('See the plan', 'Plan ansehen')]],
    ];
    host.innerHTML = `<div class="wrap">
      <h2 class="h2 br-h">${L('The case in one minute.', 'Der Fall in einer Minute.')}</h2>
      <div class="fl">
        <div class="fl-rail" aria-hidden="true"><span class="fl-line"><i class="fl-fill"></i><i class="fl-dot"></i></span>${cards.map((_, i) => `<span class="fl-node"><b>${String(i + 1).padStart(2, '0')}</b></span>`).join('')}</div>
        <ol class="fl-cards">${cards.map(([k, ti, d, link, cls], i) => `<li class="fl-card ${cls || ''}">
          <div class="fl-vis" aria-hidden="true">${vis(i)}</div>
          <small class="v5-bk"><span class="fl-n">${String(i + 1).padStart(2, '0')}</span>${k}</small><b>${ti}</b><p>${d}</p>
          ${link ? `<a class="br-link" href="${link[0]}">${link[1]}${ph('arrow-down')}</a>` : ''}</li>`).join('')}</ol>
      </div>
    </div>`;
    const q = s => host.querySelector(s), qa = s => [...host.querySelectorAll(s)];
    el = { fill: q('.fl-fill'), dot: q('.fl-dot'), nodes: qa('.fl-node'), cards: qa('.fl-card'), chips: qa('.fl-chip'), badge: q('.fl-badge'),
      req: q('.fl-req'), wire: q('.fl-wire i'), stock: q('.fl-stock'), draft: q('.fl-draft'), barA: q('.fl-bar .a'), barB: q('.fl-bar .b'), leg: qa('.fl-leg > span'),
      va: q('[data-v="a"]'), vb: q('[data-v="b"]'), total: q('[data-total]'), days: qa('.fl-grid i'), day: q('[data-day]'), eur, r };
    frame(reduced ? 99 : t);
    cardIO?.disconnect(); el.cards.forEach(c => cardIO?.observe(c));
  }

  const put = (n, tr, op) => { if (!n) return; if (tr != null) n.style.transform = tr; if (op != null) n.style.opacity = op; };
  function frame(time) {
    t = time; if (!el.cards) return;
    const p = seg(t, AT(0), AT(3), io);
    put(el.fill, `scaleX(${p})`); if (el.dot) { el.dot.style.left = `${p * 100}%`; el.dot.style.opacity = t < AT(3) + .6 ? 1 : 1 - seg(t, AT(3) + .6, AT(3) + 1.2); }
    el.cards.forEach((c, i) => { const on = seg(t, AT(i) - .05, AT(i) + .45, out); c.style.setProperty('--on', on); el.nodes[i]?.style.setProperty('--on', on); });
    // 1. requests pop in all over the place and keep drifting
    const a0 = t - AT(0);
    el.chips.forEach((c, i) => { const s = seg(a0, .08 * i, .08 * i + .45, back); put(c, `translate(${6 * Math.sin(t * .7 + i * 1.9)}px, ${5 * Math.cos(t * .9 + i * 1.3)}px) scale(${.6 + .4 * s})`, seg(a0, .08 * i, .08 * i + .2)); });
    put(el.badge, `scale(${.6 + .4 * seg(a0, .6, 1, back)})`, seg(a0, .6, .8));
    // 2. one request matched against stock and drafted, again and again
    const u = Math.max(0, t - AT(1)) % 4.2, fadeOut = 1 - seg(u, 3.6, 4.1);
    put(el.req, `translateX(${-14 * (1 - seg(u, 0, .5, out))}px)`, seg(u, 0, .3) * fadeOut);
    put(el.wire, `scaleX(${seg(u, .5, 1.1, io)})`, fadeOut);
    if (el.stock) { el.stock.style.setProperty('--hit', seg(u, 1.05, 1.35) * (1 - seg(u, 2.2, 2.8))); put(el.stock, null, seg(u, .2, .5) * fadeOut); }
    put(el.draft, `translateY(${8 * (1 - seg(u, 1.4, 1.9, back))}px)`, seg(u, 1.4, 1.7) * fadeOut);
    // 3. the value counts up and splits into hours and follow-ups
    const a2 = t - AT(2), c = seg(a2, .1, 1.6, out);
    if (el.total && el.r) el.total.textContent = el.eur(Math.round(total * c / 1000) * 1000);
    put(el.barA, `scaleX(${split * seg(a2, .3, 1.4, out)})`); put(el.barB, `translateX(${split * 100}%) scaleX(${(1 - split) * seg(a2, .9, 1.9, out)})`);
    el.leg.forEach((n, i) => put(n, null, seg(a2, .8 + i * .5, 1.2 + i * .5)));
    if (el.va && el.r) { el.va.textContent = el.eur(el.r.cost); el.vb.textContent = el.eur(el.r.guide); }
    // 4. thirty days fill up, then a check
    const a3 = t - AT(3), n = Math.round(30 * seg(a3, .2, 2, io));
    el.days.forEach((d, i) => d.classList.toggle('on', i < n));
    if (el.day) el.day.textContent = n >= 30 ? L('Decision', 'Entscheidung') : `${L('Day', 'Tag')} ${Math.max(n, 1)} / 30`;
  }
  function tick(now) { frame(t + Math.min(.1, (now - last) / 1000)); last = now; raf = requestAnimationFrame(tick); }
  const play = () => { if (raf || reduced) return; last = performance.now(); raf = requestAnimationFrame(tick); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  const cardIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const i = el.cards.indexOf(e.target); if (e.isIntersecting && seen[i] == null) seen[i] = t + .15; }), { threshold: .5 }) : null;
  if (host) host.seek = s => { pause(); frame(s); }; // for checking single frames
  if (host) new IntersectionObserver(([e]) => { if (e.isIntersecting && (e.intersectionRatio >= .35 || narrow.matches)) play(); else if (!e.isIntersecting) pause(); }, { threshold: [0, .35] }).observe(host);

  // ------------------------------------------------------------------ show more
  const open = {};
  function set(b, on) {
    open[b.dataset.key] = on;
    b.nextElementSibling?.classList.toggle('open', on);
    b.setAttribute('aria-expanded', on);
    b.querySelector('span').textContent = on ? b.dataset.opened : b.dataset.closed;
  }
  document.addEventListener('click', e => { const b = e.target.closest('.pg-more-btn'); if (b) set(b, !open[b.dataset.key]); });
  const restore = () => document.querySelectorAll('.pg-more-btn').forEach(b => { if (open[b.dataset.key]) set(b, true); });

  // ------------------------------------------------------------------ guide through the demo
  const demo = () => window.UI?.demo;
  const ARROW = { left: 'arrow-left', up: 'arrow-up', down: 'arrow-down' }; // the arrow points at the button
  function nudge(el, text, dir) {
    if (!el) return;
    let n = el.querySelector(':scope > .nudge');
    if (!text) { n?.remove(); el.classList.remove('has-nudge'); return; }
    if (!n) { n = document.createElement('span'); n.className = 'nudge'; n.setAttribute('aria-hidden', 'true'); el.append(n); el.classList.add('has-nudge'); }
    n.dataset.dir = dir; n.innerHTML = `${ph(ARROW[dir])}<span>${text}</span>`;
  }
  function guide() {
    const d = demo(); if (!d) return;
    const stage = d.matched ? 'done' : d.loaded ? 'match' : 'start', start = stage === 'start' && L('Start here', 'Hier starten');
    nudge(document.getElementById('sample-all'), start, 'left');
    nudge(document.getElementById('sample-run'), start, 'down');
    nudge(document.getElementById('run'), stage === 'match' && L('Now match', 'Jetzt abgleichen'), 'up');
  }
  let auto = false;
  const result = document.getElementById('result');
  if (result) new IntersectionObserver(async ([e]) => {
    const d = demo(); if (!e.isIntersecting || auto || !d || d.matched || d.own) return;
    auto = true;
    if (!d.loaded) await d.loadSample();
    if (demo().matched) return; // the visitor clicked Match meanwhile
    d.run();
    result.querySelector('.chart-bar')?.insertAdjacentHTML('beforeend', `<span class="auto-note">${ph('sparkle')}<span data-auto>${autoText()}</span></span>`);
  }, { rootMargin: '0px 0px -25% 0px' }).observe(result);
  const autoText = () => `${L('Sample data, loaded for you.', 'Beispieldaten, für Sie geladen.')} <a href="#how">${L('Use your own export', 'Eigenen Export nutzen')}</a>`;

  brief(); guide();
  document.addEventListener('bf:value', () => brief());
  document.addEventListener('bf:loaded', guide);
  document.addEventListener('bf:matched', guide);
  window.UI?.onLang(() => requestAnimationFrame(() => { brief(); restore(); guide(); document.querySelectorAll('[data-auto]').forEach(x => { x.innerHTML = autoText(); }); }));
})();
