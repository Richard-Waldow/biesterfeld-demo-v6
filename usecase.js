/* Version 5: #usecase, before the product. Built like GeneralMind's "Watch the product work: Try us on one use case":
   a heading with the example use case on the right, six square cards that scroll sideways (arrows, swipe), each with
   one product screen on a blue-grey ground and a numbered step under it, then all use cases as pills, tagged
   "start" (land) or "expand". The example is ours: a request comes in and leaves as an offer.
   Each screen is laid out at 972 × 980 and scaled to the card, so it stays sharp at any size. */
(() => {
  const host = document.getElementById('usecase'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const base = window.SHARED_BASE || '../shared/';
  const src = n => new URL(`${base}logos/${n}.svg`, document.baseURI).href;
  const mask = (n, c) => `<span class="fm-mask" style="--m:url('${src(n)}');--c:${c}"></span>`;
  const ic = k => `<span class="uc-ic">${window.FM_ICON?.[k] || ''}</span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tg = (on = false) => `<i class="uc-tg${on ? ' on' : ''}"><i></i></i>`;
  const spark = `<svg class="uc-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.9 5.6L17.5 10.5l-5.6 1.9L10 18l-1.9-5.6L2.5 10.5l5.6-1.9z" fill="currentColor"/><path d="M18.5 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor"/></svg>`;
  const field = (label, value, n, cls = '') => `<label class="uc-f ${cls}"><small>${label} ${ph('info')}</small><span>${value}${n ? `<b class="uc-n">${n}</b>` : ''}</span></label>`;
  const tabs = on => `<div class="uc-tabs">${[L('Request details', 'Anfrage-Details'), L('AI emails', 'KI-E-Mails'), L('Activity log', 'Verlauf')].map((t, i) => `<span class="${i === on ? 'on' : ''}">${t}</span>`).join('')}</div>`;

  // ------------------------------------------------------------------ the six screens
  // 1. intake and classify: every channel in one inbox, each message gets a category
  const v1 = () => `<div class="uc-p uc-p1">
      <div class="uc-ph">${ph('envelope-simple')}${L('Inbox', 'Posteingang')}</div>
      <div class="uc-chips"><span>${L('Open actions', 'Offene Aktionen')}</span><span class="on">Inbound</span><span>Outbound</span></div>
      <div class="uc-kpi">${[['214', L('Total', 'Gesamt'), ''], ['131', 'Outlook', 'outlook'], ['58', 'WhatsApp', 'whatsapp'], ['25', L('EDI / portal', 'EDI / Portal'), '']].map(([n, k, i]) => `<div><b>${n}</b><small>${i ? ic(i) : ph('file-text')}${k}</small></div>`).join('')}</div>
      <div class="uc-bar"><span class="uc-search">${ph('magnifying-glass')}${L('Search…', 'Suchen…')}</span><span>${L('Channel', 'Kanal')} ${ph('caret-down')}</span><span>${L('Mailbox', 'Postfach')}</span></div>
      <table class="uc-t"><thead><tr><th></th><th>${L('Date', 'Datum')} ⇅</th><th>${L('Sender', 'Absender')}</th><th>${L('Channel', 'Kanal')}</th></tr></thead>
        <tbody>${[['21. Okt', 'ilka.schroeder@…', 'outlook'], ['21. Okt', 'Merle Jansen', 'whatsapp'], ['21. Okt', 'f.haag@medplast…', 'outlook'], ['20. Okt', 'EDI · Rheinform', ''], ['20. Okt', 't.brenner@novaf…', 'outlook']].map(([d, s, k]) => `<tr><td><i class="uc-cb"></i></td><td>${d}</td><td>${s}</td><td>${k ? ic(k) : ph('plugs-connected')}</td></tr>`).join('')}</tbody></table>
    </div>
    <div class="uc-pop uc-cat"><div class="uc-pop-h">${L('Category', 'Kategorie')} ⇅</div>${[['o', L('Quote request', 'Angebotsanfrage')], ['g', L('Call-off', 'Abruf')], ['b', L('Document', 'Dokument')], ['y', L('Delivery date', 'Liefertermin')], ['g', L('Call-off', 'Abruf')], ['o', L('Quote request', 'Angebotsanfrage')], ['n', L('Other', 'Sonstiges')]].map(([c, t], i) => `<div style="--i:${i}"><span class="uc-pill ${c}">${t} ${ph('caret-down')}</span></div>`).join('')}</div>`;

  // 2. extracts and parses: a faxed order in handwriting, boxed and read into the fields
  const v2 = () => `<div class="uc-p uc-p2">
      <div class="uc-ap">${spark}Autopilot ${tg()}</div>
      <div class="uc-bubble">${L('The autopilot has drafted a reply for you.', 'Der Autopilot hat eine Antwort für Sie entworfen.')}</div>
      ${tabs(0)}
      <div class="uc-form"><h5>${L('Request header', 'Anfrage-Kopf')}</h5>
        <div class="uc-g2">${field(L('Request no.', 'Anfrage-Nr.'), 'AF-2026-08817')}${field(L('Received', 'Eingang'), '21. Okt 2026')}</div>
        ${field(L('Customer and number', 'Kunde und Nummer'), 'Sauerland Haushaltswaren · 204117', 1, 'ok wide dd')}
        ${field(L('Delivery address', 'Lieferadresse'), 'Industriestraße 12', 3, 'ok wide')}
        <div class="uc-g2">${field(L('City', 'Ort'), 'Arnsberg', 0, 'ok')}${field(L('Country', 'Land'), L('Germany', 'Deutschland'), 0, 'ok')}</div>
        <div class="uc-g2">${field(L('Delivery date', 'Liefertermin'), L('Week 46 · 13 Nov 2026', 'KW 46 · 13.11.2026'), 2, 'ok')}${field(L('Packaging', 'Verpackung'), 'Big Bag')}</div>
        <div class="uc-g2">${field('Material', 'PP-Copolymer, 30 t', 4, 'ok')}${field(L('Plant', 'Werk'), 'Hamburg')}</div>
      </div>
    </div>
    <div class="uc-fax">
      <span class="uc-fx-top">FAX · 21.10.26 07:49 · S. 1/1</span>
      ${[[1, L('customer name', 'Kunde'), '98', 'Bestellung Sauerland<br>Haushaltswaren', 'b1'], [2, L('delivery date', 'Liefertermin'), '99', 'Liefern bis: KW 46', 'b2'], [3, L('delivery address', 'Lieferadresse'), '97', 'Industriestr. 12,<br>59821 Arnsberg', 'b3'], [4, L('line items', 'Positionen'), '96', 'PP Copo wie letztes Mal: 30 t<br>Big Bags, mit Datenblatt', 'b4']].map(([n, k, c, h, cls], i) => `<div class="uc-box ${cls}" style="--i:${i}"><span class="uc-bl">${n} · ${k}</span><span class="uc-bc">${c}%</span><p class="uc-hand">${h}</p></div>`).join('')}
    </div>`;

  // 3. match to SAP: "same as last time" becomes a material number, with stock and price
  const v3 = () => `<div class="uc-p uc-p3"><div class="uc-ph sb">${L('Request header', 'Anfrage-Kopf')} ${ph('caret-up')}</div>
      <div class="uc-g2">${field(L('Request no.', 'Anfrage-Nr.'), 'AF-2026-08817')}${field(L('Received', 'Eingang'), '21. Okt 2026')}</div>
      <div class="uc-g2">${field('Material', 'PP 7032E3')}${field(L('Plant', 'Werk'), 'Hamburg')}</div>
      <div class="uc-g2">${field(L('Quantity', 'Menge'), '30 t')}${field(L('List price', 'Listenpreis'), '€ 1 410 / t')}</div>
      <div class="uc-g2">${field(L('Delivery date', 'Liefertermin'), L('13 Nov 2026', '13.11.2026'))}${field(L('Customer no.', 'Kunden-Nr.'), '204117')}</div>
      <div class="uc-g2">${field(L('Sales org', 'Verkaufsorg.'), '1100')}${field(L('Last order', 'Letzter Auftrag'), 'AU-2026-3391 · 28 t')}</div>
      <div class="uc-g2">${field(L('Contact', 'Ansprechpartnerin'), 'Ilka Schröder')}${field(L('Subject', 'Betreff'), 'Fax 21.10.26')}</div>
    </div>
    <div class="uc-pop uc-conf">
      <p><b>${L('AI confidence', 'KI-Sicherheit')}:</b><span class="uc-pc">96%</span></p>
      <p><b>${L('Read', 'Erkannt')}:</b>„PP Copo wie letztes Mal“</p>
      <p><b>SAP:</b>PP 7032E3 · Mat. 100482</p>
      <p><b>${L('Stock', 'Bestand')}:</b>${L('22 t free · 8 t inbound wk 45', '22 t frei · 8 t Zulauf KW 45')}</p>
      <div class="uc-okbox">${ph('check-circle')}<span>${L('Matched to the order history of this customer, with high confidence.', 'Aus der Auftragshistorie des Kunden erkannt, mit hoher Sicherheit.')}</span></div>
    </div>`;

  // 4. answers on its own: the offer as a finished draft, data sheet attached
  const v4 = () => `<div class="uc-p uc-p4">${tabs(1)}
      <div class="uc-row2"><span class="uc-sel">DE ${ph('caret-down')}</span><small>${L('Template', 'Vorlage')}:</small><span class="uc-sel">${L('Offer', 'Angebot')} ${ph('caret-down')}</span><span class="r">${ph('arrows-out-simple')}</span></div>
      <div class="uc-in"><small>${L('From', 'Von')}:</small><span class="uc-tag">Key Account Team Nord ×</span></div>
      <div class="uc-in"><small>${L('To', 'An')}:</small><span class="uc-tag">Ilka Schröder · Sauerland ×</span><span class="r"><b>CC</b><b>BCC</b></span></div>
      <div class="uc-in"><small>${L('Subject', 'Betreff')}:</small>${L('Re: RFQ 30 t PP copolymer, week 46', 'AW: Anfrage 30 t PP-Copolymer, KW 46')}</div>
      <div class="uc-in"><small>${L('Attachments', 'Anhänge')}:</small><span class="uc-file">${ph('file-pdf')}AN-2026-4118.pdf</span><span class="uc-file">${ph('file-pdf')}TDS_PP7032E3.pdf</span><span class="r">${ph('paperclip')}</span></div>
      <div class="uc-ed"><div class="uc-tb"><span>12 ${ph('caret-down')}</span><b>T</b><i class="dot"></i><b>B</b><em>I</em><u>U</u><s>S</s>${ph('text-align-left')}${ph('text-align-center')}${ph('list-numbers')}${ph('list-bullets')}${ph('image')}${ph('link')}</div>
        <div class="uc-body">${L('<p>Dear Ms Schröder,</p><p>thank you for your request. Attached is our offer for 30 t PP 7032E3, delivered in week 46 from Hamburg, with the data sheet.</p><p>Kind regards,<br>Your key account team</p>', '<p>Sehr geehrte Frau Schröder,</p><p>vielen Dank für Ihre Anfrage. Anbei unser Angebot über 30 t PP 7032E3, Lieferung in KW 46 ab Hamburg, mit Datenblatt.</p><p>Mit freundlichen Grüßen<br>Ihr Key Account Team</p>')}</div></div>
      <div class="uc-foot"><small>${L('Last saved', 'Zuletzt gespeichert')}:</small>${L('21 Oct 2026, 09:18', '21. Okt 2026, 09:18')}<span class="r"><span class="uc-b">${L('Save draft', 'Entwurf speichern')}</span><span class="uc-b pri">${L('Send', 'Senden')}</span></span></div>
    </div>`;

  // 5. syncs back: offers and orders written to SAP, the CRM kept current
  const v5 = () => `<div class="uc-p uc-p5">
      <div class="uc-bar r5"><span>${L('More filters', 'Weitere Filter')} ${ph('caret-down')}</span><span class="r">${ph('download-simple')}Download</span><span class="uc-b pri">${L('Sync to SAP', 'Mit SAP synchronisieren')}</span></div>
      <table class="uc-t big"><thead><tr><th>${L('Customer', 'Kunde')} ⇅</th><th>${L('Category', 'Kategorie')} ⇅</th><th>${L('AI confidence', 'KI-Sicherheit')} ⇅</th><th>Status ⇅</th><th>${ph('columns')}</th></tr></thead>
        <tbody>${[['Sauerland Haushaltsw…', L('Quote request', 'Angebotsanfrage'), 98, 'n', L('New', 'Neu')], ['Hanse Closures GmbH', L('Delivery date', 'Liefertermin'), 57, 'r', L('Escalated', 'Eskaliert')], ['Novaform Automotive', L('Quote request', 'Angebotsanfrage'), 89, 'y', L('In review', 'In Prüfung')], ['Rheinform Kunststoff…', L('Call-off', 'Abruf'), 98, 'g', L('Order created', 'Auftrag angelegt')], ['Medplast Medical…', L('Document', 'Dokument'), 99, 'g', L('Sent', 'Gesendet')], ['Ostsee Sanitär', L('Quote request', 'Angebotsanfrage'), 97, 'g', L('Offer created', 'Angebot erstellt')]].map(([c, k, p, s, t]) => `<tr><td>${c}</td><td><span class="uc-k">${k}</span></td><td><span class="uc-pc ${p < 70 ? 'r' : p < 90 ? 'y' : ''}">${p}%</span></td><td><span class="uc-st ${s}">${t}</span></td><td>⋮</td></tr>`).join('')}</tbody></table>
    </div>
    <div class="uc-pop uc-sync"><span>${L('Last synced', 'Zuletzt synchronisiert')}: 21.10.2026 09:17</span><b>${ph('check-circle')}${L('Fully synced to SAP', 'Vollständig mit SAP synchronisiert')}</b></div>`;

  // 6. autopilot: what runs on its own, by rule
  const v6 = () => `<div class="uc-p uc-p6">
      <div class="uc-aph"><b>${spark}${L('Autopilot activated', 'Autopilot aktiviert')}</b>${tg(true)}</div>
      <p class="uc-apd">${L('The autopilot handles high-confidence work on its own. Everything else waits for your approval.', 'Der Autopilot erledigt Vorgänge mit hoher Sicherheit selbst. Alles andere legt er Ihnen zur Freigabe vor.')}</p>
      <table class="uc-t crit"><thead><tr><th>${L('Criteria', 'Kriterium')}</th><th>${L('Values', 'Werte')}</th><th>${L('Active', 'Aktiv')}</th></tr></thead><tbody>
        <tr><td>${L('Request type', 'Art der Anfrage')}</td><td><span class="uc-v">• ${L('Call-off', 'Abruf')}</span><span class="uc-v">• ${L('Document', 'Dokument')}</span></td><td>${ph('check-circle')}</td></tr>
        <tr><td>${L('AI confidence', 'KI-Sicherheit')}</td><td><span class="uc-pc">95% +</span></td><td>${ph('check-circle')}</td></tr>
        <tr><td>${L('Margin', 'Marge')}</td><td><span class="uc-v">≥ ${L('target', 'Zielmarge')}</span></td><td>${ph('check-circle')}</td></tr>
        <tr><td>${L('Customer', 'Kunde')}</td><td><span class="uc-v n">• ${L('Existing', 'Bestandskunde')}</span></td><td>${ph('check-circle')}</td></tr>
      </tbody></table>
    </div>`;

  const STEPS = () => [
    [v1, L('Intake and classify', 'Eingang und Einordnung'), L('The autopilot reads every message from Outlook, WhatsApp, call notes and EDI and sorts it: quote request, call-off, document, delivery date.', 'Der Autopilot liest jede Nachricht aus Outlook, WhatsApp, Telefonnotiz und EDI und ordnet sie ein: Angebotsanfrage, Abruf, Dokument, Liefertermin.')],
    [v2, L('Reads and extracts', 'Liest und extrahiert'), L('Fax, PDF or “same as last time”: customer, grade, quantity, date and address land in defined fields.', 'Fax, PDF oder „wie letztes Mal“: Kunde, Material, Menge, Termin und Adresse landen in festen Feldern.')],
    [v3, L('Matched to SAP', 'Abgleich mit SAP'), L('Grade, stock and price are matched against SAP and the order history; deviations are flagged, shortages show early.', 'Material, Bestand und Preis werden mit SAP und der Auftragshistorie abgeglichen; Abweichungen sind markiert, Engpässe früh sichtbar.')],
    [v4, L('Answers on its own', 'Antwortet selbst'), L('Offer, data sheet and follow-up questions go to the customer as a finished draft, in their language.', 'Angebot, Datenblatt und Rückfragen gehen als fertiger Entwurf an den Kunden, in seiner Sprache.')],
    [v5, L('Syncs to SAP and Biesterfeld CRM', 'Schreibt zurück in SAP und Biesterfeld CRM'), L('Offers and orders are created as soon as quantity, date or price change; the CRM stays current.', 'Angebote und Aufträge werden angelegt, sobald sich Menge, Termin oder Preis ändern; das CRM bleibt aktuell.')],
    [v6, 'Autopilot', L('High-confidence work moves to the autopilot. You approve the rest.', 'Vorgänge mit hoher Sicherheit gehen auf Autopilot. Den Rest geben Sie frei.')],
  ];
  const LAND = () => L('land use case', 'Start-Use-Case'), EXP = () => L('expand use case', 'Ausbau');
  const CASES = () => [
    [L('Inbound: request to order', 'Inbound: Anfrage bis Auftrag'), [[L('Quote request / offer', 'Angebotsanfrage / Angebot'), 1], [L('Call-off / order entry', 'Abruf / Auftragsanlage'), 1], [L('Documents: CoA, TDS, SDS', 'Dokumente: CoA, TDB, SDB'), 1], [L('Delivery date / ETA', 'Liefertermin / ETA'), 0], [L('Follow up open offers', 'Offene Angebote nachfassen'), 0], [L('Complaints', 'Reklamationen'), 0]]],
    [L('Outbound: demand to order', 'Outbound: Bedarf bis Auftrag'), [[L('Reorder reminders', 'Nachbestell-Erinnerung'), 1], [L('Sell surplus stock', 'Überbestand vermarkten'), 1], [L('Allocation when supply is short', 'Allokation bei Knappheit'), 0], [L('Repricing', 'Neubepreisung'), 0], [L('Pipeline planning', 'Pipeline-Planung'), 0], [L('Customer check-ins', 'Kunden-Check-ins'), 0]]],
  ];

  function render() {
    host.innerHTML = `<div class="wrap">
        <p class="uc-eyebrow reveal">${L('Watch the product work', 'Das Produkt bei der Arbeit')}</p>
        <div class="uc-head reveal"><h2 class="uc-h">${L('Try us on one use&nbsp;case.<br>Expand when you’re satisfied.', 'Starten Sie mit einem Use&nbsp;Case.<br>Erweitern Sie, wenn es überzeugt.')}</h2>
          <span class="uc-ex">${L('Example use case: request to offer', 'Beispiel: Anfrage bis Angebot')}<em>${LAND()}</em></span></div>
      </div>
      <div class="uc-car reveal">
        <button class="uc-arrow prev" type="button" aria-label="${L('Previous', 'Zurück')}" hidden>${ph('caret-left')}</button>
        <div class="uc-out"><div class="uc-track">${STEPS().map(([v, t, d], i) => `<article class="uc-card"><div class="uc-vis"><div class="uc-fit uc-s${i + 1}">${v()}</div></div>
          <h3>${i + 1}. ${t}</h3><p>${d}</p></article>`).join('')}</div></div>
        <button class="uc-arrow next" type="button" aria-label="${L('Next', 'Weiter')}">${ph('caret-right')}</button>
      </div>
      <div class="wrap"><div class="uc-cases">${CASES().map(([h, list]) => `<div class="reveal"><h3>${h}</h3><div class="uc-list">${list.map(([t, land]) => `<span class="uc-case">${t}<em class="${land ? 'land' : ''}">${land ? LAND() : EXP()}</em></span>`).join('')}</div></div>`).join('')}</div></div>`;
    host.querySelectorAll('.reveal').forEach(el => (reduced || host.dataset.seen ? el.classList.add('in') : io.observe(el)));
    fit(); arrows();
    host.querySelector('.uc-out').addEventListener('scroll', arrows, { passive: true });
    seen.disconnect(); host.querySelectorAll('.uc-card').forEach(c => seen.observe(c));
  }
  // scale each 972 × 980 screen to its card
  function fit() { host.querySelectorAll('.uc-vis').forEach(v => v.firstElementChild.style.setProperty('--s', v.clientWidth / 972)); }
  // the arrows: hidden at the ends, one card per click
  function arrows() {
    const o = host.querySelector('.uc-out'); if (!o) return;
    host.querySelector('.uc-arrow.prev').hidden = o.scrollLeft < 8;
    host.querySelector('.uc-arrow.next').hidden = o.scrollLeft > o.scrollWidth - o.clientWidth - 8;
  }
  host.addEventListener('click', e => {
    const a = e.target.closest('.uc-arrow'); if (!a) return;
    const o = host.querySelector('.uc-out'), c = host.querySelector('.uc-card'), step = c.offsetWidth + parseFloat(getComputedStyle(c.parentElement).columnGap || 0);
    o.scrollBy({ left: a.classList.contains('next') ? step : -step, behavior: reduced ? 'auto' : 'smooth' });
  });
  host.addEventListener('mousedown', e => { if (e.target.closest('.uc-arrow')) e.preventDefault(); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); host.dataset.seen = 1; } }), { threshold: 0.05 });
  // a card plays its small animation (boxes, chips, status) once it is mostly in view
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); seen.unobserve(e.target); } }), { threshold: 0.6 });
  new ResizeObserver(() => { fit(); arrows(); }).observe(host);
  render();
  window.UI?.onLang(render);
})();
