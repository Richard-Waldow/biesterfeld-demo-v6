/* Version 5: #systems, after the hero film. Built like GeneralMind's "Reality is messy and distributed across three
   system types": a heading, an "Activate Autopilot" switch, and a grey stage with the key account manager's three kinds
   of systems on the left (communication, work, record) running into a laptop on the right. Off, the laptop shows the
   desktop as it is today: Outlook, a data sheet, Teams, the allocation sheet, SAP, pings. On, it shows one Biesterfeld
   screen where every request is already checked. The switch flips by itself while the section is in view, until
   someone uses it. The screen is laid out at 1280 × 800 and scaled to fit, like the film. The switch turns on once,
   when the stage is well in view, and never flips back by itself; a click always works and ends the automatic part.
   Once the section has left the screen entirely it goes back to off unseen, so the flip plays again next time. */
(() => {
  const host = document.getElementById('systems'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const base = window.SHARED_BASE || '../shared/';
  const src = n => new URL(`${base}logos/${n}.svg`, document.baseURI).href;
  const mask = (n, c) => `<span class="fm-mask" style="--m:url('${src(n)}');--c:${c}"></span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = false, touched = false, timer = 0, size = '';

  // ------------------------------------------------------------------ the three kinds of systems
  const tile = (bg, inner) => `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="${bg}"/>${inner}</svg>`;
  const txt = (s, x, y, size, fill = '#fff', w = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="${w}" font-size="${size}" fill="${fill}">${s}</text>`;
  const OWN = {
    pdf: tile('#fff', `<path d="M15 8h14l9 9v23a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" fill="#f3f4f6" stroke="#d6d8dc"/><path d="M29 8v7a2 2 0 0 0 2 2h7" fill="#e5e7eb"/><path d="M19 27c3-9 5-12 6-10s-4 9-9 12 3-3 10-3 6 3 2 2-6-6-6-6" fill="none" stroke="#e5322d" stroke-width="1.8" stroke-linecap="round"/><rect x="11" y="31" width="26" height="9" rx="2" fill="#e5322d"/>${txt('PDF', 24, 38.4, 7.6)}`),
    snowflake: tile('#fff', `<g stroke="#29b5e8" stroke-width="3.2" stroke-linecap="round"><path d="M24 9v30M11 16.5l26 15M11 31.5l26-15"/></g><g fill="none" stroke="#29b5e8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10.5l4 4 4-4M20 37.5l4-4 4 4"/></g><circle cx="24" cy="24" r="3.4" fill="#fff" stroke="#29b5e8" stroke-width="2"/>`),
    ppt: tile('#fff', `<circle cx="28" cy="24" r="13" fill="#ed6c47"/><path d="M28 11a13 13 0 0 1 13 13H28z" fill="#ff8f6b"/><rect x="7" y="14" width="20" height="20" rx="3" fill="#c43e1c"/>${txt('P', 17, 29.5, 15)}`),
    qlik: tile('#fff', `<circle cx="23" cy="23" r="10" fill="none" stroke="#009848" stroke-width="5"/><path d="M29 29l7 7" stroke="#009848" stroke-width="5" stroke-linecap="round"/>`),
    oracle: tile('#e5322d', `<rect x="9" y="16" width="30" height="16" rx="8" fill="none" stroke="#fff" stroke-width="4"/>`),
    mail: tile('#3478f6', `<rect x="10" y="14" width="28" height="20" rx="3" fill="#fff"/><path d="M10.5 15.5L24 26l13.5-10.5" fill="none" stroke="#3478f6" stroke-width="2.4"/>`),
    bgpt: tile('#cb3f1d', `<path d="M24 11l2.8 7.7L34.5 21l-7.7 2.8L24 31.5l-2.8-7.7L13.5 21l7.7-2.3z" fill="#fff"/>${txt('GPT', 24, 41, 7.5)}`),
  };
  const LOGO = (n, c) => `<span class="fm-ic-wrap" style="background:#fff">${mask(n, c)}</span>`;
  const art = k => window.FM_ICON?.[k] || OWN[k] || '';
  // [label, three big icons, the folder of nine small ones]
  const GROUPS = () => [
    [L('System of Communication', 'Kommunikation'), ['outlook', 'whatsapp', 'teams'],
      [art('phone'), LOGO('gmail', '#ea4335'), LOGO('slack', '#4a154b'), LOGO('telegram', '#26a5e4'), LOGO('wechat', '#07c160'), LOGO('zoom', '#2d8cff'), LOGO('googlemeet', '#00897b'), LOGO('signal', '#3a76f0'), art('mail')]],
    [L('System of Work', 'Arbeit'), ['word', 'excel', 'pdf'],
      [art('ppt'), LOGO('googledocs', '#4285f4'), LOGO('googlesheets', '#0f9d58'), LOGO('googledrive', '#1fa463'), LOGO('notion', '#111'), LOGO('dropbox', '#0061ff'), LOGO('box', '#0061d5'), LOGO('confluence', '#1868db'), art('bgpt')]],
    [L('System of Record', 'Führende Systeme'), ['sap', 'crm', 'snowflake'],
      [art('qlik'), art('oracle'), LOGO('odoo', '#714b67'), LOGO('sage', '#00a650'), LOGO('datev', '#1b8a3a'), LOGO('hubspot', '#ff7a59'), LOGO('zoho', '#e42527'), art('pdf'), art('excel')]],
  ];

  // ------------------------------------------------------------------ the screen, off: today's desktop
  const FILES = ['Preisliste_Q4.xlsx', 'CoA_26-0412.pdf', 'TDS_PA66-GF25.pdf', 'Allokation_v3.xlsx', 'AN-2026-4102.docx', 'Kunden_PP.xlsx'];
  const MAILS = () => [
    ['Ilka Schröder', L('RFQ 30 t PP copolymer, week 46', 'Anfrage 30 t PP-Copolymer, KW 46'), '07:52', 1],
    ['Tobias Brenner', L('Re: Offer AN-2026-4102?', 'AW: Angebot AN-2026-4102?'), '08:10', 1],
    ['Dr. Felix Haag', L('CoA for lot 26-0412 please', 'CoA zur Charge 26-0412 bitte'), '08:31', 0],
    ['Ostsee Sanitär', L('Price for 5 t ABS?', 'Preis für 5 t ABS?'), '08:44', 1],
    ['Katrin Vogt', L('GWIT 775 °C confirmed?', 'GWIT 775 °C bestätigt?'), '09:02', 0],
    ['ExxonMobil', L('Shipping notice: ETA moved', 'Avis: ETA verschoben'), '09:15', 1],
    ['Rheinform', L('Call-off 5 t Zytel', 'Abruf 5 t Zytel'), '09:21', 1],
    ['Spessart', L('Do you have POM in stock?', 'Haben Sie POM auf Lager?'), '09:30', 0],
    ['Hanse Closures', L('Re: Re: Re: delivery date', 'AW: AW: AW: Liefertermin'), '09:41', 1],
  ];
  const TDS = () => [[L('Density', 'Dichte'), '1,31 g/cm³'], [L('Tensile modulus', 'Zugmodul'), '8 000 MPa'], [L('Melting point', 'Schmelztemperatur'), '260 °C'], ['GWIT', '775 °C'], ['UL 94', 'HB'], [L('Moisture', 'Feuchte'), '≤ 0,2 %'], [L('Glass fibre', 'Glasfaser'), '25 %']];
  const CHAT = () => [['SM', 'Sven Martens', L('Who gets the HDPE surplus?', 'Wer bekommt den HDPE-Überbestand?')], ['LK', 'Lena Koch', L('Hanse is asking for the ETA again', 'Hanse fragt wieder nach der ETA')], ['SM', 'Sven Martens', L('And did anyone answer Ostsee?', 'Und hat jemand Ostsee geantwortet?')]];
  const SAPROWS = () => [['PP 7032E3', 'Hamburg', '22,0 t'], ['Marlex 9006', 'Hamburg', '14,5 t'], ['Ultramid A3X2G5', 'Duisburg', '0,0 t'], ['Ramapet N180', 'Hamburg', L('allocated', 'allokiert')], ['Hostaform C 9021', 'Hamburg', '6,2 t']];
  const PINGS = () => [['whatsapp', 'Merle Jansen', L('We need 24 t by Friday!', 'Brauchen 24 t bis Freitag!')], ['teams', 'Sven Martens', L('HDPE surplus?', 'HDPE-Überbestand?')], ['outlook', 'Tobias Brenner', L('Any news on our offer?', 'Neuigkeiten zum Angebot?')]];
  const sic = k => `<span class="sy-sic">${art(k)}</span>`;
  const bar = (k, title, cls = '') => `<div class="sy-tt ${cls}">${sic(k)}<b>${title}</b><span class="sy-dots"><i></i><i></i><i></i></span></div>`;

  const desktop = () => `<div class="sy-desk">
      <div class="sy-files">${FILES.map(f => `<span><i class="${/xlsx$/.test(f) ? 'x' : /pdf$/.test(f) ? 'p' : 'w'}"></i>${f}</span>`).join('')}</div>
      <div class="sy-w sy-ol" style="--d:0">${bar('outlook', `Outlook · ${L('Inbox', 'Posteingang')}`)}<em class="sy-badge">47</em>
        <div class="sy-olb"><nav><b>${L('Inbox', 'Posteingang')} <u>47</u></b><span>${L('Sent', 'Gesendet')}</span><span>${L('Drafts', 'Entwürfe')} <u>6</u></span><span>${L('Follow up', 'Nachfassen')}</span><span>${L('Archive', 'Archiv')}</span></nav>
        <ul>${MAILS().map(([w, s, t, u]) => `<li class="${u ? 'u' : ''}"><b>${w}</b><span>${s}</span><time>${t}</time></li>`).join('')}</ul></div></div>
      <div class="sy-w sy-sap" style="--d:1">${bar('sap', `SAP · ${L('Stock overview (MMBE)', 'Bestandsübersicht (MMBE)')}`, 'sap')}
        <table><thead><tr><th>Material</th><th>${L('Plant', 'Werk')}</th><th>${L('Free', 'Frei')}</th></tr></thead><tbody>${SAPROWS().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="sy-w sy-xl" style="--d:2">${bar('excel', 'Allokation_PET_Q4_final_v3.xlsx', 'xl')}
        <div class="sy-grid">${['', 'A', 'B', 'C', 'D'].map(c => `<span class="h">${c}</span>`).join('')}${['Weser', 'Hanse', 'Rheinform', 'Medplast', 'Elbtal', 'Harzer', 'Lippe', 'Emsland', 'Sauerland', 'Novaform'].map((k, r) => `<span class="h">${r + 1}</span><span>${k}</span><span>${(r * 7) % 40 + 5} t</span><span class="${[1, 4, 7].includes(r) ? 'y' : r === 2 ? 'r' : ''}">${['A', 'B', 'A', 'C', 'B'][r % 5]}</span><span>${[1, 4, 7].includes(r) ? '??' : r === 2 ? L('short', 'fehlt') : 'ok'}</span>`).join('')}</div></div>
      <div class="sy-w sy-tm" style="--d:3">${bar('teams', `Teams · ${L('Sales polyolefins', 'Vertrieb Polyolefine')}`, 'tm')}
        <div class="sy-chat">${CHAT().map(([a, n, m]) => `<p><i>${a}</i><span><b>${n}</b>${m}</span></p>`).join('')}<div class="sy-input">${L('Type a message', 'Nachricht eingeben')}</div></div></div>
      <div class="sy-w sy-pdf" style="--d:4">${bar('pdf', 'TDS_PA66-GF25.pdf · 1/3')}
        <div class="sy-page"><div class="sy-ph"><b>${L('TECHNICAL DATA SHEET', 'TECHNISCHES DATENBLATT')}</b><span>PA66-GF25 · ${L('heat stabilised', 'wärmestabilisiert')}</span></div>
          <table>${TDS().map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
          <div class="sy-lines">${Array.from({ length: 9 }, (_, i) => `<i style="width:${[96, 88, 92, 70, 95, 84, 90, 60, 78][i]}%"></i>`).join('')}</div></div></div>
      <div class="sy-pings">${PINGS().map(([k, n, m], i) => `<div class="sy-ping" style="--i:${i}">${sic(k)}<span><b>${n}</b>${m}</span><time>${L('now', 'jetzt')}</time></div>`).join('')}</div>
    </div>`;

  // ------------------------------------------------------------------ the screen, on: one Biesterfeld screen
  const REQS = () => [
    ['Sauerland Haushaltswaren', L('RFQ 30 t PP copolymer', 'Anfrage 30 t PP-Copolymer'), L('21 Oct', '21. Okt'), L('Quote', 'Angebot'), '30 t', 'ok', '€ 84,4k', ['ok', L('Draft ready', 'Entwurf bereit')]],
    ['Novaform Automotive', L('Re: Offer AN-2026-4102', 'AW: Angebot AN-2026-4102'), L('21 Oct', '21. Okt'), L('Follow-up', 'Nachfassen'), '12 t', 'ok', '€ 53,7k', ['ok', L('Call planned', 'Anruf geplant')]],
    ['Medplast', L('CoA for lot 26-0412', 'CoA zur Charge 26-0412'), L('21 Oct', '21. Okt'), L('Document', 'Dokument'), '–', '–', '–', ['done', L('Sent', 'Gesendet')]],
    ['Ostsee Sanitär', L('Price for 5 t ABS?', 'Preis für 5 t ABS?'), L('21 Oct', '21. Okt'), L('Price', 'Preis'), '5 t', 'ok', '€ 11,2k', ['ok', L('Scale ready', 'Staffel bereit')]],
    ['Rheinform', L('Call-off 5 t Zytel', 'Abruf 5 t Zytel'), L('21 Oct', '21. Okt'), L('Call-off', 'Abruf'), '5 t', 'ok', '€ 19,8k', ['ok', L('Order in SAP', 'Auftrag in SAP')]],
    ['Hanse Closures', L('Re: delivery date', 'AW: Liefertermin'), L('20 Oct', '20. Okt'), 'ETA', '18 t', 'part', '€ 41,0k', ['ask', L('Check with you', 'Rückfrage')]],
    ['Spessart Möbelbeschläge', L('POM in stock?', 'POM auf Lager?'), L('20 Oct', '20. Okt'), L('Stock', 'Bestand'), '8 t', 'no', '€ 23,5k', ['ok', L('Alternative ready', 'Alternative bereit')]],
  ];
  const avail = v => v === 'ok' ? `<span class="sy-av ok">${L('in stock', 'verfügbar')}</span>` : v === 'part' ? `<span class="sy-av part">${L('partly', 'teilweise')}</span>` : v === 'no' ? `<span class="sy-av no">${L('none', 'keiner')}</span>` : '–';
  const app = () => `<div class="sy-app">
      <aside><div class="sy-logo">${mask('biesterfeld', '#cb3f1d')}<b>Biesterfeld</b></div>
        <p>${ph('envelope-simple')}E-Mail</p><span>${L('Inbox', 'Posteingang')}</span><span>${L('Sent', 'Gesendet')}</span>
        <p>${ph('tray-arrow-down')}Inbound</p><span class="on">${L('Requests', 'Anfragen')}</span><span>${L('Offers', 'Angebote')}</span><span>${L('Follow-ups', 'Nachfassen')}</span>
        <p>${ph('paper-plane-tilt')}Outbound</p><span>Demand Match</span><span>${L('Pipeline planning', 'Pipeline-Planung')}</span>
        <p>${ph('chart-line')}${L('Analytics', 'Analyse')}</p><span>KPIs</span><span>Insights</span>
        <div class="sy-me"><i>KA</i><span><b>Key Account Manager</b><small>Polyolefine · Nord</small></span></div></aside>
      <main>
        <div class="sy-crumb">${ph('tray-arrow-down')}${L('Requests', 'Anfragen')}</div>
        <div class="sy-tabs"><b>${L('All customers', 'Alle Kunden')}</b><span>${L('All lines', 'Alle Positionen')}</span><span>${L('All emails', 'Alle E-Mails')}</span></div>
        <div class="sy-kpis">${[['128', '€ 4,2 Mio', L('All requests', 'Alle Anfragen')], ['74', '€ 2,6 Mio', L('Answered', 'Beantwortet')], ['31', '€ 1,2 Mio', L('Draft ready', 'Entwurf bereit')], ['23', '€ 0,4 Mio', L('Need you', 'Rückfrage nötig')]].map(([n, v, k], i) => `<div style="--i:${i}"><b>${n}</b><em>${v}</em><small>${k}</small></div>`).join('')}</div>
        <div class="sy-tools"><span class="sy-search">${ph('magnifying-glass')}${L('Search…', 'Suchen…')}</span><span>${ph('buildings')}${L('Customer', 'Kunde')}</span><span>${ph('tag')}${L('Request type', 'Art der Anfrage')}</span><span>${ph('sliders-horizontal')}${L('More filters', 'Weitere Filter')}</span>
          <span class="r">${ph('download-simple')}Download</span><span class="sy-ap">Autopilot<i class="sy-tg"><i></i></i></span></div>
        <table class="sy-tbl"><thead><tr class="g"><th colspan="4">${L('EMAIL', 'E-MAIL')}</th><th colspan="4">${L('CHECKED BY THE AUTOPILOT', 'VOM AUTOPILOT GEPRÜFT')}</th><th></th></tr>
          <tr><th>${L('Customer', 'Kunde')}</th><th>${L('Subject', 'Betreff')}</th><th>${L('Date', 'Datum')}</th><th>${L('Type', 'Art')}</th><th>${L('Qty', 'Menge')}</th><th>${L('Stock', 'Bestand')}</th><th>${L('Value', 'Wert')}</th><th>Status</th><th>${L('Next step', 'Nächster Schritt')}</th></tr></thead>
          <tbody>${REQS().map(([c, s, d, t, q, a, v, [st, sl]], i) => `<tr style="--i:${i}"><td>${c}</td><td>${s}</td><td>${d}</td><td><span class="sy-cat">${t}${ph('caret-down')}</span></td><td>${q}</td><td>${avail(a)}</td><td>${v}</td><td><span class="sy-st ${st}">${sl}</span></td><td><span class="sy-btn">${L('View', 'Ansehen')}</span></td></tr>`).join('')}</tbody></table>
        <div class="sy-foot"><span>${L('Rows per page', 'Zeilen pro Seite')} <b>25</b></span><span class="r">‹ ${L('Previous', 'Zurück')} <b>1</b> 2 3 … ${L('Next', 'Weiter')} ›</span></div>
      </main>
    </div>`;

  // ------------------------------------------------------------------ page
  function render() {
    host.innerHTML = `<div class="wrap">
      <div class="sy-head">
        <p class="sy-eyebrow reveal">${L('The key account manager’s problem', 'Das Problem im Key Account Management')}</p>
        <h2 class="sy-h reveal">${L('Reality is messy and spread across three kinds of systems', 'Der Alltag ist chaotisch und auf drei Arten von Systemen verteilt')}</h2>
        <p class="sy-lead reveal">${L('Key account managers pull context from one system, act in another and reconcile it all in their heads. SAP handles the standard case. Everything else falls into the gaps, and the person becomes the glue.', 'Key Account Manager holen Kontext aus einem System, handeln in einem anderen und gleichen alles im Kopf ab. SAP deckt den Standardfall ab. Alles andere fällt in die Lücken, und der Mensch wird zum Klebstoff.')}</p>
        <button class="sy-switch reveal" type="button" role="switch" aria-checked="false"><span class="sy-spark">${sparkle()}</span><span class="sy-sw-t">Autopilot</span><i class="sy-tg big"><i></i></i></button>
      </div>
      <div class="sy-stage reveal">
        <svg class="sy-wires" aria-hidden="true"></svg>
        <div class="sy-groups">${GROUPS().map(([label, big, small], g) => `<div class="sy-group" style="--g:${g}"><span class="sy-label">${label}</span>
          ${big.map(k => `<span class="sy-ic">${art(k)}</span>`).join('')}<span class="sy-ic sy-folder">${small.map(s => `<span>${s}</span>`).join('')}</span></div>`).join('')}</div>
        <div class="sy-lap"><div class="sy-lid"><div class="sy-screen"><span class="sy-notch"></span><div class="sy-fit"><div class="sy-canvas">${desktop()}${app()}</div></div></div></div><div class="sy-deck"><span></span></div></div>
      </div>
    </div>`;
    host.querySelectorAll('.reveal').forEach(el => (reduced || host.dataset.seen ? el.classList.add('in') : io.observe(el)));
    set(on); fit(); requestAnimationFrame(wires);
  }
  function sparkle() { return `<svg viewBox="0 0 24 24"><path d="M10 3l1.9 5.6L17.5 10.5l-5.6 1.9L10 18l-1.9-5.6L2.5 10.5l5.6-1.9z" fill="currentColor"/><path d="M18.5 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor"/></svg>`; }
  function set(v) {
    on = v; host.classList.toggle('is-on', on);
    const sw = host.querySelector('.sy-switch'); if (sw) sw.setAttribute('aria-checked', String(on));
  }
  // scale the 1280 × 800 screen to the laptop
  function fit() { const s = host.querySelector('.sy-screen'), f = host.querySelector('.sy-fit'); if (s && f) f.style.setProperty('--s', s.clientWidth / 1280); }
  // the wires: from each group, right to a spine, down or up along it, then into the laptop
  function wires() {
    const st = host.querySelector('.sy-stage'), svg = host.querySelector('.sy-wires'), lap = host.querySelector('.sy-screen');
    if (!st || !svg || !lap || getComputedStyle(svg).display === 'none') return;
    const S = st.getBoundingClientRect(), B = lap.getBoundingClientRect();
    const gs = [...host.querySelectorAll('.sy-group')].map(g => g.getBoundingClientRect());
    const my = B.top + B.height / 2 - S.top, lx = B.left - S.left - 2;
    const gx = Math.max(...gs.map(g => g.right - S.left));
    const sx = gx + (lx - gx) * .45, r = Math.min(28, (lx - gx) * .3);
    const paths = gs.map(g => {
      const y = g.top + g.height / 2 - S.top, x = g.right - S.left, dy = my - y, sg = Math.sign(dy);
      if (Math.abs(dy) < 2 * r) return `M${x} ${y}H${lx}`;
      return `M${x} ${y}H${sx - r}Q${sx} ${y} ${sx} ${y + sg * r}V${my - sg * r}Q${sx} ${my} ${sx + r} ${my}H${lx}`;
    });
    svg.setAttribute('viewBox', `0 0 ${S.width} ${S.height}`);
    svg.innerHTML = paths.map(d => `<path class="w" d="${d}"/>`).join('') + paths.map((d, i) => `<path class="g" pathLength="100" style="--i:${i}" d="${d}"/><path class="f" pathLength="100" style="--i:${i}" d="${d}"/>`).join('');
  }
  // the stage well in view: turn on once, after a beat; out of view entirely: back to off, unseen
  function watch(e) {
    host.classList.toggle('sy-vis', e.isIntersecting);
    if (touched || reduced) return;
    if (e.intersectionRatio >= .55 && !on) { clearTimeout(timer); timer = setTimeout(() => set(true), 700); }
    else if (e.intersectionRatio < .55) clearTimeout(timer);
    if (!e.isIntersecting && on) { host.classList.add('sy-snap'); set(false); void host.offsetWidth; host.classList.remove('sy-snap'); }
  }
  host.addEventListener('click', e => { if (!e.target.closest('.sy-switch')) return; touched = true; clearTimeout(timer); set(!on); });
  host.addEventListener('mousedown', e => { if (e.target.closest('.sy-switch')) e.preventDefault(); }); // no focus ring on a mouse click
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); host.dataset.seen = 1; } }), { threshold: 0.05 });
  let stageIO;
  const observe = () => { stageIO?.disconnect(); stageIO = new IntersectionObserver(([e]) => watch(e), { threshold: [0, .55] }); const st = host.querySelector('.sy-stage'); if (st) stageIO.observe(st); };
  // only when the size really changed: redraw the wires and rescale the screen
  new ResizeObserver(() => { const k = `${host.clientWidth}`; if (k === size) return; size = k; fit(); wires(); }).observe(host);
  if (reduced) on = true;
  render(); observe();
  document.fonts?.ready.then(wires);
  window.UI?.onLang(() => { render(); observe(); });
})();
