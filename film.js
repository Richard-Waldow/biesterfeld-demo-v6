/* Version 5 hero film, cut like GeneralMind's hero video (hero_03_new.mp4) but for a Biesterfeld key account manager.
   Three scenes on one blue-grey stage:
   1. the laptop: shut and filmed close, the lid opens slowly while the camera pulls back; the desktop fills up with
      Outlook, Teams, SAP, a data sheet, the allocation sheet, the CRM, pings and a call, badges in the dock;
   2. the switch: one glass "Biesterfeld Autopilot" switch in the middle, the cursor flips it;
   3. the app: close on its top right corner, the Autopilot goes on, "Autopilot aktiviert"; close on the rows as they
      turn to done; back to the whole screen and "47 Anfragen bearbeitet". Then it loops.
   It runs on one clock: every frame is drawn from the time t alone (frame(t)), with no CSS transitions, so nothing
   can drift or stack up. It pauses off screen and keeps its place. Everything sits in a 1920 × 900 world scaled to
   the stage; positions are measured once (offsets, so transforms do not disturb them) and again after fonts load. */
(() => {
  const host = document.getElementById('film'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const base = window.SHARED_BASE || '../shared/';
  const src = n => new URL(`${base}logos/${n}.svg`, document.baseURI).href;
  const mask = (n, c) => `<span class="fm-mask" style="--m:url('${src(n)}');--c:${c}"></span>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spark = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.9 5.6L17.5 10.5l-5.6 1.9L10 18l-1.9-5.6L2.5 10.5l5.6-1.9z" fill="currentColor"/><path d="M18.5 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor"/></svg>`;
  const toggle = cls => `<i class="fm-tg ${cls}"><b></b><i></i></i>`;

  // ------------------------------------------------------------------ app icons in the style of the real ones
  const tile = (bg, inner, fg = '#fff') => `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="${bg}"/>${inner.replaceAll('FG', fg)}</svg>`;
  const letter = (ch, x = 24, size = 22) => `<text x="${x}" y="31.5" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" font-size="${size}" fill="FG">${ch}</text>`;
  const ICON = {
    outlook: tile('#fff', `<rect x="18" y="10" width="22" height="28" rx="3" fill="#28a8ea"/><path d="M18 22l11 7 11-7v14a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2z" fill="#0078d4"/><rect x="7" y="14" width="20" height="20" rx="3" fill="#0a64ad"/>${letter('O', 17, 15).replace('y="31.5"', 'y="29.5"')}`),
    teams: tile('#fff', `<circle cx="33" cy="15" r="5" fill="#7b83eb"/><rect x="27" y="21" width="14" height="15" rx="6" fill="#7b83eb"/><rect x="7" y="13" width="23" height="23" rx="3" fill="#5059c9"/>${letter('T', 18.5, 16).replace('y="31.5"', 'y="30"')}`),
    excel: tile('#fff', `<rect x="18" y="10" width="22" height="28" rx="3" fill="#21a366"/><path d="M29 10h9a2 2 0 0 1 2 2v8H29z" fill="#33c481"/><path d="M29 28h11v8a2 2 0 0 1-2 2h-9z" fill="#107c41"/><rect x="7" y="14" width="20" height="20" rx="3" fill="#107c41"/>${letter('X', 17, 15).replace('y="31.5"', 'y="29.5"')}`),
    word: tile('#fff', `<rect x="18" y="10" width="22" height="28" rx="3" fill="#41a5ee"/><rect x="18" y="19" width="22" height="10" fill="#2b7cd3"/><rect x="18" y="29" width="22" height="9" rx="0" fill="#185abd"/><rect x="7" y="14" width="20" height="20" rx="3" fill="#185abd"/>${letter('W', 17, 14).replace('y="31.5"', 'y="29"')}`),
    whatsapp: `<span class="fm-ic-wrap" style="background:#fff">${mask('whatsapp', '#25d366')}</span>`,
    phone: tile('#34c759', `<path d="M17 13c1.5-1 3-.5 3.6.9l1.6 3.5c.4 1-.1 2-.9 2.6l-1.4 1c1 2.6 3 4.7 5.6 5.7l1-1.4c.6-.8 1.7-1.2 2.6-.8l3.5 1.6c1.4.6 1.9 2.1.9 3.6l-1 1.4c-1.5 2-4.5 2.5-6.9 1.2-4.6-2.4-8.4-6.2-10.8-10.8-1.3-2.4-.8-5.4 1.2-6.9z" fill="FG"/>`),
    sap: `<span class="fm-ic-wrap" style="background:#fff">${mask('sap', '#0a6ed1')}</span>`,
    crm: `<span class="fm-ic-wrap" style="background:#fff">${mask('biesterfeld', '#cb3f1d')}</span>`,
    pilot: tile('#cb3f1d', `<path d="M24 11l2.8 7.7L34.5 21l-7.7 2.8L24 31.5l-2.8-7.7L13.5 21l7.7-2.3z" fill="FG"/><path d="M34 29l1.2 3.3 3.3 1.2-3.3 1.2L34 38l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="FG"/>`),
  };
  const icon = (k, cls = '') => `<span class="fm-ic ${cls}">${ICON[k]}</span>`;
  window.FM_ICON = ICON; // systems.js draws the same app icons

  // ------------------------------------------------------------------ scene 1: the desktop
  const OUTLOOK = () => [
    ['Ilka Schröder', L('RFQ 30 t PP copolymer, week 46', 'Anfrage 30 t PP-Copolymer, KW 46'), '07:52', true],
    ['Tobias Brenner', L('Re: Offer AN-2026-4102?', 'AW: Angebot AN-2026-4102?'), '08:10', true],
    ['Dr. Felix Haag', L('CoA for lot 26-0412 please', 'CoA zur Charge 26-0412 bitte'), '08:31', false],
    ['Ostsee Sanitär', L('Price for 5 t ABS?', 'Preis für 5 t ABS?'), '08:44', true],
    ['Katrin Vogt', L('GWIT 775 °C confirmed?', 'GWIT 775 °C bestätigt?'), '09:02', false],
    ['ExxonMobil', L('Shipping notice: ETA moved', 'Avis: ETA verschoben'), '09:15', true],
    ['Rheinform', L('Call-off 5 t Zytel', 'Abruf 5 t Zytel'), '09:21', true],
  ];
  const SAP = () => [['PP 7032E3', 'Hamburg', '22,0 t', 'KW 45: 8,0 t'], ['Marlex 9006', 'Hamburg', '14,5 t', '–'], ['Ultramid A3X2G5', 'Duisburg', '0,0 t', 'KW 47: 20,0 t'], ['Ramapet N180', 'Hamburg', L('allocated', 'allokiert'), 'KW 46: 40,0 t'], ['Hostaform C 9021', 'Hamburg', '6,2 t', '–']];
  // macOS banners: [app, initials (a person's avatar with the app as a badge) or none (the app icon), sender, subject, text]
  const PINGS = () => [
    ['whatsapp', 'MJ', 'Merle Jansen', '', L('We need 24 t by Friday! Can it ship from Hamburg?', 'Brauchen 24 t bis Freitag! Geht das ab Hamburg?')],
    ['teams', 'SM', 'Sven Martens', '', L('Who gets the HDPE surplus this week?', 'Wer bekommt diese Woche den HDPE-Überbestand?')],
    ['outlook', '', 'Tobias Brenner', L('Re: Offer AN-2026-4102', 'AW: Angebot AN-2026-4102'), L('Any news on our offer? We need to decide by Thursday.', 'Gibt es Neuigkeiten zum Angebot? Wir müssen bis Donnerstag entscheiden.')],
    ['call', 'MJ', 'Merle Jansen', '', L('WhatsApp audio call', 'WhatsApp-Audioanruf')],
    ['whatsapp', 'PE', 'Paul Engel', '', L('Price for PBT GF30, 5 t?', 'Preis für PBT GF30, 5 t?')],
  ];
  const appIcon = k => (k === 'whatsapp' || k === 'call' ? `<span class="fm-nic wa">${mask('whatsapp', '#fff')}</span>` : `<span class="fm-nic">${ICON[k]}</span>`);
  const banner = ([k, who, name, subj, text], i) => `<div class="fm-ping${k === 'call' ? ' fm-call' : ''}" style="--i:${i}">
      ${who ? `<span class="fm-av2"><b>${who}</b>${appIcon(k)}</span>` : appIcon(k)}
      <span class="fm-nt"><b>${name}</b>${subj ? `<em>${subj}</em>` : ''}<small>${text}</small></span>
      ${k === 'call' ? `<span class="fm-cb2"><i class="no">${ph('phone-disconnect')}</i><i class="yes">${ph('phone')}</i></span>` : `<time>${L('now', 'jetzt')}</time>`}
    </div>`;
  const CHAT = () => [['SM', 'Sven Martens', L('Who gets the HDPE surplus?', 'Wer bekommt den HDPE-Überbestand?')], ['LK', 'Lena Koch', L('Hanse is asking for the ETA again', 'Hanse fragt wieder nach der ETA')], ['SM', 'Sven Martens', L('Did anyone answer Ostsee?', 'Hat jemand Ostsee geantwortet?')]];
  const TDS = () => [[L('Density', 'Dichte'), '1,31 g/cm³'], [L('Tensile modulus', 'Zugmodul'), '8 000 MPa'], [L('Melting point', 'Schmelzpunkt'), '260 °C'], ['GWIT', '775 °C'], ['UL 94', 'HB'], [L('Glass fibre', 'Glasfaser'), '25 %']];
  const FILES = ['Preisliste_Q4.xlsx', 'CoA_26-0412.pdf', 'TDS_PA66.pdf', 'Allokation_v3.xlsx', 'AN-4102.docx', 'Kunden_PP.xlsx', 'Rahmenvertrag.pdf', 'final_v2.pdf', 'Screenshot 10-14.png', 'Avis_ETA.pdf'];

  function desktop() {
    const win = (cls, d, ic, title, body, badge) => `<div class="fm-win ${cls}" style="--d:${d}"><div class="fm-tt">${icon(ic, 'sm')}<b>${title}</b>${badge ? `<em>${badge}</em>` : ''}<span class="fm-dots"><i></i><i></i><i></i></span></div>${body}</div>`;
    return `<div class="fm-canvas">
      <div class="fm-bar"><span>${mask('biesterfeld', '#3a3d42')}</span><b>Biesterfeld</b><span class="fm-bar-r">${ph('wifi-high')}${ph('battery-high')}<span>${L('Wed 09:16', 'Mi. 09:16')}</span></span></div>
      <div class="fm-files">${FILES.map(f => `<span><i class="${/xlsx$/.test(f) ? 'x' : /pdf$/.test(f) ? 'p' : /png$/.test(f) ? 'g' : 'w'}"></i>${f}</span>`).join('')}</div>
      <div class="fm-chaos">
        ${win('fm-ol', 0, 'outlook', `Outlook · ${L('Inbox', 'Posteingang')}`, `<ul>${OUTLOOK().map(([w, s, t, u]) => `<li class="${u ? 'u' : ''}"><b>${w}</b><span>${s}</span><time>${t}</time></li>`).join('')}</ul>`, 47)}
        ${win('fm-tm', 1, 'teams', `Teams · ${L('Sales polyolefins', 'Vertrieb Polyolefine')}`, `<div class="fm-chat">${CHAT().map(([a, n, m]) => `<p><i>${a}</i><span><b>${n}</b>${m}</span></p>`).join('')}<div class="fm-input">${L('Type a message', 'Nachricht eingeben')}</div></div>`, 12)}
        ${win('fm-sap', 2, 'sap', `SAP Easy Access · ${L('Stock overview (MMBE)', 'Bestandsübersicht (MMBE)')}`, `<table><thead><tr><th>Material</th><th>${L('Plant', 'Werk')}</th><th>${L('Free', 'Frei')}</th><th>${L('Inbound', 'Zulauf')}</th></tr></thead><tbody>${SAP().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`)}
        ${win('fm-pdf', 3, 'word', 'TDS_PA66-GF25.pdf', `<div class="fm-page"><b>${L('TECHNICAL DATA SHEET', 'TECHNISCHES DATENBLATT')}</b><small>PA66-GF25 · ${L('heat stabilised', 'wärmestabilisiert')}</small><table>${TDS().map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>${Array.from({ length: 7 }, (_, i) => `<i style="width:${[96, 88, 92, 70, 95, 84, 60][i]}%"></i>`).join('')}</div>`)}
        ${win('fm-xl', 4, 'excel', 'Allokation_PET_Q4_final_v3.xlsx', `<div class="fm-grid">${Array.from({ length: 48 }, (_, i) => `<span class="${[9, 14, 22, 27, 33].includes(i) ? 'y' : ''}${i % 6 === 0 ? ' h' : ''}">${i % 6 === 0 ? ['Weser', 'Hanse', 'Rheinform', 'Medplast', 'Elbtal', 'Harzer', 'Lippe', 'Emsland'][i / 6] : i % 6 === 1 ? `${(i * 7) % 40 + 5} t` : ''}</span>`).join('')}</div>`)}
        ${win('fm-crm', 5, 'crm', 'Biesterfeld CRM · Hanse Closures', `<dl><dt>${L('Last call-off', 'Letzter Abruf')}</dt><dd>${L('3 weeks ago', 'vor 3 Wochen')}</dd><dt>${L('Rhythm', 'Rhythmus')}</dt><dd>${L('every 3 weeks', 'alle 3 Wochen')}</dd><dt>${L('Open', 'Offen')}</dt><dd>${L('call-off due?', 'Abruf fällig?')}</dd></dl>`)}
        <div class="fm-pings">${PINGS().map(banner).join('')}</div>
      </div>
      <div class="fm-dock">${[['outlook', 47], ['phone', 4], ['teams', 12], ['whatsapp', 23], ['word', 0], ['excel', 3], ['sap', 0], ['crm', 8]].map(([k, n]) => `<span class="fm-di">${icon(k)}${n ? `<em>${n}</em>` : ''}</span>`).join('')}</div>
    </div>`;
  }

  // ------------------------------------------------------------------ scene 3: the app
  // [customer, number, request, status before, status after, value, grade, plant, received, delivery]
  const ROWS = () => [
    ['Sauerland Haushaltswaren', '204117', 'AF-08817', ['o', L('Open', 'Offen')], ['g', L('Offer sent', 'Angebot gesendet')], '€ 84 400', 'PP 7032E3', 'Hamburg', '21.10.', 'KW 46'],
    ['Novaform Automotive', '201845', 'AF-08812', ['y', L('Query', 'Rückfrage')], ['g', L('Done', 'Erledigt')], '€ 53 700', 'Ultramid A3X2G5', 'Duisburg', '21.10.', 'KW 47'],
    ['Medplast Medical', '203390', 'AF-08809', ['o', L('Open', 'Offen')], ['g', L('CoA sent', 'CoA gesendet')], '–', 'Hostaform C 9021', 'Hamburg', '21.10.', '–'],
    ['Hanse Closures', '200712', 'AF-08804', ['r', L('Mismatch', 'Abweichung')], ['b', L('For approval', 'Zur Freigabe')], '€ 41 000', 'Marlex 9006', 'Hamburg', '20.10.', 'KW 46'],
    ['Ostsee Sanitär', '205561', 'AF-08801', ['o', L('Open', 'Offen')], ['g', L('Offer sent', 'Angebot gesendet')], '€ 11 200', 'Terluran GP-35', 'Hamburg', '20.10.', 'KW 45'],
    ['Rheinform Kunststoff', '202004', 'AF-08797', ['y', L('Query', 'Rückfrage')], ['g', L('Order created', 'Auftrag angelegt')], '€ 19 800', 'Zytel 70G30', 'Duisburg', '20.10.', 'KW 46'],
    ['Spessart Beschläge', '206630', 'AF-08790', ['r', L('Mismatch', 'Abweichung')], ['g', L('Done', 'Erledigt')], '€ 23 500', 'Hostaform C 9021', 'Hamburg', '19.10.', 'KW 47'],
    ['Weser Verpackung', '203118', 'AF-08786', ['o', L('Open', 'Offen')], ['g', L('Offer sent', 'Angebot gesendet')], '€ 62 100', 'Ramapet N180', 'Hamburg', '19.10.', 'KW 48'],
  ];
  function app() {
    return `<div class="fm-panel">
      <aside><span class="fm-lt">${mask('biesterfeld', '#fff')}</span>${[['house', L('Home', 'Start')], ['chart-bar', L('Analytics', 'Analyse')], ['users', L('Customers', 'Kunden')], ['receipt', L('Billing', 'Abrechnung')]].map(([i, t], n) => `<span class="${n ? '' : 'on'}">${ph(i)}<small>${t}</small></span>`).join('')}</aside>
      <main>
        <div class="fm-top"><h4>${L('Request autopilot', 'Anfragen-Autopilot')}</h4><span class="fm-icons">${ph('clock-counter-clockwise')}<u></u>${ph('megaphone')}<u></u><span class="fm-bell">${ph('bell')}</span><i class="fm-av">KA</i></span></div>
        <div class="fm-tabs"><span class="on">${L('Overview', 'Übersicht')}</span><span>${L('Autopilot rules', 'Autopilot-Regeln')}</span><span class="fm-ap">${spark}Autopilot${toggle('ap')}</span></div>
        <div class="fm-tools"><span class="fm-search">${ph('magnifying-glass')}${L('Search…', 'Suchen…')}</span><span>${ph('circle-half')}Status</span><span>${ph('funnel-simple')}${L('More filters', 'Weitere Filter')}</span><span class="fm-dl">${L('Download', 'Download')}</span></div>
        <div class="fm-kpis"><span>${L('Requests', 'Anfragen')} <b>47</b><em>€ 1,2 Mio</em></span><span>${L('Ready to send', 'Bereit zum Senden')} <b>31</b><em>€ 0,8 Mio</em></span><span>${L('With mismatch', 'Mit Abweichung')} <b>6</b><em>€ 0,2 Mio</em></span></div>
        <table class="fm-tbl"><thead><tr><th></th><th>${L('Customer', 'Kunde')} ⇅</th><th>${L('Cust. no.', 'Kd.-Nr.')} ⇅</th><th>${L('Request', 'Anfrage')} ⇅</th><th>Status ⇅</th><th>${L('Value', 'Wert')} ⇅</th><th>Material ⇅</th><th>${L('Plant', 'Werk')}</th><th>${L('Received', 'Eingang')} ⇅</th><th>${L('Delivery', 'Liefertermin')} ⇅</th></tr></thead>
          <tbody>${ROWS().map(([c, n, r, [b0, t0], [b1, t1], v, g, w, e, d], i) => `<tr style="--i:${i}"><td><i class="fm-cb"></i></td><td>${c}</td><td>${n}</td><td>${r}</td><td><span class="fm-st"><span class="s0 ${b0}">${t0}</span><span class="s1 ${b1}">${t1}</span></span></td><td>${v}</td><td>${g}</td><td>${w}</td><td>${e}</td><td>${d}</td></tr>`).join('')}</tbody></table>
        <div class="fm-pg"><span>${L('Rows per page', 'Zeilen pro Seite')} <b>8</b></span><span>‹ 1 / 6 ›</span></div>
      </main>
    </div>`;
  }
  const toast = (cls, text, check) => `<div class="fm-toast ${cls}"><span class="fm-tile">${spark}${check ? `<i>${ph('check')}</i>` : ''}</span><b>${text}</b></div>`;
  const cursorSvg = `<svg class="fm-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.4l15 11-6.6 1.2 3.9 7.3-3 1.6-3.9-7.4L5 21.4z" fill="rgb(0 0 0 / .22)"/><path d="M4 2l15 11-6.6 1.2 3.9 7.3-3 1.6-3.9-7.4L4 20z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

  // ------------------------------------------------------------------ easing and tracks
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    lin: p => p,
    out: p => 1 - (1 - p) ** 3,
    in: p => p ** 3,
    io: p => (p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
    io2: p => (p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
    back: p => { const c = 1.5; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; },
  };
  // progress of t through [a, b], eased
  const seg = (t, a, b, e = E.io) => e(clamp((t - a) / (b - a)));

  // ------------------------------------------------------------------ the script (seconds)
  const D = 22.6;
  const T = {
    lidA: 1.1, lidB: 5.3, camA: 0.9, camB: 5.6, screenA: 2.3, screenB: 3.6,
    win: 5.5, winStep: .46, ping: 5.9, pingStep: .58, badge: 5.7, badgeStep: .32, clear: 8.7,
    toSw: 9.3, swCurIn: 9.6, swCurA: 9.9, swCurB: 10.7, swClick: 10.85, toApp: 11.8,
    panelA: 11.8, panelB: 13.2, apCurIn: 12.7, apCurA: 13.0, apCurB: 13.75, apClick: 13.9, actA: 14.2, actB: 15.2,
    rowsA: 15.3, rowsB: 16.7, flip: 16.35, flipStep: .22, rows2A: 16.8, rows2B: 18.0, overA: 18.0, overB: 19.4, doneA: 19.6,
  };

  let el = {}, at = {}, t = 0, raf = 0, last = 0, visible = false;

  function render() {
    host.innerHTML = `<div class="fm-stage"><div class="fm-world">
        <div class="fm-sc sc-lap"><div class="fm-cam"><div class="fm-laptop">
          <div class="fm-lid"><div class="fm-back">${mask('biesterfeld', 'rgb(255 255 255 / .1)')}</div><div class="fm-screen"><span class="fm-notch"></span><div class="fm-fit">${desktop()}</div><span class="fm-dark"></span></div></div>
          <div class="fm-deck"><span class="fm-lip"></span></div>
        </div></div></div>
        <div class="fm-sc sc-sw"><div class="fm-swcam"><div class="fm-pill">${mask('biesterfeld', '#fff')}<b>Biesterfeld Autopilot</b>${toggle('big')}</div></div></div>
        <div class="fm-sc sc-app"><div class="fm-acam">${app()}</div>
          ${toast('t-act', L('Autopilot activated', 'Autopilot aktiviert'))}${toast('t-done', L('47 requests processed', '47 Anfragen bearbeitet'), true)}</div>
        <span class="fm-ripple"></span>${cursorSvg}
      </div></div>`;
    const q = s => host.querySelector(s), qa = s => [...host.querySelectorAll(s)];
    el = {
      stage: q('.fm-stage'), world: q('.fm-world'), lap: q('.sc-lap'), sw: q('.sc-sw'), app: q('.sc-app'), cam: q('.fm-cam'), lid: q('.fm-lid'), dark: q('.fm-dark'),
      wins: qa('.fm-win'), pings: qa('.fm-ping'), badges: qa('.fm-di em'), dock: qa('.fm-di'),
      swcam: q('.fm-swcam'), swTg: q('.fm-tg.big'), acam: q('.fm-acam'), panel: q('.fm-panel'), apTg: q('.fm-tg.ap'),
      tAct: q('.t-act'), tDone: q('.t-done'), st: qa('.fm-st'), rows: qa('.fm-tbl tbody tr'), cursor: q('.fm-cursor'), ripple: q('.fm-ripple'),
    };
    fit(); measure(); frame(reduced ? 21 : t);
  }

  // offsets up to a root, unaffected by transforms
  function pos(n, root) { let x = n.offsetWidth / 2, y = n.offsetHeight / 2; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return [x, y]; }
  function measure() {
    if (!el.acam) return;
    const world = host.querySelector('.fm-world');
    at.ping = el.pings.map(n => n.offsetHeight);
    at.win = el.wins.map(w => [w.offsetLeft + w.offsetWidth / 2, w.offsetTop + w.offsetHeight / 2]);
    at.dock = [640, 800 - 30 - (host.querySelector('.fm-dock')?.offsetHeight || 86) / 2];
    at.sw = pos(el.swTg, world);
    const [tx, ty] = pos(el.apTg, el.acam), [sx] = pos(el.st[0], el.acam);
    at.ap = [tx, ty];
    at.shots = {
      corner: { f: [tx - 150, ty + 60], k: 2.5 },
      rows: { f: [sx + 120, pos(el.rows[2], el.acam)[1]], k: 2.1 },
      rows2: { f: [sx + 60, pos(el.rows[5], el.acam)[1]], k: 2.1 },
      over: { f: [960, 450], k: 1 },
    };
    // the toggle on the stage while the corner shot holds; the toast sits below it
    const c = at.shots.corner; at.apScreen = [960 + (tx - c.f[0]) * c.k, 450 + (ty - c.f[1]) * c.k];
    el.tAct.style.left = `${at.apScreen[0] - 1000}px`; el.tAct.style.top = `${at.apScreen[1] + 84}px`;
  }

  // ------------------------------------------------------------------ one frame
  const set = (n, tr, op) => { if (!n) return; if (tr != null) n.style.transform = tr; if (op != null) n.style.opacity = op; };
  const mix = (a, b, p) => { const k = Math.exp(lerp(Math.log(a.k), Math.log(b.k), p)); return { k, f: [lerp(a.f[0], b.f[0], p), lerp(a.f[1], b.f[1], p)] }; };
  const camT = c => `translate(${960 - c.f[0] * c.k}px, ${450 - c.f[1] * c.k}px) scale(${c.k})`;
  function tg(n, p) { if (!n) return; n.style.setProperty('--p', p); }

  function frame(time) {
    t = time; if (!el.stage) return;
    // the loop: in from and out to the stage colour
    el.world.style.opacity = Math.min(seg(t, 0, .45, E.lin), 1 - seg(t, D - .6, D, E.lin));

    // scenes
    const lapOp = 1 - seg(t, T.toSw, T.toSw + .4, E.io2), swOp = seg(t, T.toSw + .3, T.toSw + .8, E.io2) * (1 - seg(t, T.toApp, T.toApp + .35, E.io2)), appOp = seg(t, T.toApp + .2, T.toApp + .6, E.io2);
    set(el.lap, null, lapOp); set(el.sw, null, swOp); set(el.app, null, appOp);
    el.lap.style.visibility = lapOp ? 'visible' : 'hidden'; el.sw.style.visibility = swOp ? 'visible' : 'hidden'; el.app.style.visibility = appOp ? 'visible' : 'hidden';

    // 1. the laptop: close-up on the shut lid, a slow pull back while the lid opens
    if (lapOp) {
      const c = seg(t, T.camA, T.camB, E.io), drift = seg(t, 0, T.camA, E.lin);
      set(el.cam, `translateY(${lerp(-130, 0, c)}px) scale(${Math.exp(lerp(Math.log(2.35 + .04 * drift), 0, c))})`);
      set(el.lid, `rotateX(${lerp(-89.5, 0, seg(t, T.lidA, T.lidB, E.io))}deg)`);
      el.dark.style.opacity = 1 - seg(t, T.screenA, T.screenB, E.io2);
      el.wins.forEach((w, i) => {
        const a = T.win + i * T.winStep, p = seg(t, a, a + .55, E.back), o = seg(t, a, a + .3, E.lin);
        const q = seg(t, T.clear + (el.wins.length - 1 - i) * .05, T.clear + .5 + (el.wins.length - 1 - i) * .05, E.in), [cx, cy] = at.win[i] || [640, 400];
        set(w, `translate(${(at.dock[0] - cx) * q}px, ${lerp(26, 0, p) + (at.dock[1] - cy) * q}px) scale(${lerp(.94, 1, p) * lerp(1, .12, q)})`, o * (1 - seg(t, T.clear + .25, T.clear + .65, E.lin)));
      });
      const out = seg(t, T.clear, T.clear + .35, E.in);
      // banners slide in from the right edge at the top; each new one pushes the others down, like macOS
      const due = el.pings.map((_, i) => T.ping + i * T.pingStep);
      el.pings.forEach((n, i) => {
        const p = seg(t, due[i], due[i] + .55, E.out), y = el.pings.reduce((sum, m, j) => sum + (j > i ? seg(t, due[j], due[j] + .45, E.io) * ((at.ping[j] || 80) + 10) : 0), 0);
        set(n, `translate(${lerp(400, 0, p) + 400 * out}px, ${y}px)`, seg(t, due[i], due[i] + .2, E.lin) * (1 - out));
      });
      el.badges.forEach((b, i) => { const a = T.badge + i * T.badgeStep, p = seg(t, a, a + .4, E.back); set(b, `scale(${lerp(.3, 1, p)})`, seg(t, a, a + .15, E.lin)); });
      el.dock.forEach((d, i) => { const a = T.badge + i * T.badgeStep, h = Math.sin(clamp((t - a) / .45) * Math.PI); const ic = d.firstElementChild; if (ic) ic.style.transform = `translateY(${-14 * h}px)`; });
    }

    // 2. the switch: a slow push in, the cursor comes in and flips it
    if (swOp) {
      const z = lerp(.97, 1.06, seg(t, T.toSw + .3, T.toApp + .4, E.out));
      set(el.swcam, `scale(${z})`);
      tg(el.swTg, seg(t, T.swClick, T.swClick + .35, E.back));
    }

    // 3. the app: the camera between shots, the panel sliding in, the switch, the rows, the toasts
    if (appOp) {
      const S = at.shots; let c;
      if (t < T.rowsA) c = S.corner;
      else if (t < T.rows2A) c = mix(S.corner, S.rows, seg(t, T.rowsA, T.rowsB, E.io));
      else if (t < T.overA) c = mix(S.rows, S.rows2, seg(t, T.rows2A, T.rows2B, E.io2));
      else c = mix(S.rows2, { f: [960, 450], k: 1 + .02 * seg(t, T.overB, D, E.lin) }, seg(t, T.overA, T.overB, E.io));
      set(el.acam, camT(c));
      const p = seg(t, T.panelA, T.panelB, E.out);
      set(el.panel, `translate(${lerp(-170, 0, p)}px, ${lerp(230, 0, p)}px)`);
      tg(el.apTg, seg(t, T.apClick, T.apClick + .35, E.back));
      { const a = seg(t, T.actA, T.actA + .6, E.out), o = seg(t, T.actA, T.actA + .35, E.lin) * (1 - seg(t, T.actB, T.actB + .35, E.lin)); set(el.tAct, `translate(${lerp(70, 0, a) - 40 * seg(t, T.actB, T.actB + .35, E.in)}px, 0) scale(${lerp(.96, 1, a)})`, o); }
      el.st.forEach((s, i) => { const a = T.flip + i * T.flipStep, f = seg(t, a, a + .3, E.lin), b = seg(t, a + .05, a + .45, E.back); s.style.setProperty('--f', f); s.style.setProperty('--b', b); });
      { const a = seg(t, T.doneA, T.doneA + .7, E.out); set(el.tDone, `translate(-50%, ${lerp(46, 0, a)}px) scale(${lerp(.96, 1, a)})`, seg(t, T.doneA, T.doneA + .4, E.lin)); }
    }
    // the cursor and the click ring, one place for both scenes
    el.ripple.style.opacity = 0;
    if (t >= T.swCurIn && t < T.toApp + .4) {
      const z = lerp(.97, 1.06, seg(t, T.toSw + .3, T.toApp + .4, E.out)), tx = 960 + (at.sw[0] + 24 - 960) * z, ty = 450 + (at.sw[1] + 14 - 450) * z, m = seg(t, T.swCurA, T.swCurB, E.io);
      cursor(true, lerp(1560, tx, m), lerp(880, ty, m), seg(t, T.swCurIn, T.swCurIn + .25, E.lin) * (1 - seg(t, T.toApp, T.toApp + .3, E.lin)), T.swClick);
      ripple(T.swClick, tx, ty);
    } else if (t >= T.apCurIn && t < T.actA + .8) {
      const [ax, ay] = at.apScreen, m = seg(t, T.apCurA, T.apCurB, E.io);
      cursor(true, lerp(ax - 280, ax + 18, m), lerp(ay + 190, ay + 6, m), seg(t, T.apCurIn, T.apCurIn + .25, E.lin) * (1 - seg(t, T.actA + .4, T.actA + .8, E.lin)), T.apClick);
      ripple(T.apClick, ax + 18, ay + 6);
    } else cursor(false);
  }
  // the cursor tip at (x, y); it presses briefly at the click
  function cursor(show, x = 0, y = 0, op = 1, click = 0) {
    const c = el.cursor; if (!c) return;
    if (!show) { c.style.opacity = 0; return; }
    const press = 1 - .16 * Math.sin(clamp((t - click) / .26) * Math.PI);
    c.style.opacity = op; c.style.transform = `translate(${x - 11}px, ${y - 5}px) scale(${press})`;
  }
  function ripple(when, x, y) {
    if (t < when || t > when + .7) return;
    const p = seg(t, when, when + .7, E.out);
    el.ripple.style.opacity = .55 * (1 - p); el.ripple.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${lerp(.3, 1.6, p)})`;
  }

  // ------------------------------------------------------------------ the clock
  function tick(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    frame((t + dt) % D);
    raf = requestAnimationFrame(tick);
  }
  function start() { if (raf || reduced) return; last = performance.now(); raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function fit() { if (el.stage) el.stage.style.setProperty('--k', el.stage.clientWidth / 1920); }

  new ResizeObserver(fit).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? start() : stop(); }, { threshold: .2 }).observe(host);
  document.addEventListener('visibilitychange', () => (visible && !document.hidden ? start() : stop()));
  host.seek = s => { stop(); frame(s); }; // for checking single frames
  render();
  document.fonts?.ready.then(() => { measure(); frame(reduced ? 21 : t); });
  window.UI?.onLang(render);
})();
