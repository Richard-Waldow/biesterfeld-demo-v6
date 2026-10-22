/* Version 5: #custom, right after the product demo. What you just tried is the base product; every solution is
   customised. Drawn as a kit that builds itself: base product + customisation = your solution, where "your solution"
   is a small Biesterfeld app that assembles as the section comes into view.
   1. the base modules light up one by one and appear as rows in the app's menu;
   2. the four customisations switch on one by one and each visibly changes the app: rules in the main view, the
      systems connected at the bottom, a role switch at the top, extra modules marked "new" in the menu;
   3. the seal "Your solution" lands on the app.
   Afterwards every module and customisation can be switched off and on by click. Like the film and the one-minute
   case it runs on one clock (frame(t) draws everything from the time), pauses off screen, and shows the end state
   for reduced motion. A click overrides the clock for that one item. */
(() => {
  const host = document.getElementById('custom'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const base = window.SHARED_BASE || '../shared/';
  const mask = (n, c) => `<span class="cu-mask" style="--m:url('${new URL(`${base}logos/${n}.svg`, document.baseURI).href}');--c:${c}"></span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b, e = p => p) => e(clamp((t - a) / (b - a)));
  const out = p => 1 - (1 - p) ** 3, back = p => 1 + 2.5 * (p - 1) ** 3 + 1.5 * (p - 1) ** 2;

  const BASE = () => [['sun-horizon', L('My workday', 'Mein Arbeitstag')], ['file-text', L('Offers & price scales', 'Angebote & Preisstaffeln')], ['receipt', L('Orders', 'Aufträge')], ['target', 'Demand Match'], ['megaphone', L('Pushed products', 'Push-Produkte')], ['package', L('Scarce supply', 'Knappes Inventar')], ['calendar-check', 'Check-ins'], ['kanban', L('Pipeline planning', 'Pipeline-Planung')], ['sparkle', 'Biesterfeld GPT']];
  const CUSTOM = () => [
    ['flow-arrow', L('Your processes & rules', 'Ihre Prozesse & Regeln'), L('Your way of working', 'So wie Sie arbeiten'), L('Approval steps, price floors, allocation rules, escalations: the way Biesterfeld works, not the way a tool wants it.', 'Freigabestufen, Preisuntergrenzen, Allokationsregeln, Eskalationen: so wie Biesterfeld arbeitet, nicht wie ein Tool es will.')],
    ['plugs-connected', L('Your systems & data', 'Ihre Systeme & Daten'), L('Read-only, nothing migrated', 'Lesend, nichts migriert'), L('SAP S/4HANA, Biesterfeld CRM, B GPT, customer portals. Connected read-only, nothing migrated.', 'SAP S/4HANA, Biesterfeld CRM, B GPT, Kundenportale. Lesend angebunden, nichts migriert.')],
    ['users-three', L('Your roles & screens', 'Ihre Rollen & Oberflächen'), L('Each sees what they need', 'Jeder sieht, was er braucht'), L('Inside sales, field sales, product management, leadership; each sees what they need, in the language of their company.', 'Innendienst, Außendienst, Produktmanagement, Leitung: Jeder sieht, was er braucht, in der Sprache seiner Gesellschaft.')],
    ['squares-four', L('Modules on request', 'Module nach Bedarf'), L('Only what you use', 'Nur, was Sie nutzen'), L('For example leadership KPIs, demand planning, own telephony with call notes. You only get what you use.', 'Zum Beispiel Leitungs-Kennzahlen, Bedarfsplanung, eigene Telefonie mit Gesprächsnotizen. Sie bekommen nur, was Sie nutzen.')],
  ];
  const STEPS = () => [
    [L('Map it together', 'Gemeinsam aufnehmen'), L('How your teams work today: requests, approvals, systems, exceptions.', 'Wie Ihre Teams heute arbeiten: Anfragen, Freigaben, Systeme, Ausnahmen.')],
    [L('Adapt and test', 'Anpassen und testen'), L('Built to your rules and tried in the pilot with one team.', 'Nach Ihren Regeln gebaut und im Pilot mit einem Team erprobt.')],
    [L('Roll out and extend', 'Ausrollen und erweitern'), L('More teams, more companies, new modules when you need them.', 'Mehr Teams, mehr Gesellschaften, neue Module, wenn Sie sie brauchen.')],
  ];
  const ROLES = () => [L('Inside sales', 'Innendienst'), L('Field sales', 'Außendienst'), L('Leadership', 'Leitung')];
  const EXTRA = () => [['chart-line-up', L('Leadership KPIs', 'Leitungs-Kennzahlen')], ['phone-call', L('Telephony', 'Telefonie')]];

  // the script (seconds): base modules, then the customisations, then the seal
  const T = { base: .3, baseStep: .16, plus: 1.9, cust: 2.2, custStep: .55, eq: 4.5, seal: 4.7 };
  const baseAt = i => T.base + i * T.baseStep, custAt = i => T.cust + i * T.custStep;
  let el = {}, t = 0, raf = 0, last = 0;
  const user = { base: {}, cust: {} }; // clicks override the clock

  // the app inside "your solution"
  const app = () => `<div class="cu-app" aria-hidden="true">
      <div class="cu-top"><span class="cu-logo">${mask('biesterfeld', '#cb3f1d')}<b>Biesterfeld <em>Plastic</em></b></span><span class="cu-roles">${ROLES().map(r => `<i>${r}</i>`).join('')}</span></div>
      <div class="cu-body">
        <aside>${BASE().map(([ic, n]) => `<span class="cu-row">${ph(ic)}${n}</span>`).join('')}${EXTRA().map(([ic, n]) => `<span class="cu-row x">${ph(ic)}${n}<u>${L('new', 'neu')}</u></span>`).join('')}</aside>
        <main>
          <div class="cu-sk"><i style="width:46%"></i><i style="width:72%"></i><i style="width:58%"></i></div>
          <div class="cu-rules"><span>${ph('flow-arrow')}${L('Approval from € 50k', 'Freigabe ab € 50k')}</span><span>${ph('shield-check')}${L('Price floor PP € 1,380/t', 'Preisuntergrenze PP € 1.380/t')}</span><span>${ph('arrows-split')}${L('Allocation: A customers first', 'Allokation: A-Kunden zuerst')}</span></div>
          <div class="cu-sys">${[['sap', '#0a6ed1', 'SAP'], ['biesterfeld', '#cb3f1d', 'Biesterfeld CRM'], ['', '#0f6cbd', 'Outlook'], ['', '#5b6270', 'B GPT']].map(([m, c, n]) => `<span>${m ? mask(m, c) : `<i class="cu-dotlogo" style="background:${c}"></i>`}${n}<b></b></span>`).join('')}<small>${L('read-only', 'lesend')}</small></div>
        </main>
      </div>
      <span class="cu-seal">${ph('seal-check')}${L('Your solution', 'Ihre Lösung')}</span>
    </div>`;

  function render() {
    host.innerHTML = `<div class="wrap">
      <p class="ly-eyebrow reveal">${ph('puzzle-piece')}${L('Base product + customised solution', 'Basisprodukt + individuelle Lösung')}</p>
      <h2 class="h2 cu-h reveal">${L('What you have just seen is the base product. <em>Your solution is built for you.</em>', 'Was Sie gerade gesehen haben, ist das Basisprodukt. <em>Ihre Lösung bauen wir individuell.</em>')}</h2>

      <div class="cu-sum">
        <div class="cu-base"><small>${L('Base product', 'Basisprodukt')}</small><b>${L('Ready from day one', 'Ab dem ersten Tag bereit')}</b>
          <ul>${BASE().map(([ic, n], i) => `<li><button type="button" class="cu-tile" data-b="${i}" aria-pressed="true">${ph(ic)}<span>${n}</span></button></li>`).join('')}</ul></div>
        <span class="cu-op" data-op="plus" aria-hidden="true">+</span>
        <div class="cu-cust"><small>${L('Customised for Biesterfeld', 'Individuell für Biesterfeld')}</small>
          <ol>${CUSTOM().map(([ic, ti, short, d], i) => `<li><button type="button" class="cu-item" data-c="${i}" aria-pressed="true">${ph(ic)}<span class="cu-txt"><b>${ti}</b><span class="cu-short">${short}</span><span class="cu-more">${d}</span></span><i class="cu-sw"><i></i></i></button></li>`).join('')}</ol></div>
        <span class="cu-op" data-op="eq" aria-hidden="true">=</span>
        <div class="cu-res"><small>${L('Your solution', 'Ihre Lösung')}</small>${app()}
          <p>${L('Fits your processes, runs on your systems, grows with you.', 'Passt zu Ihren Prozessen, läuft auf Ihren Systemen, wächst mit Ihnen.')}</p>
          <span class="cu-hint">${ph('hand-pointing')}${L('Switch modules on and off', 'Module an- und ausschalten')}</span></div>
      </div>
      <ol class="cu-steps reveal">${STEPS().map(([ti], i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><b>${ti}</b></li>`).join('')}</ol>
    </div>`;
    const q = s => host.querySelector(s), qa = s => [...host.querySelectorAll(s)];
    el = { tiles: qa('.cu-tile'), items: qa('.cu-item'), rows: qa('.cu-row:not(.x)'), extra: qa('.cu-row.x'), rules: qa('.cu-rules > span'), sys: qa('.cu-sys > span'), sysLabel: q('.cu-sys small'),
      roles: q('.cu-roles'), role: qa('.cu-roles i'), plus: q('[data-op="plus"]'), eq: q('[data-op="eq"]'), seal: q('.cu-seal'), res: q('.cu-res'), hint: q('.cu-hint') };
    frame(reduced ? 99 : t);
  }

  // one frame: what is on comes from the clock, unless a click said otherwise
  const on = (kind, i, at) => (user[kind][i] ?? (t >= at)) ? 1 : 0;
  const amt = (kind, i, at, d = .45, e = out) => (user[kind][i] != null ? user[kind][i] ? 1 : 0 : seg(t, at, at + d, e));
  function frame(time) {
    t = time; if (!el.tiles) return;
    el.tiles.forEach((b, i) => { const a = amt('base', i, baseAt(i)); b.style.setProperty('--on', a); b.setAttribute('aria-pressed', on('base', i, baseAt(i)) ? 'true' : 'false'); });
    el.rows.forEach((r, i) => { const a = amt('base', i, baseAt(i) + .12, .45, back); r.style.setProperty('--on', a); });
    el.items.forEach((b, i) => { b.style.setProperty('--on', amt('cust', i, custAt(i), .5)); b.setAttribute('aria-pressed', on('cust', i, custAt(i)) ? 'true' : 'false'); });
    // what each customisation does to the app
    const rules = amt('cust', 0, custAt(0) + .15, .5), sys = amt('cust', 1, custAt(1) + .15, .5), roles = amt('cust', 2, custAt(2) + .15, .5), mods = amt('cust', 3, custAt(3) + .15, .5, back);
    el.rules.forEach((r, i) => r.style.setProperty('--on', user.cust[0] != null ? rules : seg(t, custAt(0) + .15 + i * .14, custAt(0) + .55 + i * .14, out)));
    el.sys.forEach((s, i) => s.style.setProperty('--on', user.cust[1] != null ? sys : seg(t, custAt(1) + .15 + i * .12, custAt(1) + .5 + i * .12, back)));
    el.sysLabel?.style.setProperty('--on', sys);
    el.roles?.style.setProperty('--on', roles);
    const cur = Math.floor(Math.max(0, t - custAt(2) - .6) / 1.8) % 3; // the role switch keeps cycling
    el.role.forEach((r, i) => r.classList.toggle('on', i === cur));
    el.extra.forEach((r, i) => r.style.setProperty('--on', user.cust[3] != null ? mods : seg(t, custAt(3) + .15 + i * .15, custAt(3) + .6 + i * .15, back)));
    // the signs pulse when it is their turn, then the seal lands
    const pulse = (n, a) => n?.style.setProperty('--p', Math.sin(clamp((t - a) / .6) * Math.PI));
    pulse(el.plus, T.plus); pulse(el.eq, T.eq);
    el.seal?.style.setProperty('--on', seg(t, T.seal, T.seal + .5, back));
    el.res?.style.setProperty('--on', seg(t, T.eq, T.seal + .4, out));
    el.hint?.style.setProperty('--on', seg(t, T.seal + .8, T.seal + 1.3));
  }

  // clicks switch one module or customisation
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-b], [data-c]'); if (!b) return;
    const kind = b.dataset.b != null ? 'base' : 'cust', i = +(b.dataset.b ?? b.dataset.c);
    user[kind][i] = b.getAttribute('aria-pressed') !== 'true';
    frame(t);
  });
  host.addEventListener('mousedown', e => { if (e.target.closest('[data-b], [data-c]')) e.preventDefault(); }); // no focus ring on a mouse click

  // the clock: runs while the section is in view
  function tick(now) { frame(t + Math.min(.1, (now - last) / 1000)); last = now; raf = requestAnimationFrame(tick); }
  const play = () => { if (raf || reduced) return; last = performance.now(); raf = requestAnimationFrame(tick); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  host.seek = s => { pause(); frame(s); }; // for checking single frames
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  // the sum itself in view starts it (where everything stacks the section is too tall to be mostly in view)
  let sumIO;
  const watch = () => { sumIO?.disconnect(); sumIO = new IntersectionObserver(([e]) => { if (e.isIntersecting && e.intersectionRatio >= .4) play(); else if (!e.isIntersecting) pause(); }, { threshold: [0, .4] }); const s = host.querySelector('.cu-sum'); if (s) sumIO.observe(s); };
  render(); watch(); host.querySelectorAll('.reveal').forEach(n => (reduced ? n.classList.add('in') : io.observe(n)));
  window.UI?.onLang(() => { render(); watch(); host.querySelectorAll('.reveal').forEach(n => n.classList.add('in')); });
})();
