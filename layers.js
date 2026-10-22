/* Version 4: #layer in the GeneralMind manner. Left: the message, Inbound | Outbound tabs, the "Autopilot activated"
   switch and the processes as an accordion. Right: one panel with our layer on top (Autopilot for Sales, with a live
   action feed) and, well below it, everything that flows in: the people (stakeholders) and the systems Biesterfeld
   already runs (communication, work, record). Lines from each input converge up into the layer, like a funnel. Opening a process plays its steps in the feed (a ticker: new
   steps come in on top) and marks the people and systems it touches; switching the autopilot off pauses the feed.
   The page is built once; clicks only change classes and the feed, so nothing jumps.
   The base product + customisation message has its own section after the demo (custom.js). */
(() => {
  const host = document.getElementById('layer'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const base = window.SHARED_BASE || '../shared/';
  const logo = (n, c) => `<span class="gl-logo" style="--m:url('${new URL(`${base}logos/${n}.svg`, document.baseURI).href}');--c:${c}"></span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ the people and the systems
  const PEOPLE = () => [['kunde', 'storefront', L('Customer', 'Kunde')], ['innen', 'headset', L('Inside sales', 'Innendienst')], ['aussen', 'car-profile', L('Field sales', 'Außendienst')], ['pm', 'cube', L('Product mgmt', 'Produktmgmt.')], ['log', 'truck', L('Logistics', 'Logistik')]];
  const glyph = (n, c) => `<i class="ph-light ph-${n}" style="color:${c}" aria-hidden="true"></i>`;
  const SYSTEMS = () => [
    [L('System of communication', 'Kommunikation'), [['outlook', glyph('microsoft-outlook-logo', '#0f6cbd'), 'Outlook'], ['wa', logo('whatsapp', '#25d366'), 'WhatsApp'], ['tel', glyph('phone', '#5b6270'), L('Phone', 'Telefon')]]],
    [L('System of work', 'Arbeit'), [['excel', glyph('microsoft-excel-logo', '#1d6f42'), 'Excel'], ['docs', glyph('file-pdf', '#d93a2b'), L('Data sheets', 'Datenblätter')], ['gpt', glyph('sparkle', '#cb3f1d'), 'Biesterfeld GPT']]],
    [L('System of record', 'Stammdaten'), [['sap', logo('sap', '#0a6ed1'), 'SAP S/4HANA'], ['crm', logo('biesterfeld', '#cb3f1d'), 'Biesterfeld CRM'], ['dw', glyph('database', '#29b5e8'), 'Snowflake']]],
  ];

  // ------------------------------------------------------------------ the processes: what the layer does, who and what it touches, the feed
  const P = (k, t, d, people, sys, feed) => ({ k, t, d, people, sys, feed });
  const FLOWS = () => ({
    in: [
      P('rfq', L('Request & specification', 'Anfrage & Spezifikation'), L('Every email, WhatsApp and call is read: customer, grade, quantity, date. If the spec, quantity or date is missing, one question with every open point is already drafted.', 'Jede E-Mail, WhatsApp und jeder Anruf wird gelesen: Kunde, Type, Menge, Termin. Fehlen Spezifikation, Menge oder Termin, steht eine Rückfrage mit allen offenen Punkten schon da.'), ['kunde', 'innen'], ['outlook', 'wa', 'tel', 'crm'],
        [[L('Request from Sauerland read: 30 t PP copolymer by week 46', 'Anfrage Sauerland gelesen: 30 t PP-Copolymer bis KW 46'), 'Outlook'], [L('Customer recognised: Sauerland Haushaltswaren, tier B', 'Kunde erkannt: Sauerland Haushaltswaren, Klasse B'), 'CRM'], [L('Question about the colour drafted for approval', 'Rückfrage zur Farbe zur Freigabe entworfen'), L('Draft', 'Entwurf')], [L('WhatsApp from Hanse: call-off 24 t Marlex 9006', 'WhatsApp von Hanse: Abruf 24 t Marlex 9006'), 'WhatsApp']]),
      P('offer', L('Offer creation', 'Angebot erstellen'), L('Stock and inbound checked in SAP, price calculated with margin, data sheet attached. The account manager checks and sends.', 'Bestand und Zulauf in SAP geprüft, Preis mit Marge gerechnet, Datenblatt angehängt. Der Account Manager prüft und sendet.'), ['kunde', 'innen', 'pm'], ['sap', 'docs', 'outlook'],
        [[L('22 t from Hamburg, 8 t inbound week 45 reserved', '22 t ab Hamburg, 8 t Zulauf KW 45 reserviert'), 'SAP'], [L('Price €1.42/kg, margin 8.4 %, above the floor', 'Preis 1,42 €/kg, Marge 8,4 %, über dem Floor'), L('Pricing', 'Kalkulation')], [L('Offer AN-2026-4381 drafted, TDS attached', 'Angebot AN-2026-4381 entworfen, TDB angehängt'), 'Outlook'], [L('Harzer: PBT GF30 equivalent proposed, 0.12 €/kg cheaper', 'Harzer: PBT GF30 gleichwertig vorgeschlagen, 0,12 €/kg günstiger'), 'B GPT']]),
      P('price', L('Price inquiry', 'Preisanfrage'), L('A pure price inquiry gets no offer, but a price scale for 1, 3 and 5 t.', 'Eine reine Preisanfrage bekommt kein Angebot, sondern eine Staffel für 1, 3 und 5 t.'), ['kunde', 'innen'], ['outlook', 'sap'],
        [[L('Price inquiry from Ostsee Sanitär, no quantity named', 'Preisanfrage Ostsee Sanitär, keine Menge genannt'), 'Outlook'], [L('Scale for 1 / 3 / 5 t calculated from the list price', 'Staffel 1 / 3 / 5 t aus dem Listenpreis gerechnet'), 'SAP'], [L('Reply with the scale ready for approval', 'Antwort mit Staffel zur Freigabe bereit'), L('Draft', 'Entwurf')]]),
      P('follow', L('Offer follow-up', 'Nachfassen'), L('Four days after sending, the follow-up is on the list, with the sent offer and a draft.', 'Vier Tage nach dem Versand steht das Nachfassen auf der Liste, mit dem gesendeten Angebot und einem Entwurf.'), ['kunde', 'innen', 'aussen'], ['outlook', 'tel', 'crm'],
        [[L('Offer to Novaform open for 4 days', 'Angebot an Novaform seit 4 Tagen offen'), 'CRM'], [L('Follow-up email drafted with the offer attached', 'Nachfass-E-Mail mit Angebot entworfen'), 'Outlook'], [L('No answer in 5 days: call planned', 'Ohne Antwort nach 5 Tagen: Anruf eingeplant'), L('Phone', 'Telefon')]]),
      P('order', L('Order entry', 'Auftrag anlegen'), L('Call-offs from framework contracts and accepted offers are prepared as orders in SAP; the confirmation goes out after a click.', 'Abrufe aus Rahmenverträgen und angenommene Angebote werden als Auftrag in SAP vorbereitet; die Bestätigung geht nach einem Klick raus.'), ['kunde', 'innen', 'log'], ['crm', 'sap', 'outlook'],
        [[L('Call-off Rheinform from the CRM: 5 t Zytel 70G30HSL', 'Abruf Rheinform aus dem CRM: 5 t Zytel 70G30HSL'), 'CRM'], [L('Order AB-2026-1187 prepared in SAP', 'Auftrag AB-2026-1187 in SAP vorbereitet'), 'SAP'], [L('Order confirmation to Dr. Uwe Lenz ready', 'Auftragsbestätigung an Dr. Uwe Lenz bereit'), 'Outlook']]),
      P('info', L('Info requests', 'Info-Anfragen'), L('Data sheets, certificates, delivery dates: answered briefly, without a fake opportunity.', 'Datenblätter, Zertifikate, Liefertermine: kurz beantwortet, ohne Schein-Opportunity.'), ['kunde', 'innen', 'log'], ['outlook', 'docs', 'sap'],
        [[L('Medplast asks for the CoA of lot 26-0412', 'Medplast fragt nach dem CoA zur Charge 26-0412'), 'Outlook'], [L('Certificate found and attached', 'Zertifikat gefunden und angehängt'), L('Data sheets', 'Datenblätter')], [L('Ship delayed week 45 → 46: 3 customers informed', 'Schiff KW 45 → 46 verspätet: 3 Kunden informiert'), 'SAP']]),
    ],
    out: [
      P('match', 'Demand Match', L('Every customer against their own buying rhythm: whoever is overdue is on today\'s list.', 'Jeder Kunde gegen seinen eigenen Kaufrhythmus: Wer überfällig ist, steht heute auf der Liste.'), ['innen', 'aussen', 'kunde'], ['sap', 'crm', 'tel'],
        [[L('Spessart: POM every 6 weeks, nothing for 11', 'Spessart: POM alle 6 Wochen, seit 11 Wochen nichts'), 'SAP'], [L('Call to Bernd Kraus prepared, opener ready', 'Anruf bei Bernd Kraus vorbereitet, Einstieg steht'), L('Phone', 'Telefon')], [L('6 t Hostaform C 9021 reserved as a precaution', '6 t Hostaform C 9021 vorsorglich reserviert'), 'SAP']]),
      P('push', L('Pushed products', 'Push-Produkte'), L('Surplus and unsold inbound go to the customers who fit, each with a personal email.', 'Überbestand und unverkaufter Zulauf gehen an die Kunden, die passen, jeweils mit persönlicher E-Mail.'), ['pm', 'innen', 'kunde'], ['sap', 'crm', 'outlook'],
        [[L('32 t HDPE free: 4 matching customers found', '32 t HDPE frei: 4 passende Kunden gefunden'), 'SAP'], [L('Hanse Closures first: buys every 3 weeks', 'Hanse Closures zuerst: kauft alle 3 Wochen'), 'CRM'], [L('4 personal emails drafted for approval', '4 persönliche E-Mails zur Freigabe entworfen'), 'Outlook']]),
      P('scarce', L('Scarce supply', 'Knappes Inventar'), L('When demand is above supply, it is shared out by clear rules and customers hear early.', 'Ist mehr Bedarf als Ware da, wird nach klaren Regeln verteilt, und die Kunden erfahren es früh.'), ['pm', 'innen', 'kunde'], ['sap', 'crm', 'outlook'],
        [[L('PET allocation: 60 t demand, 40 t available', 'PET-Allokation: 60 t Bedarf, 40 t verfügbar'), 'SAP'], [L('Split by framework contract and margin proposed', 'Verteilung nach Rahmenvertrag und Marge vorgeschlagen'), L('Product mgmt', 'Produktmgmt.')], [L('Weser Getränketechnik told: order now', 'Info an Weser Getränketechnik: jetzt bestellen'), 'Outlook']]),
      P('checkin', L('Check-ins', 'Check-ins'), L('Only where the learned contact rhythm is overdue, and never for customers where the account manager switched it off.', 'Nur wo der gelernte Kontaktrhythmus überschritten ist, und nie bei Kunden, für die der Account Manager es abgeschaltet hat.'), ['aussen', 'innen', 'kunde'], ['crm', 'tel', 'outlook'],
        [[L('Emsland: last contact 3 weeks ago, usually every 2', 'Emsland: letzter Kontakt vor 3 Wochen, sonst alle 2'), 'CRM'], [L('Opener: new projects for 2027', 'Gesprächseinstieg: neue Projekte für 2027'), L('Phone', 'Telefon')], [L('Note after the call: PE100 demand from January', 'Notiz nach dem Anruf: Bedarf PE100 ab Januar'), 'CRM']]),
      P('plan', L('Pipeline planning', 'Pipeline-Planung'), L('Every opportunity on one timeline: sampling, approval, decision, escalation.', 'Jede Opportunity auf einer Zeitachse: Bemusterung, Freigabe, Entscheidung, Eskalation.'), ['aussen', 'innen', 'pm'], ['crm', 'sap'],
        [[L('Bodensee: first samples week 47, decision 20 Jan', 'Bodensee: Erstmuster KW 47, Entscheidung 20.01.'), 'CRM'], [L('Escalation set: no answer, visit with product mgmt', 'Eskalation gesetzt: ohne Antwort Besuch mit PM'), 'Pipeline'], [L('Weighted pipeline December: €126k', 'Gewichtete Pipeline Dezember: 126.000 €'), 'Biesterfeld CRM']]),
    ],
  });

  // ------------------------------------------------------------------ state
  const S = { tab: 'in', open: null, on: true }; // nothing open at first: the panel shows the whole chain
  const flow = () => FLOWS()[S.tab].find(f => f.k === S.open) || overview();
  // nothing open: every person and system of the chain, and the feed runs through all of its processes in turn
  const overview = () => { const all = FLOWS()[S.tab], feed = []; for (let r = 0; r < 4; r++) all.forEach(f => f.feed[r] && feed.push(f.feed[r])); return { k: null, people: [...new Set(all.flatMap(f => f.people))], sys: [...new Set(all.flatMap(f => f.sys))], feed }; };
  const accItems = () => FLOWS()[S.tab].map(x => `<li data-flow="${x.k}"><button aria-expanded="false"><span>${x.t}</span><i class="gl-pm" aria-hidden="true"></i></button><div class="gl-d"><p>${x.d}</p></div></li>`).join('');

  // built once (and again on a language switch); everything after that only updates parts
  function build() {
    host.innerHTML = `<div class="wrap">
      <div class="gl-top">
        <h2 class="h2 gl-h reveal">${L('A layer on top of your existing systems.', 'Ein Layer über Ihren bestehenden Systemen.')}</h2>
        <p class="ly-lead reveal">${L('<b>Data aggregation with an output.</b> From the first request to the order in SAP. Nothing is replaced.', '<b>Data Aggregation mit Output.</b> Von der ersten Anfrage bis zum Auftrag in SAP. Nichts wird ersetzt.')}</p>
      </div>
      <div class="gl">
        <div class="gl-l">
          <button class="gl-ap reveal" role="switch" data-ap>${ph('sparkle')}<span class="gl-apt"></span><i class="gl-sw"><i></i></i></button>
          <div class="gl-tabs reveal" role="tablist">${[['in', 'Inbound', L('Inquiry to Order', 'Anfrage bis Auftrag')], ['out', 'Outbound', L('Demand to Order', 'Bedarf bis Auftrag')]].map(([k, sm, l]) => `<button role="tab" data-tab="${k}"><small>${sm}</small>${l}</button>`).join('')}</div>
          <ul class="gl-acc reveal">${accItems()}</ul>
        </div>
        <div class="gl-panel reveal">
          <section class="gl-layer gl-hub"><span class="gl-tag acc">Autopilot for Sales Layer</span>
            <div class="gl-feedwin"><div class="gl-feedhead"><b>${L('Autopilot action feed', 'Autopilot Action Feed')}</b><span>${ph('sparkle')}<span class="gl-apt"></span><i class="gl-sw sm"><i></i></i></span></div>
              <ol class="gl-feed" aria-live="polite"></ol></div></section>
          <div class="gl-funnel" aria-hidden="true"><svg class="gl-fsvg"></svg><span class="gl-fl">${ph('arrow-up')}${L('Everything flows in · data aggregation', 'Alles fließt ein · Data Aggregation')}</span></div>
          <div class="gl-inputs">
            <section class="gl-layer gl-in" data-src="people"><span class="gl-tag">${L('Stakeholders', 'Beteiligte')}</span>
              <div class="gl-people">${PEOPLE().map(person).join('')}</div></section>
            <section class="gl-layer gl-in"><span class="gl-tag">${L('Existing systems', 'Bestehende Systeme')}</span>
              <div class="gl-sys">${SYSTEMS().map(([t, apps]) => `<div class="gl-sg" data-src="sys"><small>${t}</small><div>${apps.map(([k, inner, name]) => `<span class="gl-app" data-sys="${k}" title="${esc(name)}">${inner}</span>`).join('')}</div></div>`).join('')}</div></section></section>
          </div>
        </div>
      </div>
    </div>`;
    sync(true);
  }
  function funnel() {
    const panel = host.querySelector('.gl-panel'), svg = host.querySelector('.gl-fsvg'), hub = host.querySelector('.gl-hub'); if (!panel || !svg) return;
    const P = panel.getBoundingClientRect(), H = hub.getBoundingClientRect(), f = flow();
    if (!P.width || getComputedStyle(svg).display === 'none') return;
    svg.setAttribute('viewBox', `0 0 ${P.width} ${P.height}`);
    const srcs = [...host.querySelectorAll('[data-src]')], n = srcs.length, ty = H.bottom - P.top;
    svg.innerHTML = srcs.map((el, k) => {
      const r = el.getBoundingClientRect(), sx = r.left + r.width / 2 - P.left, sy = r.top - P.top - (el.classList.contains('gl-sg') ? 9 : 0);
      const tx = H.left - P.left + H.width * (.3 + .4 * (n > 1 ? k / (n - 1) : .5)), m = (sy - ty) / 2;
      const on = el.dataset.src === 'people' ? f.people.length : [...el.querySelectorAll('[data-sys]')].some(a => f.sys.includes(a.dataset.sys));
      const d = `M${sx} ${sy}C${sx} ${sy - m} ${tx} ${ty + m} ${tx} ${ty}`;
      return `<path class="gl-fp${on ? ' on' : ''}" d="${d}"/>${on && S.on ? `<circle class="gl-dot" r="3"><animateMotion dur="2.2s" begin="${(k * .45).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>` : ''}<g class="gl-fn${on ? ' on' : ''}" transform="translate(${tx} ${ty + 16})"><circle r="11"/><path d="M0 4V-4M-3.5 -0.5L0 -4L3.5 -0.5"/></g>`;
    }).join('');
  }
  const person = ([k, ic, t]) => `<span class="gl-p" data-p="${k}"><i>${ph(ic)}</i><em>${t}</em></span>`;

  // reflect the state: tabs, switch, open process, marked people and systems; restart the feed if the process changed
  function sync(restart) {
    const f = flow();
    host.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === S.tab));
    host.querySelector('[data-ap]').setAttribute('aria-checked', S.on);
    host.querySelectorAll('.gl-apt').forEach(x => { x.textContent = S.on ? L('Autopilot activated', 'Autopilot aktiviert') : L('Autopilot paused', 'Autopilot pausiert'); });
    host.querySelector('.gl-panel').classList.toggle('off', !S.on);
    host.querySelectorAll('.gl-acc li').forEach(li => { const on = li.dataset.flow === f.k; li.classList.toggle('open', on); li.querySelector('button').setAttribute('aria-expanded', on); });
    host.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', f.people.includes(x.dataset.p)));
    host.querySelectorAll('[data-sys]').forEach(x => x.classList.toggle('on', f.sys.includes(x.dataset.sys)));
    if (restart) feed.reset();
    feed.run();
    funnel();
  }

  // ------------------------------------------------------------------ the feed: a ticker; a new step comes in on top with a spinner, then gets its tick
  const feed = (() => {
    let timer = null, i = 0, visible = false;
    const box = () => host.querySelector('.gl-feed');
    const row = ([t, tag]) => { const li = document.createElement('li'); li.className = 'run'; li.innerHTML = `<span class="gl-st"><i class="gl-spin"></i></span><span class="gl-tx">${esc(t)}</span><span class="gl-src">${esc(tag)}</span>`; return li; };
    const done = li => { li.classList.replace('run', 'done'); li.querySelector('.gl-st').innerHTML = ph('check-circle'); };
    function tick() {
      const b = box(), f = flow(); if (!b) return;
      b.querySelectorAll('li.run').forEach(done);
      const li = row(f.feed[i % f.feed.length]); i++;
      b.prepend(li);
      while (b.children.length > 4) b.lastElementChild.remove();
      if (reduced) done(li); else setTimeout(() => li.isConnected && done(li), 900);
    }
    function run() { clearInterval(timer); timer = null; if (S.on && visible && !reduced) timer = setInterval(tick, 2100); }
    // a process opens with its earlier steps already done, so the window is never empty; the ticker carries on from there
    function reset() {
      const b = box(), f = flow(); if (!b) return;
      b.innerHTML = '';
      const n = Math.min(3, f.feed.length);
      for (let k = 0; k < n; k++) { const li = row(f.feed[k]); done(li); li.classList.add('still'); b.prepend(li); }
      i = n;
    }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: 0.2 }).observe(host);
    return { tick, run, reset };
  })();

  // ------------------------------------------------------------------ events
  host.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), a = e.target.closest('.gl-acc li > button'), ap = e.target.closest('[data-ap]');
    if (t) { if (t.dataset.tab === S.tab) return; S.tab = t.dataset.tab; S.open = null; host.querySelector('.gl-acc').innerHTML = accItems(); sync(true); return; }
    if (a) { const k = a.parentElement.dataset.flow; S.open = k === S.open ? null : k; sync(true); return; } // a second click closes it
    if (ap) { S.on = !S.on; sync(false); }
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  build();
  new ResizeObserver(() => funnel()).observe(host);
  host.querySelectorAll('.reveal').forEach(el => { if (reduced) el.classList.add('in'); else io.observe(el); });
  window.UI?.onLang(() => { build(); host.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); });
})();
