/* Two page sections near the top, filled into #layer and #plan when a page has them:
   1. #layer, "Autopilot for Sales": one layer on top of the systems Biesterfeld already runs (data aggregation, nothing replaced).
      Five kinds of data flow into the core; hovering a kind shows exactly where it is read from. The core spots risks,
      context and opportunities and hands prioritised next steps to the sales loop (prepare, follow up).
   2. #plan: the opportunity Gantt (gantt.js) on sample key accounts, so the timeline is visible outside the product too. */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const base = window.SHARED_BASE || '../shared/';
  // an absolute URL: a url() inside a custom property resolves against the stylesheet that uses it, not the page
  const logo = n => `<span class="ly-logo" style="--m:url('${new URL(`${base}logos/${n}.svg`, document.baseURI).href}')"></span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ 1. the layer
  const SOURCES = () => [
    ['orders', L('Order data', 'Auftragsdaten'), [[logo('sap'), 'SAP S/4HANA', L('Orders, delivery notes, invoices', 'Aufträge, Lieferscheine, Rechnungen')], [logo('biesterfeld'), 'Biesterfeld CRM', L('Framework contracts and call-offs', 'Rahmenverträge und Abrufe')], [ph('plugs-connected'), L('EDI & customer portals', 'EDI & Kundenportale'), L('Orders from large accounts', 'Bestellungen großer Kunden')]]],
    ['customers', L('Customer data', 'Kundendaten'), [[logo('biesterfeld'), 'Biesterfeld CRM', L('Contacts, tiers, notes', 'Kontakte, Klassen, Notizen')], [logo('sap'), L('SAP customer master', 'SAP-Debitoren'), L('Terms, credit limit', 'Konditionen, Kreditlimit')], [ph('map-pin'), L('Field visit reports', 'Besuchsberichte'), L('Projects, plans, competitors', 'Projekte, Pläne, Wettbewerb')]]],
    ['products', L('Product data', 'Produktdaten'), [[logo('sap'), L('SAP material master', 'SAP-Materialstamm'), L('Grades, producers, prices', 'Typen, Hersteller, Preise')], [ph('file-pdf'), L('Data sheets', 'Datenblätter'), L('TDS, SDS, approvals', 'TDB, SDB, Zulassungen')], [ph('sparkle'), 'Biesterfeld GPT', L('Product knowledge, equivalents', 'Produktwissen, Alternativen')]]],
    ['stock', L('Stock & inbound', 'Bestand & Zulauf'), [[logo('sap'), L('SAP stock', 'SAP-Bestand'), L('Hamburg and every warehouse', 'Hamburg und alle Läger')], [ph('boat'), L('Inbound & ETA', 'Zulauf & ETA'), L('Ships, delays, arrivals', 'Schiffe, Verspätungen, Ankünfte')], [ph('scales'), L('Producer allocations', 'Allokationen der Hersteller'), L('What each grade may sell', 'Was je Type verkauft werden darf')]]],
    ['talk', L('Interaction data', 'Interaktionsdaten'), [[ph('microsoft-outlook-logo'), 'Outlook', L('Requests, offers, replies', 'Anfragen, Angebote, Antworten')], [logo('whatsapp'), 'WhatsApp', L('Quick questions, call-offs', 'Kurze Fragen, Abrufe')], [ph('phone'), L('Phone', 'Telefon'), L('Call notes and transcripts', 'Gesprächsnotizen und Transkripte')]]],
  ];
  const RINGS = () => [
    ['risk', L('Risks', 'Risiken'), L('Churn, falling call-offs, late ships', 'Abwanderung, sinkende Abrufe, späte Schiffe')],
    ['ctx', L('Context', 'Kontext'), L('Buying rhythm, margin, allocation', 'Kaufrhythmus, Marge, Allokation')],
    ['opp', L('Opportunities', 'Chancen'), L('Reorders, cross-selling, surplus placed', 'Nachbestellungen, Cross-Selling, Überbestand platziert')],
  ];
  function layer(host) {
    host.innerHTML = `<div class="wrap">
      <p class="ly-eyebrow reveal">${ph('steering-wheel')}Autopilot for Sales</p>
      <h2 class="h2 ly-h reveal">${L('A layer on top of your existing systems.', 'Ein Layer über Ihren bestehenden Systemen.')}</h2>
      <p class="ly-lead reveal">${L('<b>Data aggregation, not a system change.</b> It reads from SAP, Biesterfeld CRM, the inbox and the phone. Nothing is replaced, nothing is migrated.', '<b>Data Aggregation statt Systemwechsel.</b> Es liest aus SAP, dem Biesterfeld CRM, dem Postfach und dem Telefon. Nichts wird ersetzt, nichts migriert.')}</p>
      <div class="ly-stage reveal">
        <svg class="ly-wires" aria-hidden="true"></svg>
        <ul class="ly-src">${SOURCES().map(([k, t, items], i) => `<li class="ly-s" data-k="${k}" tabindex="0" style="--i:${i}"><span class="ly-st">${t}${ph('info')}</span>
          <div class="ly-pop" role="tooltip"><small>${L('Read from', 'Gelesen aus')}</small>${items.map(([ic, n, d]) => `<div class="ly-pi"><span class="ly-pic">${ic}</span><span><b>${n}</b><em>${d}</em></span></div>`).join('')}</div></li>`).join('')}</ul>
        <div class="ly-core">
          <span class="ly-ring r1"></span><span class="ly-ring r2"></span><span class="ly-ring r3"></span>
          <div class="ly-in">${ph('arrows-merge')}<b>Autopilot<br>for Sales</b></div>
          ${RINGS().map(([k, t, d]) => `<div class="ly-call c-${k}" tabindex="0"><b>${t}</b><small>${d}</small></div>`).join('')}
        </div>
        <div class="ly-out">
          <span class="ly-arrow"><em>${L('Prioritise', 'Priorisieren')}</em></span>
          <div class="ly-loop">
            <svg viewBox="0 0 200 200" aria-hidden="true"><defs><marker id="ly-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>
              <path class="ly-arc" d="M100 8A92 92 0 0 1 192 100" marker-end="url(#ly-ah)"/><path class="ly-arc" d="M192 100A92 92 0 0 1 100 192" marker-end="url(#ly-ah)"/><path class="ly-arc" d="M100 192A92 92 0 0 1 8 100" marker-end="url(#ly-ah)"/><path class="ly-arc" d="M8 100A92 92 0 0 1 100 8" marker-end="url(#ly-ah)"/></svg>
            <div class="ly-icons"><span title="${L('Phone', 'Telefon')}">${ph('device-mobile')}</span><span title="${L('Call notes', 'Gesprächsnotizen')}">${ph('microphone')}</span><span title="Outlook">${ph('microsoft-outlook-logo')}</span><span title="SAP">${logo('sap')}</span></div>
            <span class="ly-lt t1">${L('Prepare', 'Vorbereiten')}</span><span class="ly-lt t2">${L('Approve & send', 'Freigeben & senden')}</span><span class="ly-lt t3">${L('Follow up', 'Nachfassen')}</span>
          </div>
        </div>
      </div>
      <ol class="ly-steps reveal">
        <li><span>01</span><p>${L('Pulls order, customer, product, stock and conversation data together, <b>every day</b>.', 'Bündelt Auftrags-, Kunden-, Produkt-, Bestands- und Gesprächsdaten, <b>jeden Tag</b>.')}</p></li>
        <li><span>02</span><p>${L('Matches demand to stock and spots <b>opportunities and risks</b> in Biesterfeld\'s context.', 'Gleicht Bedarf und Bestand ab und erkennt <b>Chancen und Risiken</b> im Biesterfeld-Kontext.')}</p></li>
        <li><span>03</span><p>${L('Gives every account manager the <b>next steps, ready to approve</b>. A person sends.', 'Gibt jedem Account Manager die <b>nächsten Schritte, fertig zur Freigabe</b>. Ein Mensch sendet.')}</p></li>
      </ol>
    </div>`;
    wire(host);
  }
  // the dotted wires from each kind of data into the core, measured from the layout so they always meet
  function wire(host) {
    const stage = host.querySelector('.ly-stage'), svg = host.querySelector('.ly-wires');
    const draw = () => {
      const R = stage.getBoundingClientRect(), core = host.querySelector('.ly-in').getBoundingClientRect();
      if (!R.width || getComputedStyle(svg).display === 'none') return;
      const cx = core.left + core.width / 2 - R.left, cy = core.top + core.height / 2 - R.top, r = core.width / 2;
      svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
      const srcs = [...host.querySelectorAll('.ly-s')], n = srcs.length;
      svg.innerHTML = srcs.map((el, i) => {
        const b = el.querySelector('.ly-st').getBoundingClientRect(), x0 = b.right - R.left + 2, y0 = b.bottom - R.top + 6;
        const ang = (i - (n - 1) / 2) * .3, ex = cx - Math.cos(ang) * r, ey = cy + Math.sin(ang) * r; // spread along the left of the inner circle
        const d = `M${x0} ${y0}C${x0 + (ex - x0) * .55} ${y0} ${ex - (ex - x0) * .35} ${ey} ${ex} ${ey}`;
        return `<path class="ly-w" data-k="${el.dataset.k}" d="${d}"/><path class="ly-wf" data-k="${el.dataset.k}" d="${d}"/>`;
      }).join('');
    };
    draw();
    new ResizeObserver(draw).observe(stage);
    host.addEventListener('pointerover', e => { const s = e.target.closest('.ly-s'); host.querySelectorAll('.ly-w, .ly-wf').forEach(p => p.classList.toggle('on', !!s && p.dataset.k === s.dataset.k)); });
    host.addEventListener('pointerleave', () => host.querySelectorAll('.on').forEach(p => p.classList.remove('on')));
    host.addEventListener('focusin', e => { const s = e.target.closest('.ly-s'); host.querySelectorAll('.ly-w, .ly-wf').forEach(p => p.classList.toggle('on', !!s && p.dataset.k === s.dataset.k)); });
  }

  // ------------------------------------------------------------------ 2. the pipeline timeline
  function plan(host) {
    const G = window.BFGantt; if (!G) return;
    const now = new Date(), d = n => new Date(+now + n * 864e5), w = n => d(n * 7);
    const GR = { p: L('Projects with a long cycle', 'Projekte mit langem Zyklus'), o: L('Offers with the customer', 'Angebote beim Kunden'), r: L('Recurring orders from the buying rhythm', 'Wiederkehrende Bestellungen aus dem Kaufrhythmus') };
    const orders = (first, every, q, n, grade) => Array.from({ length: n }, (_, i) => ({ k: 'order', at: w(first + i * every), q: `${q} t`, t: L(`Expected order: about ${q} t ${grade}`, `Erwartete Bestellung: ca. ${q} t ${grade}`) }));
    const rows = [
      { group: GR.p, label: 'Bodensee Präzisionsteile', sub: L('New POM gear line · 60 t a year', 'Neue POM-Zahnradlinie · 60 t/Jahr'), value: 156000, prob: 35,
        phases: [{ k: 'qual', from: d(-3), to: w(2), t: L('Requirements & volumes', 'Anforderungen & Mengen') }, { k: 'sample', from: w(2), to: w(8), t: L('Samples & first-article test', 'Muster & Erstmusterprüfung') }, { k: 'offer', from: w(8), to: w(10), t: L('Framework offer', 'Rahmenangebot') }, { k: 'wait', from: w(10), to: w(13), t: L('Purchasing decides', 'Einkauf entscheidet') }, { k: 'serial', from: w(13), to: w(30), t: L('Series from Q2 2027', 'Serie ab Q2 2027') }],
        marks: [{ k: 'check', at: w(4), t: L('Check in: how are the samples running?', 'Check-in: Wie laufen die Muster?') }, { k: 'esc', at: w(12), t: L('No decision yet: bring in product management, plan a visit', 'Noch keine Entscheidung: Produktmanagement einbinden, Besuch planen') }, { k: 'close', at: w(13), t: L('Decision on the supplier', 'Entscheidung über den Lieferanten') }] },
      { label: 'Allgäu Gartengeräte', sub: L('Garden-tool range 2027 · PP + ABS', 'Gartengeräte-Serie 2027 · PP + ABS'), value: 210000, prob: 25,
        phases: [{ k: 'qual', from: w(-1), to: w(4), t: L('Range, volumes, colours', 'Sortiment, Mengen, Farben') }, { k: 'sample', from: w(4), to: w(10), t: L('Colour samples & approval', 'Farbmuster & Freigabe') }, { k: 'offer', from: w(10), to: w(12), t: L('Offer with scale', 'Angebot mit Staffel') }, { k: 'wait', from: w(12), to: w(16) }],
        marks: [{ k: 'check', at: w(3), t: L('Visit with the field sales team', 'Besuch mit dem Außendienst') }, { k: 'close', at: w(16) }] },
      { label: 'Elbtal Elektrotechnik', sub: L('PA66 GF25 V-0 for connector housings', 'PA66 GF25 V-0 für Steckergehäuse'), value: 96000, prob: 45,
        phases: [{ k: 'qual', from: w(-3), to: w(1), t: L('Spec: GWIT 775 °C', 'Spezifikation: GWIT 775 °C') }, { k: 'sample', from: w(1), to: w(5), t: L('Sampling', 'Bemusterung') }, { k: 'offer', from: w(5), to: w(6) }, { k: 'wait', from: w(6), to: w(8) }, { k: 'deliv', from: w(8.3), to: w(11) }],
        marks: [{ k: 'check', at: w(3), t: L('Ask engineering about the sample results', 'Technik nach den Musterergebnissen fragen') }, { k: 'close', at: w(8) }] },
      { group: GR.o, label: 'Weser Getränketechnik', sub: L('PET under allocation · Q1 volumes', 'PET unter Allokation · Q1-Mengen'), value: 180000, prob: 70,
        phases: [{ k: 'qual', from: w(-1), to: w(2), t: L('Allocation with PM', 'Allokation mit PM') }, { k: 'offer', from: w(2), to: w(3) }, { k: 'wait', from: w(3), to: w(5) }, { k: 'deliv', from: w(5.3), to: w(12), t: L('Monthly call-offs', 'Monatliche Abrufe') }],
        marks: [{ k: 'check', at: w(1), t: L('Product management confirms the released quantity', 'Produktmanagement bestätigt die freigegebene Menge') }, { k: 'close', at: w(5) }] },
      { label: 'Folienwerk Nordheide', sub: L('LLDPE film 72 t · negotiation', 'LLDPE-Folie 72 t · Verhandlung'), value: 69600, prob: 50,
        phases: [{ k: 'offer', from: d(-11), to: d(-9) }, { k: 'wait', from: d(-9), to: d(8), t: L('Negotiation', 'Verhandlung') }, { k: 'deliv', from: d(10), to: d(24) }],
        marks: [{ k: 'check', at: d(-5), t: L('Followed up four days after sending', 'Vier Tage nach Versand nachgefasst') }, { k: 'esc', at: d(1), t: L('No answer: call instead of writing again', 'Keine Antwort: anrufen statt erneut schreiben') }, { k: 'close', at: d(8) }] },
      { label: 'Novaform Automotive', sub: L('PA66 GF30 HS 24 t + POM 8 t', 'PA66 GF30 HS 24 t + POM 8 t'), value: 53700, prob: 60,
        phases: [{ k: 'offer', from: d(-6), to: d(-4) }, { k: 'wait', from: d(-4), to: d(4), t: L('Customer reviewing', 'Kunde prüft') }, { k: 'deliv', from: d(6), to: d(20) }],
        marks: [{ k: 'check', at: d(0), t: L('Follow up today: decides with purchasing on Thursday', 'Heute nachfassen: entscheidet donnerstags mit dem Einkauf') }, { k: 'esc', at: d(5), t: L('Still open: call Sabine Ort in purchasing', 'Weiter offen: Sabine Ort im Einkauf anrufen') }, { k: 'close', at: d(4) }] },
      { group: GR.r, label: 'Hanse Closures', sub: L('HDPE food grade · every 3 wk', 'HDPE Lebensmittel · alle 3 Wo.'), value: 33100, prob: 90, line: true,
        marks: [{ k: 'check', at: d(2), t: L('Ask for quantity and date', 'Nach Menge und Termin fragen') }, ...orders(1.3, 3, 24, 6, 'Marlex 9006')] },
      { label: 'Spessart Möbelbeschläge', sub: L('POM · every 6 wk · 5 wk overdue', 'POM · alle 6 Wo. · 5 Wo. überfällig'), value: 15600, prob: 45, line: true, late: true,
        marks: [{ k: 'esc', at: d(.5), t: L('Reorder 5 weeks overdue: call today', 'Nachbestellung 5 Wochen überfällig: heute anrufen') }, ...orders(.6, 6, 6, 3, 'Hostaform C 9021')] },
    ];
    host.innerHTML = `<div class="wrap">
      <p class="ly-eyebrow reveal">${ph('chart-bar-horizontal')}${L('Pipeline planning', 'Pipeline-Planung')}</p>
      <h2 class="h2 pl-h reveal">${L('Every opportunity on one timeline.', 'Jede Opportunity auf einer Zeitachse.')}</h2>
      <p class="ly-lead reveal">${L('Key accounts buy in long cycles: sampling, approval, framework offer, decision. The timeline shows when each one is decided, when to check in, when to escalate, and what each month should bring in.', 'Key Accounts kaufen in langen Zyklen: Bemusterung, Freigabe, Rahmenangebot, Entscheidung. Die Zeitachse zeigt, wann was entschieden wird, wann nachgehakt und wann eskaliert wird, und was jeder Monat bringen sollte.')}</p>
      <div class="pl-chart reveal">${G.html({ rows, from: d(-14), weeks: 18, lang: lang(), sum: true, click: false, now, money: v => (v >= 1e4 ? `€ ${Math.round(v / 1e3)}k` : `€ ${Math.round(v)}`) }).replace('class="gx"', 'class="gx gx-dark"')}</div>
      <div class="pl-foot reveal"><button class="btn btn-quiet" id="plan-open"><span>${L('Open it in the product', 'Im Produkt öffnen')}</span><span class="btn-ic">${ph('arrow-down')}</span></button><small>${L('Sample accounts and values. Hover any bar or marker for the detail.', 'Beispielkunden und -werte. Für Details über einen Balken oder Marker fahren.')}</small></div>
    </div>`;
    host.querySelector('#plan-open').addEventListener('click', () => document.dispatchEvent(new CustomEvent('bf:open', { detail: { page: 'opps' } })));
  }

  // ------------------------------------------------------------------ boot: fade in on their own, re-render on a language switch
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  const mount = again => {
    const a = document.getElementById('layer'), b = document.getElementById('plan');
    if (a && !window.PAGE?.ownLayer) layer(a); if (b) plan(b); // a page can draw #layer itself
    [window.PAGE?.ownLayer ? null : a, b].filter(Boolean).forEach(h => h.querySelectorAll('.reveal').forEach(el => { if (again || reduced) el.classList.add('in'); else io.observe(el); }));
  };
  mount(false);
  window.UI?.onLang(() => mount(true));
})();
