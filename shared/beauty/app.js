/* "Play with the product": an interactive sales cockpit for Biesterfeld Plastic, mounted inside the beauty pages.
   Same interaction model as a modern ops SaaS (sidebar modules, tabs with counts, KPI tiles, filters, sortable tables,
   a next-action column, side drawer, split document view with pre-send validation, guided tour, AutoPilot), applied to
   our flow: messages in, demand extracted, stock matched, offer drafted, a person approves and sends.
   AutoPilot prepares everything; nothing reaches a customer without a click. */
(() => {
  const E = window.Engine, S = window.SAMPLE, BASE = window.SHARED_BASE || '../shared/';
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ph = (n, c = '') => `<i class="ph-light ph-${n} ${c}" aria-hidden="true"></i>`;
  const loc = () => (lang() === 'de' ? 'de-DE' : 'en-GB');
  const nf = (n, d = 0) => Number(n).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: d });
  const eur = v => `€\u202f${nf(v)}`;
  const eurK = v => v >= 1e4 ? `€\u202f${nf(v / 1e3, v < 1e5 ? 1 : 0)}k` : eur(v);
  const tons = kg => `${nf(kg / 1000, kg % 1000 ? 1 : 0)}\u202ft`;
  const wk = w => `${L('W', 'KW')} ${((E.NOW_WK - 1 + w) % 52) + 1}`;
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const when = d => d.toLocaleString(loc(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const short = d => d.toLocaleString(loc(), { day: '2-digit', month: 'short' });
  const logo = (slug, color, cls = '') => `<span class="bfa-logo ${cls}" style="--c:${color};-webkit-mask-image:url(${BASE}logos/${slug}.svg);mask-image:url(${BASE}logos/${slug}.svg)"></span>`;
  const glyph = (name, color, cls = '') => `<span class="bfa-glyph ${cls}" style="--c:${color}">${ph(name)}</span>`;

  // ------------------------------------------------------------------ reference data
  const CUST = {
    'Rheinform Kunststofftechnik GmbH': ['RHEINFORM', 'auto', 'Köln', 'Jana Kessler', 'f'],
    'Novaform Automotive GmbH': ['NOVAFORM', 'auto', 'Ingolstadt', 'Tobias Brenner', 'm'],
    'Hanse Closures GmbH': ['HANSECLO', 'pack', 'Bremen', 'Merle Jansen', 'f', 1],
    'Folienwerk Nordheide GmbH': ['FOLIENNH', 'pack', 'Buchholz', 'Ole Petersen', 'm'],
    'Elbtal Elektrotechnik GmbH': ['ELBTAL', 'ee', 'Dresden', 'Katrin Vogt', 'f'],
    'Medplast Tuttlingen GmbH': ['MEDPLAST', 'med', 'Tuttlingen', 'Dr. Felix Haag', 'm'],
    'Sauerland Haushaltswaren GmbH': ['SAUERHH', 'home', 'Lüdenscheid', 'Ilka Schröder', 'f', 1],
    'Bodensee Präzisionsteile GmbH': ['BODENSEE', 'ind', 'Friedrichshafen', 'Marco Steiner', 'm'],
    'Weser Getränketechnik GmbH': ['WESERGT', 'pack', 'Hameln', 'Anja Wolters', 'f'],
    'Lippe Kabeltechnik GmbH': ['LIPPEKAB', 'cable', 'Detmold', 'Sven Hollmann', 'm', 1],
    'Allgäu Gartengeräte GmbH': ['ALLGAEU', 'home', 'Kempten', 'Rita Waibel', 'f'],
    'Ostsee Sanitär GmbH': ['OSTSEE', 'ind', 'Rostock', 'Jörn Lübbe', 'm'],
    'Main-Tauber Fahrzeugteile GmbH': ['MAINTAUB', 'auto', 'Wertheim', 'Heike Rösch', 'f'],
    'Harzer Steckverbinder GmbH': ['HARZSTV', 'ee', 'Goslar', 'Paul Engel', 'm', 1],
    // accounts without open demand: they only appear in the account manager's workday (outbound, relationships)
    'Spessart Möbelbeschläge GmbH': ['SPESSART', 'home', 'Aschaffenburg', 'Bernd Kraus', 'm'],
    'Vogtland Spielwaren GmbH': ['VOGTLAND', 'home', 'Plauen', 'Nina Seidel', 'f'],
    'Emsland Rohrsysteme GmbH': ['EMSLAND', 'ind', 'Meppen', 'Henrik Lammers', 'm'],
  };
  const SEG = { auto: ['Automotive', 'Automotive', '#9cc8e8'], pack: ['Packaging', 'Verpackung', '#9be0b8'], ee: ['E&E', 'E&E', '#f3c46b'], med: ['Medical', 'Medizin', '#e7a6f0'], home: ['Consumer', 'Konsumgüter', '#f2a07a'], ind: ['Industrial', 'Industrie', '#c6c9cf'], cable: ['Cable', 'Kabel', '#8fd3d0'] };
  const meta = c => { const m = CUST[c] || [c.replace(/[^A-Z]/gi, '').slice(0, 8).toUpperCase(), 'ind', 'Hamburg', '']; return { code: m[0], seg: m[1], city: m[2], contact: m[3], sal: m[4], du: !!m[5], domain: c.toLowerCase().split(' ')[0].normalize('NFD').replace(/[^a-z]/g, '') + '-demo.de' }; };
  const CH = {
    email: { name: 'Outlook', tag: 'EMAIL', icon: () => glyph('microsoft-outlook-logo', '#3b8ee0') },
    whatsapp: { name: 'WhatsApp', tag: 'WHATSAPP', icon: () => logo('whatsapp', '#25D366') },
    calls: { get name() { return L('Call', 'Anruf'); }, get tag() { return L('CALL', 'ANRUF'); }, icon: () => glyph('phone-call', 'var(--a-acc)') },
    call: { get name() { return L('Live call', 'Live-Anruf'); }, tag: 'LIVE', icon: () => glyph('microphone', 'var(--a-acc)') },
    crm: { name: 'Biesterfeld CRM', tag: 'CRM', icon: () => logo('biesterfeld', '#cb3f1d') },
    manual: { get name() { return L('Manual', 'Manuell'); }, get tag() { return L('MANUAL', 'MANUELL'); }, icon: () => glyph('pencil-simple', '#a9adb5') },
    file: { name: 'Excel', tag: 'EXCEL', icon: () => glyph('microsoft-excel-logo', '#2fa866') },
  };
  const ch = k => CH[k] || CH.manual;
  // salutation: formal contacts get "Guten Tag Frau Schröder" and Sie, first-name contacts "Hallo Ilka" and du
  const nameParts = c => { const n = meta(c).contact, dr = /^Dr\. /.test(n) ? 'Dr. ' : '', p = n.replace(/^Dr\. /, '').split(' '); return { dr, first: p[0], last: p.slice(-1)[0] }; };
  const anrede = (c, de) => { const m = meta(c), n = nameParts(c); if (!m.contact) return de ? 'Guten Tag,' : 'Good day,'; return m.du ? (de ? `Hallo ${n.first},` : `Hi ${n.first},`) : de ? `Guten Tag ${m.sal === 'm' ? 'Herr' : 'Frau'} ${n.dr}${n.last},` : `Dear ${m.sal === 'm' ? 'Mr' : 'Ms'} ${n.dr}${n.last},`; };
  const DU_V = { brauchen: 'brauchst', bestellen: 'bestellst', beziehen: 'beziehst', hatten: 'hattest', haben: 'hast', müssen: 'musst', können: 'kannst', möchten: 'möchtest', sind: 'bist', meinten: 'meintest', bräuchten: 'bräuchtest', hätten: 'hättest' };
  // second person singular of a verb: planen → planst, finden → findest, einsetzen → einsetzt
  const duVerb = v => { const k = v.toLowerCase(); if (DU_V[k]) return v[0] === v[0].toUpperCase() ? DU_V[k][0].toUpperCase() + DU_V[k].slice(1) : DU_V[k]; const st = v.replace(/e?n$/, ''); return /[dt]$/.test(st) ? `${st}est` : /[szßx]$/.test(st) ? `${st}t` : `${st}st`; };
  const duify = t => t.replace(/\b([Ff])inden Sie\b/g, (m, a) => `${a}indest du`)
    .replace(/\b(wenn|Wenn|bevor|die|dass|ob|weil|falls) Sie ([^.,;?!\n]{0,60}?) (\w+en)(?=[.,;:?!\n])/g, (m, c, mid, v) => `${c} du ${mid} ${duVerb(v)}`)
    .replace(/\b([Ss])agen Sie\b/g, (m, a) => (a === 'S' ? 'Sag' : 'sag')).replace(/\bMelden Sie sich\b/g, 'Melde dich').replace(/\bBitte bestätigen Sie\b/g, 'Bitte bestätige')
    .replace(/\b(Haben|Hätten|Brauchen|brauchen|bräuchten|meinten|bestellen|hatten|haben|können|möchten) Sie\b/g, (m, v) => `${DU_V[v.toLowerCase()].replace(/^./, x => (v[0] === v[0].toUpperCase() ? x.toUpperCase() : x))} du`)
    .replace(/\bund rufen den Rest\b/g, 'und rufst den Rest').replace(/\b(ich|rufe ich) Sie\b/g, '$1 dich').replace(/\b(für|an) Sie\b/g, '$1 dich')
    .replace(/\bSie (brauchen|bestellen|beziehen|hatten|haben|müssen|können|möchten|sind|meinten)\b/g, (m, v) => `du ${DU_V[v]}`).replace(/\bSie\b/g, 'du').replace(/\bIhnen\b/g, 'dir')
    .replace(/\bIhr(e|en|em|er|es)?\b/g, (m, e) => `dein${e || ''}`).replace(/(^|[.!?:]\s+)(du|dein\w*)\b/g, (m, p, w) => p + w[0].toUpperCase() + w.slice(1));
  // personal: the greeting matches the contact, and for first-name contacts the German text says du
  function personal(text, c) {
    if (!text || !c || !CUST[c]) return text;
    const de = lang() === 'de', m = meta(c);
    let t = text.replace(/^(?:Good (?:morning|afternoon|day|evening)|Hello|Hi|Dear|Guten (?:Tag|Morgen|Abend)|Hallo|Sehr geehrte[rs]?)\s[^\n,]*,/, anrede(c, de));
    if (m.du) { if (de) t = duify(t).replace(/Mit freundlichen Grüßen/g, 'Viele Grüße'); t = t.replace(/(Viele Grüße|Kind regards)\n(\S+) \S+/, '$1\n$2'); }
    return t;
  }
  const NOW = new Date();

  // ------------------------------------------------------------------ model (shared by every mounted instance)
  const model = { prices: {}, extra: [], status: {}, reasons: {}, autopilot: false, seen: new Set(), log: {}, docsSent: new Set(), repriced: new Set(), allotted: new Set() };
  let D = null; // derived data
  const subs = new Set();
  const emit = () => { D = derive(); subs.forEach(fn => fn()); };

  // framework call-offs need no offer: with the workday layer they become orders to create, not offers to send
  const FRAMEWORK = new Set(['Rheinform Kunststofftechnik GmbH', 'Elbtal Elektrotechnik GmbH']);
  const isCallOff = d => !!window.BFAE && d.channel === 'crm' && FRAMEWORK.has(d.customer);
  // a price question for the customer's calculation gets a scale for 1 / 3 / 5 t, not an offer
  const PRICE_ONLY = new Set(['Ostsee Sanitär GmbH', 'Allgäu Gartengeräte GmbH']), SCALE_GRADES = { 'Allgäu Gartengeräte GmbH': ['PP 7032E3'] }, TIERS = [[1, .12, .14], [3, .06, .09], [5, .02, .07]];
  const priceOnly = c => !!window.BFAE && PRICE_ONLY.has(c);
  function derive() {
    const demand = [...S.demand, ...model.extra];
    const R = E.match(demand, S.supply);
    // messages: one thread per customer and channel
    const groups = new Map();
    for (const d of R.demand) { const k = `${d.customer}|${d.channel}`; (groups.get(k) || groups.set(k, []).get(k)).push(d); }
    const msgs = [...groups.entries()].map(([k, lines]) => {
      const h = hash(k), [customer, channel] = k.split('|');
      const at = lines[0].at ? new Date(lines[0].at) : new Date(NOW - (h % 70 + 1) * 3600e3 - (h % 59) * 60e3);
      return { id: `M${1000 + h % 9000}`, key: k, customer, channel, lines, at, conf: lines[0].conf || 80 + h % 18, cat: priceOnly(customer) && channel === 'email' ? 'price' : channel === 'crm' ? (lines.some(isCallOff) || !window.BFAE ? 'calloff' : 'request') : channel === 'calls' || channel === 'call' ? 'call' : h % 4 === 0 ? 'price' : 'request' };
    }).sort((a, b) => b.at - a.at);
    // offers: one per customer with matches
    const byCust = new Map();
    for (const m of R.matches.filter(m => !isCallOff(m.d))) (byCust.get(m.d.customer) || byCust.set(m.d.customer, []).get(m.d.customer)).push(m);
    const offers = [...byCust.entries()].map(([customer, ms0]) => {
      const h = hash(customer), id = `AN-2026-${4100 + h % 800}`, pov = model.prices[id] || {};
      const ms = ms0.map(m => { const cost = m.s.price * (1 - (m.s.margin || 0)), pr = pov[m.s.grade]; return pr == null ? { ...m, list: m.s.price, cost } : { ...m, list: m.s.price, cost, s: { ...m.s, price: pr, margin: (pr - cost) / pr }, value: m.qty * pr, margin: m.qty * (pr - cost) }; });
      const cm = msgs.filter(x => x.customer === customer && x.lines.some(l => !isCallOff(l)));
      const o = { id, customer, ms, value: ms.reduce((a, m) => a + m.value, 0), margin: ms.reduce((a, m) => a + m.margin, 0), qty: ms.reduce((a, m) => a + m.qty, 0),
        conf: Math.min(...cm.map(x => x.conf)), msgs: cm, demand: R.demand.filter(d => d.customer === customer && !isCallOff(d)) };
      o.priceOnly = priceOnly(customer); o.scale = SCALE_GRADES[customer] ? SCALE_GRADES[customer].map(g => R.supply.find(x => x.grade === g)).filter(Boolean) : null;
      o.checks = o.priceOnly ? [{ s: 'pass', t: L('Price question only: scale instead of an offer, no quantity promised', 'Nur Preisanfrage: Staffel statt Angebot, keine Mengenzusage') }, { s: 'pass', t: L('Every tier above the 5 % margin floor', 'Alle Stufen über der Margen-Untergrenze von 5 %') }, { s: 'pass', t: L('Prices from the Q4 2026 price list, FCA Hamburg', 'Preise aus der Preisliste Q4 2026, FCA Hamburg') }] : checks(o);
      o.warn = o.checks.filter(c => c.s === 'warn').length;
      o.status = model.status[id] || (model.extra.some(x => x.customer === customer) || h % 5 < 3 ? 'review' : 'new');
      o.risk = o.ms.some(m => !m.onTime) ? 'late' : o.ms.some(m => m.grade === 'alt') ? 'equiv' : 'ok';
      return o;
    });
    const customers = [...new Set(R.demand.map(d => d.customer))].map(c => {
      const o = offers.find(x => x.customer === c), cm = msgs.filter(x => x.customer === c);
      return { name: c, ...meta(c), offer: o, latest: cm[0], msgs: cm, lines: o ? o.ms.length : 0, gap: R.demand.filter(d => d.customer === c).reduce((a, d) => a + d.qty - d.matched, 0) };
    });
    const byOrd = new Map();
    for (const m of R.matches.filter(m => isCallOff(m.d))) (byOrd.get(m.d.customer) || byOrd.set(m.d.customer, []).get(m.d.customer)).push(m);
    const orders = [...byOrd.entries()].map(([customer, ms]) => {
      const cm = msgs.filter(x => x.customer === customer && x.lines.some(isCallOff));
      const o = { id: `AB-2026-${5100 + hash(`${customer}|ab`) % 800}`, kind: 'order', customer, ms, value: ms.reduce((a, m) => a + m.value, 0), margin: ms.reduce((a, m) => a + m.margin, 0), qty: ms.reduce((a, m) => a + m.qty, 0),
        conf: Math.min(...cm.map(x => x.conf)), msgs: cm, demand: R.demand.filter(d => d.customer === customer && isCallOff(d)) };
      o.checks = checks(o); o.warn = o.checks.filter(c => c.s === 'warn').length; o.status = model.status[o.id] || 'review'; o.risk = o.ms.some(m => !m.onTime) ? 'late' : 'ok';
      return o;
    });
    return { R, msgs, offers, orders, customers };
  }

  function checks(o) {
    const out = [], ms = o.ms;
    if (ms.some(m => m.d.approved)) out.push({ s: 'pass', t: L('Approved grade kept, no substitute', 'Freigegebene Type beibehalten, kein Ersatz') });
    const late = ms.find(m => !m.onTime);
    out.push(late ? { s: 'warn', t: L(`${late.s.grade}: ETA ${wk(late.s.week)} is after the need date ${wk(late.d.week)}`, `${late.s.grade}: ETA ${wk(late.s.week)} liegt nach dem Bedarfstermin ${wk(late.d.week)}`) }
      : { s: 'pass', t: L('Every line arrives before the need date', 'Alle Positionen vor dem Bedarfstermin') });
    const alt = ms.find(m => m.grade === 'alt');
    if (alt) out.push({ s: 'warn', t: L(`${alt.s.grade} is an equivalent, customer release needed`, `${alt.s.grade} ist gleichwertig, Kundenfreigabe erforderlich`) });
    const mb = ms.find(m => m.colour === 1);
    if (mb) out.push({ s: 'warn', t: L(`${mb.s.grade} is natural, black via masterbatch`, `${mb.s.grade} ist naturfarben, Schwarz per Masterbatch`) });
    const pct = o.value ? o.margin / o.value * 100 : 0;
    out.push(pct >= 5 ? { s: 'pass', t: L(`Margin ${nf(pct, 1)} % above the 5 % floor`, `Marge ${nf(pct, 1)} % über der Untergrenze von 5 %`) } : { s: 'warn', t: L(`Margin ${nf(pct, 1)} % below the 5 % floor`, `Marge ${nf(pct, 1)} % unter der Untergrenze von 5 %`) });
    const need = o.demand.reduce((a, d) => a + d.qty, 0), got = o.demand.reduce((a, d) => a + d.matched, 0);
    out.push(got >= need ? { s: 'pass', t: L('Full quantity covered', 'Volle Menge gedeckt') } : { s: 'warn', t: L(`${tons(need - got)} not covered, sourcing needed`, `${tons(need - got)} nicht gedeckt, Beschaffung nötig`) });
    return out;
  }

  // public hooks: the live call and uploads add demand lines here
  document.addEventListener('bf:demand', e => {
    const { rows, origin } = e.detail;
    model.extra = model.extra.filter(r => r.origin !== origin).concat(rows.map(r => ({ ...r, origin, channel: 'call', at: Date.now(), conf: 93 })));
    emit();
    subs.forEach(fn => fn('toast', L(`${rows.length} demand line${rows.length === 1 ? '' : 's'} from the live call added`, `${rows.length} Bedarf${rows.length === 1 ? '' : 'e'} aus dem Live-Anruf übernommen`)));
  });

  // ------------------------------------------------------------------ app instance
  function createApp(root, opts = {}) {
    const st = { page: window.BFAE ? 'today' : 'cockpit', cust: null, case: null, chat: null, tab: 'customers', q: '', fCust: '', fStatus: new Set(['new', 'review', 'ready']), fSource: new Set(), fSeg: '', sort: ['date', -1],
      menu: null, drawer: null, drawerTab: 'msg', fresh: false, offer: null, push: null, compose: null, bulk: null, oTab: 'details', modal: null, tour: -1, toasts: [], collapsed: new Set(window.BFAE ? ['it'] : []), memo: null, backtest: 0, inboxTab: 'all', newForm: null };
    root.classList.add('bfa'); if (opts.mini) root.classList.add('bfa-mini');
    const go = (page, extra = {}) => { Object.assign(st, { page, menu: null, offer: null, drawer: null, chat: null, push: null, compose: null, bulk: null }, extra); render(true); };
    let AE = null; // the account manager's workday layer (ae.js), created once all helpers below exist

    // ---------------- shell
    const NAV = () => [
      // with the AE layer the app is organised around the account manager: Demand and Matching fold into the workday
      // (Calls and Demand lines are Inbox tabs, Offers and the Match cockpit open from Pipeline and Inbox), and Supply is product management's, shown in that role
      ...(AE ? [...AE.nav(), ...(AE.canAllocate() ? [['supply', L('Supply · product mgmt.', 'Angebot · Produktmgmt.'), 'package', [['stock', L('Stock', 'Lagerbestand')], ['inbound', L('Inbound', 'Zulauf')], ['allot', L('Allocation', 'Allokation')], ['prices', L('Price changes', 'Preisänderungen')], ['alloc', L('Producer allocations', 'Herstellerkontingente')]]]] : [])] : [
        ['demand', L('Demand', 'Nachfrage'), 'tray', [['inbox', L('Inbox', 'Posteingang')], ['calls', L('Calls', 'Anrufe')], ['lines', L('Demand lines', 'Bedarfe')], ['docs', L('Document requests', 'Dokumentanfragen')]]],
        ['match', 'Matching', 'arrows-merge', [['cockpit', L('Match cockpit', 'Match-Cockpit')], ['offers', L('Offers', 'Angebote')], ['prices', L('Price changes', 'Preisänderungen')], ['followup', L('Follow-ups', 'Nachfassen')]]],
        ['supply', L('Supply', 'Angebot'), 'package', [['stock', L('Stock', 'Lagerbestand')], ['inbound', L('Inbound', 'Zulauf')], ['allot', L('Allocation', 'Allokation')], ['alloc', L('Producer allocations', 'Herstellerkontingente')]]],
      ]),
      // with the AE layer the shared memory lives in the assistant ("Ask AI"), so it has no page of its own
      ...(AE ? [] : [['cc', 'Command Center', 'squares-four', [['actions', L('Open actions', 'Offene Aktionen')], ...(AE ? [] : [['memory', L('Shared memory', 'Gemeinsames Wissen')]]), ['kpis', 'KPIs']]]]),
      ['it', 'IT Control Panel', 'gear-six', [['integrations', L('Integrations', 'Integrationen')], ['entities', L('Subsidiaries', 'Gesellschaften')], ['master', L('Master data cockpit', 'Stammdaten-Cockpit')], ['settings', L('User settings', 'Benutzereinstellungen')]]],
    ];
    const TITLES = () => ({ inbox: L('Inbox', 'Posteingang'), calls: L('Calls', 'Anrufe'), lines: L('Demand lines', 'Bedarfe'), cockpit: L('AI Match cockpit', 'KI-Match-Cockpit'), offers: L('Offers', 'Angebote'),
      followup: L('Follow-ups', 'Nachfassen'), stock: L('Stock', 'Lagerbestand'), inbound: L('Inbound', 'Zulauf'), alloc: L('Producer allocations', 'Herstellerkontingente'), actions: L('Open actions', 'Offene Aktionen'),
      memory: L('Shared memory', 'Gemeinsames Wissen'), kpis: 'KPIs', integrations: L('Integrations', 'Integrationen'), docs: L('Document requests', 'Dokumentanfragen'), prices: L('Price changes', 'Preisänderungen'), allot: L('Allocation of scarce inventory', 'Allokation von knappem Inventar'), entities: L('Subsidiaries', 'Gesellschaften'), master: L('Master data cockpit', 'Stammdaten-Cockpit'), settings: L('User settings', 'Benutzereinstellungen'), ...(AE ? AE.titles() : {}) });

    const PARENT = { cockpit: 'pipeline', offers: 'pipeline', followup: 'pipeline', calls: 'inbox', lines: 'inbox', docs: 'service' };
    const navOn = p => st.page === p || (AE && PARENT[st.page] === p);
    function sidebar() {
      return `<aside class="bfa-side">
        <div class="bfa-brand"><img src="${BASE}logos/biesterfeld.svg" alt=""><span>Biesterfeld <b>Plastic</b></span></div>
        <nav class="bfa-nav">${NAV().map(([id, label, icon, items]) => `
          <div class="bfa-grp ${st.collapsed.has(id) ? 'shut' : ''}">
            <button class="bfa-grp-h" data-act="grp" data-id="${id}">${ph(icon)}<span>${label}</span>${ph('caret-up', 'car')}</button>
            <div class="bfa-grp-i">${items.map(([p, l]) => `<button class="bfa-item ${navOn(p) ? 'on' : ''}" data-act="nav" data-id="${p}">${l}${p === 'actions' ? `<em>${openActions().length}</em>` : AE?.count(p) ? `<em>${AE.count(p)}</em>` : ''}</button>`).join('')}</div>
          </div>`).join('')}</nav>
        <button class="bfa-fb" data-act="toast" data-msg="${esc(L('Thanks, feedback noted.', 'Danke, Feedback notiert.'))}">${ph('paper-plane-tilt')}<span>${L('Send feedback', 'Feedback senden')}</span></button>
        ${AE ? AE.user() : `<div class="bfa-user"><span class="av">LH</span><span><b>Lena Hoffmann</b><small>${L('Sales · Engineering Plastics', 'Vertrieb · Technische Kunststoffe')}</small></span>${ph('caret-down')}</div>`}
      </aside>`;
    }
    function header() {
      const crumbs = !st.offer && AE?.crumbs() || (st.offer ? `<span class="bfa-crumbs">${AE ? 'Inbound' : 'Matching'} ${ph('caret-right')} ${AE ? esc(AE.pqOf([...D.offers, ...D.orders].find(x => x.id === st.offer) || {})) : L('Offers', 'Angebote')} ${ph('caret-right')} <b>${st.offer}${[...D.offers, ...D.orders].find(x => x.id === st.offer)?.status === 'sent' ? '' : ` (${L('Draft', 'Entwurf')})`}</b></span>` : `<h3>${TITLES()[st.page]}</h3>`);
      return `<header class="bfa-top">
        <button class="bfa-ic" data-act="toast" data-msg="${esc(L('Sidebar pinned', 'Seitenleiste fixiert'))}" aria-label="Sidebar">${ph('sidebar-simple')}</button>${crumbs}
        <div class="bfa-top-r">
          <button class="bfa-sel" data-act="menu" data-id="region">${L('Germany', 'Deutschland')} <small>Hamburg</small>${ph('caret-down')}</button>
          <button class="bfa-sel" data-act="menu" data-id="lang">${lang().toUpperCase()}${ph('caret-down')}</button>
          <button class="bfa-sel" data-act="tour">${ph('question')}${L('Start tour', 'Tour starten')}</button>
          <button class="bfa-ic" data-act="refresh" aria-label="Refresh">${ph('arrows-clockwise')}</button>
          <button class="bfa-ic" data-act="toast" data-msg="${esc(L('Feedback mode on: click any element.', 'Feedback-Modus aktiviert: Klicken Sie auf ein beliebiges Element.'))}" aria-label="Feedback">${ph('megaphone-simple')}</button>
          <button class="bfa-ic bell" data-act="nav" data-id="actions" aria-label="Notifications">${ph('bell')}<i></i></button>
        </div>
        ${menuHtml('region', [['de', `${L('Germany', 'Deutschland')} · Hamburg`], ['nl', `${L('Netherlands', 'Niederlande')} · Rotterdam`], ['pl', `${L('Poland', 'Polen')} · Warschau`]], 'region')}
        ${menuHtml('lang', [['de', 'Deutsch'], ['en', 'English']], 'setlang')}
      </header>`;
    }
    const menuHtml = (id, items, act, sel = []) => st.menu === id ? `<div class="bfa-menu" data-menu="${id}">${items.map(([v, l, extra]) => `<button data-act="${act}" data-v="${esc(v)}" class="${sel.includes(v) ? 'on' : ''}">${sel.length || act === 'fsrc' || act === 'fstatus' ? `<span class="cb">${sel.includes(v) ? ph('check') : ''}</span>` : ''}${extra || ''}<span>${esc(l)}</span></button>`).join('')}</div>` : '';

    // ---------------- shared bits
    const chip = (cls, txt, icon = '') => `<span class="bfa-chip ${cls}">${icon}${esc(txt)}</span>`;
    const STATUS = () => ({ new: [L('New', 'Neu'), 'c-new'], review: [L('Pending review', 'Prüfen'), 'c-review'], ready: [L('Ready to send', 'Versandbereit'), 'c-ready'], sent: [L('Sent', 'Gesendet'), 'c-sent'], rejected: [L('Rejected', 'Abgelehnt'), 'c-rej'] });
    const statusChip = s => chip(STATUS()[s][1], STATUS()[s][0]);
    const CAT = () => ({ request: L('Offer request', 'Angebotsanfrage'), calloff: L('Call-off', 'Abruf'), price: L('Price inquiry', 'Preisanfrage'), call: L('Call', 'Anruf') });
    const conf = c => `<span class="bfa-conf ${c >= 90 ? 'hi' : c >= 85 ? 'mid' : 'lo'}"><i></i>${c}%</span>`;
    const chTag = k => `<span class="bfa-chtag">${ch(k).icon()}${ch(k).tag}</span>`;
    const segChip = s => `<span class="bfa-seg" style="--c:${SEG[s][2]}"><i></i>${lang() === 'de' ? SEG[s][1] : SEG[s][0]}</span>`;
    const tiles = list => `<div class="bfa-tiles" data-tour="tiles">${list.map(([n, l, sub]) => `<div class="bfa-tile"><b>${n}</b><span>${l}</span>${sub ? `<em>${sub}</em>` : ''}</div>`).join('')}</div>`;
    const th = (k, label, sortable = true) => `<th${sortable ? ` data-act="sort" data-id="${k}" class="sortable ${st.sort[0] === k ? (st.sort[1] > 0 ? 'asc' : 'desc') : ''}"` : ''}>${label}${sortable ? ph('caret-up-down', 'srt') : ''}</th>`;
    const pager = n => `<div class="bfa-pager"><span>${L('Rows per page', 'Zeilen pro Seite')}</span><button class="bfa-sel sm" data-act="toast" data-msg="25">25${ph('caret-down')}</button><span class="sp"></span><span class="cnt">${nf(n)} ${L('rows', 'Zeilen')}</span><button class="bfa-pg" disabled>${ph('caret-left')}${L('Previous', 'Zurück')}</button><button class="bfa-pg on">1</button><button class="bfa-pg" disabled>${L('Next', 'Weiter')}${ph('caret-right')}</button></div>`;
    const sortBy = (rows, map) => { const [k, dir] = st.sort, f = map[k]; return f ? [...rows].sort((a, b) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; }) : rows; };
    const search = (q, ...fields) => !q || fields.some(f => String(f ?? '').toLowerCase().includes(q.toLowerCase()));
    const empty = (icon, t1, t2) => `<div class="bfa-empty">${ph(icon)}<b>${t1}</b><span>${t2}</span></div>`;

    function filters(placeholder, extra = '') {
      const cust = D.customers.map(c => [c.name, c.name.replace(/ GmbH.*/, '')]);
      const src = Object.keys(CH).filter(k => D.msgs.some(m => m.channel === k)).map(k => [k, ch(k).name, ch(k).icon()]);
      const status = Object.entries(STATUS()).map(([k, v]) => [k, v[0]]);
      return `<div class="bfa-filters" data-tour="filters">
        <label class="bfa-search">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(placeholder)}"></label>
        <div class="bfa-dd"><button class="bfa-sel ${st.fCust ? 'act' : ''}" data-act="menu" data-id="fcust">${st.fCust ? `${L('Customer', 'Kunde')} · ${esc(st.fCust.replace(/ GmbH.*/, ''))}<span class="n">1</span>` : L('Customer', 'Kunde')}${ph('caret-down')}</button>${menuHtml('fcust', [['', L('All customers', 'Alle Kunden')], ...cust], 'fcust', [st.fCust])}</div>
        <div class="bfa-dd"><button class="bfa-sel ${st.fStatus.size ? 'act' : ''}" data-act="menu" data-id="fstatus">Status${st.fStatus.size ? ` · ${st.fStatus.size}<span class="n">${st.fStatus.size}</span>` : ''}${ph('caret-down')}</button>${menuHtml('fstatus', status, 'fstatus', [...st.fStatus])}</div>
        <div class="bfa-dd"><button class="bfa-sel ${st.fSource.size ? 'act' : ''}" data-act="menu" data-id="fsrc">${L('Demand source', 'Bedarfsquelle')}${st.fSource.size ? `<span class="n">${st.fSource.size}</span>` : ''}${ph('caret-down')}</button>${menuHtml('fsrc', src, 'fsrc', [...st.fSource])}</div>
        <div class="bfa-dd"><button class="bfa-sel ${st.fSeg ? 'act' : ''}" data-act="menu" data-id="fseg">${L('More filters', 'Weitere Filter')}${st.fSeg ? '<span class="n">1</span>' : ''}${ph('caret-down')}</button>${menuHtml('fseg', [['', L('All segments', 'Alle Segmente')], ...Object.keys(SEG).map(k => [k, lang() === 'de' ? SEG[k][1] : SEG[k][0]])], 'fseg', [st.fSeg])}</div>
        ${extra}
      </div>`;
    }
    const passCust = c => (!st.fCust || c.name === st.fCust) && (!st.fSeg || c.seg === st.fSeg) && (!st.fSource.size || c.msgs.some(m => st.fSource.has(m.channel)))
      && (!st.fStatus.size || !c.offer || st.fStatus.has(c.offer.status));

    // ---------------- pages
    function cockpit() {
      const offers = D.offers, review = offers.filter(o => o.status === 'review' || o.status === 'ready').length, sent = offers.filter(o => o.status === 'sent').length;
      const tabs = [['customers', L('All customers', 'Alle Kunden'), D.customers.length], ['mlines', L('All match lines', 'Alle Match-Positionen'), D.R.matches.length], ['msgs', L('Messages', 'Nachrichten'), D.msgs.length]];
      const ready = offers.filter(o => o.status === 'ready').length;
      let body = '';
      if (st.tab === 'customers') body = customersTable();
      else if (st.tab === 'mlines') body = matchLinesTable();
      else body = messagesTable(D.msgs);
      return `<div class="bfa-tabsbar">
          <div class="bfa-tabs" data-tour="tabs">${tabs.map(([k, l, n]) => `<button class="${st.tab === k ? 'on' : ''}" data-act="tab" data-id="${k}">${l}<em>${n}</em></button>`).join('')}</div>
          <div class="bfa-tabs-r">
            ${ready ? `<button class="bfa-btn ghost sm" data-act="sendready">${ph('paper-plane-tilt')}${L(`Review & send ${ready}`, `${ready} prüfen & senden`)}</button>` : ''}
            <label class="bfa-ap" data-tour="autopilot">${ph('sparkle')}<span>AutoPilot</span><button class="bfa-switch ${model.autopilot ? 'on' : ''}" role="switch" aria-checked="${model.autopilot}" data-act="autopilot"><i></i></button></label>
            <button class="bfa-btn primary" data-act="newoffer" data-tour="new">${ph('plus')}${L('New offer', 'Neues Angebot')}</button>
          </div>
        </div>
        ${model.autopilot ? `<div class="bfa-banner">${ph('sparkle')}<span>${L('AutoPilot is reading every message, matching stock and drafting offers. You approve what goes out.', 'AutoPilot liest jede Nachricht, gleicht den Bestand ab und entwirft Angebote. Was rausgeht, geben Sie frei.')}</span></div>` : ''}
        ${tiles([[D.customers.length, L('Customers', 'Kunden')], [offers.filter(o => o.status !== 'new').length, L('Offers drafted', 'Angebote entworfen')], [review, L('Offers pending review', 'Angebote zur Prüfung')], [sent, L('Offers sent to customer', 'An Kunden gesendet')]])}
        ${filters(L('Search by customer, grade, demand ref', 'Suche nach Kunde, Type, Bedarfsreferenz'))}
        ${body}`;
    }

    function customersTable() {
      let rows = D.customers.filter(c => passCust(c) && search(st.q, c.name, c.code, ...c.msgs.flatMap(m => m.lines.map(l => `${l.material} ${l.grade}`))));
      rows = sortBy(rows, { name: c => c.name, seg: c => c.seg, date: c => c.latest?.at || 0, value: c => c.offer?.value || 0, lines: c => c.lines, cat: c => c.latest?.cat });
      if (!rows.length) return `<div class="bfa-card">${empty('funnel-simple', L('No customers match these filters', 'Keine Kunden passen zu diesen Filtern'), L('Clear a filter to see more.', 'Entfernen Sie einen Filter, um mehr zu sehen.'))}</div>`;
      return `<div class="bfa-card bfa-tablewrap"><table class="bfa-table">
        <thead><tr class="grp-row"><th colspan="2"></th><th colspan="3" class="grp">${L('LATEST INBOUND', 'LETZTER EINGANG')}</th><th colspan="4" class="grp">${L('OFFER', 'ANGEBOT')}</th><th></th></tr>
        <tr>${th('name', L('CUSTOMER', 'KUNDE'))}${th('seg', 'SEGMENT')}${th('subj', L('SUBJECT', 'BETREFF'), false)}${th('date', L('DATE', 'DATUM'))}${th('cat', L('CATEGORY', 'KATEGORIE'))}${th('value', L('OFFER VALUE', 'ANGEBOTSWERT'))}${th('lines', L('LINES', 'POS.'))}${th('pending', L('PENDING', 'OFFEN'), false)}${th('sent', L('SENT', 'GESENDET'), false)}<th>${L('NEXT ACTION', 'NÄCHSTE AKTION')}</th></tr></thead>
        <tbody>${rows.map((c, i) => {
          const o = c.offer, m = c.latest, pend = o && ['review', 'ready', 'new'].includes(o.status) ? o.ms.length : 0, sent = o && o.status === 'sent' ? o.ms.length : 0;
          const act = !o ? `<button class="bfa-btn sm" data-act="nav" data-id="actions">${L('Source gap', 'Inventar zu beschaffen')}</button>`
            : o.status === 'new' ? `<button class="bfa-btn sm accent" data-act="draft" data-id="${o.id}">${ph('sparkle')}${L('Draft offer', 'Angebot entwerfen')}</button>`
            : o.status === 'sent' ? `<button class="bfa-btn sm" data-act="offer" data-id="${o.id}">${ph('check')}${'View'}</button>`
            : `<button class="bfa-btn sm" data-act="lines" data-id="${esc(c.name)}">${'View'}</button>`;
          return `<tr style="--i:${i}" class="${o && model.autopilot && o.status === 'new' ? 'ap-busy' : ''}">
            <td><b class="cname">${esc(c.name)}</b><small class="code">${c.code}<a data-act="lines" data-id="${esc(c.name)}">${L('Open items', 'Offene Posten')}</a></small></td>
            <td>${segChip(c.seg)}</td>
            <td class="subj"><button class="lnk" data-act="msg" data-id="${m.id}">${esc(subject(m))}</button>${chTag(m.channel)}</td>
            <td class="nowrap">${when(m.at)}</td>
            <td>${chip('c-cat', CAT()[m.cat])}</td>
            <td class="num">${o ? eur(o.value) : '-'}</td>
            <td class="num">${String(c.lines).padStart(2, '0')}</td>
            <td class="num">${String(pend).padStart(2, '0')}</td>
            <td class="num">${String(sent).padStart(2, '0')}</td>
            <td>${act}</td></tr>`;
        }).join('')}</tbody></table></div>${pager(rows.length)}`;
    }

    function matchLinesTable(onlyCustomer) {
      let rows = D.R.matches.filter(m => (!onlyCustomer || m.d.customer === onlyCustomer) && (onlyCustomer || passCust(D.customers.find(c => c.name === m.d.customer))) && search(st.q, m.d.customer, m.s.grade, m.d.material, m.s.producer));
      rows = sortBy(rows, { name: m => m.d.customer, date: m => m.d.week, value: m => m.value, conf: m => offerOf(m).conf, grade: m => m.s.grade, qty: m => m.qty });
      if (!rows.length) return `<div class="bfa-card">${empty('funnel-simple', L('No match lines', 'Keine Match-Positionen'), L('Clear a filter to see more.', 'Entfernen Sie einen Filter, um mehr zu sehen.'))}</div>`;
      return `<div class="bfa-card bfa-tablewrap wide"><table class="bfa-table">
        <thead><tr><th class="cbx"><span class="cb"></span></th>${th('id', L('OFFER ID', 'ANGEBOTS-NR.'), false)}${th('name', L('CUSTOMER', 'KUNDE'))}${th('by', L('DRAFTED BY', 'ENTWURF VON'), false)}${th('risk', L('RISK', 'RISIKO'), false)}${th('conf', L('AI CONFIDENCE', 'KI-KONFIDENZ'))}${th('st', 'STATUS', false)}${th('grade', 'TYPE')}${th('prod', L('PRODUCER', 'HERSTELLER'), false)}${th('mat', L('MATERIAL', 'WERKSTOFF'), false)}${th('qty', L('QUANTITY', 'MENGE'))}${th('price', L('UNIT PRICE', 'PREIS/KG'), false)}${th('value', L('LINE VALUE', 'POS.-WERT'))}${th('mg', L('MARGIN', 'MARGE'), false)}${th('date', L('NEEDED', 'BEDARF'))}${th('src', L('SOURCE LOT', 'QUELLE'), false)}${th('ds', L('DEMAND SOURCE', 'BEDARFSQUELLE'), false)}<th>${L('VIEW', 'ANSEHEN')}</th></tr></thead>
        <tbody>${rows.map((m, i) => { const o = offerOf(m); return `<tr style="--i:${i}">
          <td class="cbx"><span class="cb"></span></td><td class="mono">${o.id}</td><td><b class="cname">${esc(m.d.customer.replace(/ GmbH.*/, ''))}</b></td>
          <td>${chip('c-ai', 'AI', ph('sparkle'))}</td>
          <td>${!m.onTime ? chip('c-warn', L('Late', 'Spät')) : m.grade === 'alt' ? chip('c-warn', L('Equivalent', 'Gleichwertig')) : chip('c-ok', L('On track', 'Im Plan'))}</td>
          <td>${conf(o.conf)}</td><td>${statusChip(o.status)}</td>
          <td><b>${esc(m.s.grade)}</b></td><td>${esc(m.s.producer)}</td><td class="mono sm">${esc(m.s.material)}</td>
          <td class="num">${tons(m.qty)}</td><td class="num">${nf(m.s.price, 2)}\u202f€</td><td class="num">${eur(m.value)}</td><td class="num mg">${eur(m.margin)}</td>
          <td class="nowrap">${wk(m.d.week)}</td><td class="nowrap">${m.s.week ? `ETA ${wk(m.s.week)}` : L('Stock HH', 'Lager HH')}</td><td>${chTag(m.d.channel)}</td>
          <td><button class="bfa-btn sm" data-act="offer" data-id="${o.id}">${'View'}</button></td></tr>`; }).join('')}</tbody></table></div>${pager(rows.length)}`;
    }
    const offerOf = m => D.offers.find(o => o.customer === m.d.customer);

    const subject = m => {
      const l = m.lines[0], more = m.lines.length > 1 ? ` +${m.lines.length - 1}` : '';
      if (m.channel === 'calls' || m.channel === 'call') return `${L('Call', 'Anruf')} · ${tons(l.qty)} ${l.material}${more}`;
      if (m.channel === 'whatsapp') return `WhatsApp · ${meta(m.customer).contact.split(' ').slice(-1)[0] || m.customer}: ${tons(l.qty)} ${l.material.split(' ')[0]}${more}`;
      if (m.channel === 'crm') return m.lines.some(isCallOff) || !window.BFAE ? `${L('Call-off framework', 'Abruf Rahmenvertrag')} · ${tons(l.qty)} ${l.grade || l.material}${more}` : `${L('CRM entry', 'CRM-Eintrag')} · ${tons(l.qty)} ${l.grade || l.material}${more}`;
      if (priceOnly(m.customer) && m.channel === 'email') return `${L('Price inquiry', 'Preisanfrage')}: ${[...new Set(m.lines.map(x => x.grade || x.material))].join(', ')} · 1 / 3 / 5 t`;
      return `${m.cat === 'price' ? L('Price inquiry', 'Preisanfrage') : L('Request', 'Anfrage')}: ${tons(l.qty)} ${l.material}${l.grade ? ` (${l.grade})` : ''}${more}`;
    };
    const preview = m => m.lines.map(l => `${tons(l.qty)} ${l.material}${l.grade ? `, ${l.grade}` : ''} ${L('by', 'bis')} ${wk(l.week)}`).join(' · ');
    const body = m => {
      const c = meta(m.customer), first = (c.contact || '').split(' ').slice(-1)[0];
      const lines = m.lines.map(l => `- ${tons(l.qty)} ${l.material}${l.grade ? ` (${l.grade}${l.approved ? L(', approved grade only', ', nur freigegebene Type') : l.alternatives ? L(', equivalent OK', ', gleichwertig OK') : ''})` : ''}, ${L('needed', 'Bedarf')} ${wk(l.week)}`).join('\n');
      if (priceOnly(m.customer) && m.channel === 'email') return L(`Hello Ms Hoffmann,\n\nwhat do ${m.lines.map(x => x.grade || x.material).join(' and ')} cost with you at the moment, as a scale for 1, 3 and 5 t? Just for our calculation, no order yet.\n\n${c.contact}`, `Hallo Frau Hoffmann,\n\nwas kosten ${m.lines.map(x => x.grade || x.material).join(' und ')} aktuell bei Ihnen, gestaffelt nach 1, 3 und 5 t? Nur für unsere Kalkulation, noch kein Auftrag.\n\n${c.contact}`);
      if (m.channel === 'whatsapp') return c.du || !window.BFAE ? L(`Hi Lena, quick one: we need\n${lines}\nCan you do that? Price per kg please.`, `Hallo Lena, kurze Frage: wir brauchen\n${lines}\nGeht das? Bitte mit Preis pro kg.`) : L(`Good day Ms Hoffmann, a quick one: we need\n${lines}\nIs that possible? Price per kg, please.`, `Guten Tag Frau Hoffmann, kurze Frage: wir brauchen\n${lines}\nGeht das? Bitte mit Preis pro kg.`);
      if (m.channel === 'calls' || m.channel === 'call') return L(`Call with ${c.contact || m.customer}, 4:12 min. The customer asked for:\n${lines}`, `Telefonat mit ${c.contact || m.customer}, 4:12 Min. Der Kunde fragt an:\n${lines}`);
      if (m.channel === 'crm') return m.lines.some(isCallOff) || !window.BFAE ? L(`Call-off against the framework agreement, released in Biesterfeld CRM:\n${lines}`, `Abruf aus dem Rahmenvertrag, freigegeben im Biesterfeld CRM:\n${lines}`) : L(`Entered in Biesterfeld CRM by field sales after a customer visit. The customer asks for:\n${lines}`, `Vom Außendienst nach einem Kundenbesuch im Biesterfeld CRM erfasst. Der Kunde fragt an:\n${lines}`);
      if (c.du && window.BFAE) return L(`Hi Lena,\n\ncan you send me an offer for:\n${lines}\n\nDelivery to our plant in ${c.city}, as usual. Thanks!\n\nBest\n${nameParts(m.customer).first}`, `Hallo Lena,\n\nkannst du mir ein Angebot schicken für:\n${lines}\n\nLieferung wie immer an unser Werk in ${c.city}. Danke dir!\n\nViele Grüße\n${nameParts(m.customer).first}`);
      return L(`Dear Ms Hoffmann,\n\nplease send us an offer for:\n${lines}\n\nDelivery to our plant in ${c.city}. Thank you.\n\nKind regards\n${c.contact}`, `Sehr geehrte Frau Hoffmann,\n\nbitte senden Sie uns ein Angebot für:\n${lines}\n\nLieferung an unser Werk in ${c.city}. Vielen Dank.\n\nMit freundlichen Grüßen\n${c.contact}`);
    };

    function messagesTable(list) {
      let rows = list.filter(m => (!st.fCust || m.customer === st.fCust) && (!st.fSource.size || st.fSource.has(m.channel)) && search(st.q, m.customer, subject(m), preview(m)));
      if (st.page === 'inbox' && ['open', 'done', 'drafts'].includes(st.inboxTab)) rows = rows.filter(m => st.inboxTab === 'open' ? !model.seen.has(m.id) : st.inboxTab === 'done' ? model.seen.has(m.id) : false);
      rows = sortBy(rows, { date: m => m.at, conf: m => m.conf, name: m => m.customer, cat: m => m.cat });
      if (!rows.length) return `<div class="bfa-card">${empty('tray', L('Nothing here', 'Hier ist nichts'), L('New messages appear as soon as they arrive.', 'Neue Nachrichten erscheinen, sobald sie eingehen.'))}</div>`;
      return `<div class="bfa-card bfa-tablewrap"><table class="bfa-table">
        <thead><tr>${th('subj', L('MESSAGE', 'NACHRICHT'), false)}${th('name', L('CUSTOMER', 'KUNDE'))}${th('date', L('LATEST', 'ZULETZT'))}${th('cat', AE ? L('INTENT', 'ABSICHT') : L('CATEGORY', 'KATEGORIE'))}${th('st', 'STATUS', false)}${th('conf', L('AI CONFIDENCE', 'KI-KONFIDENZ'))}<th>${L('ACTIONS', 'AKTIONEN')}</th></tr></thead>
        <tbody>${st.page === 'inbox' && st.inboxTab === 'all' && AE ? AE.inboxRows(st.q) : ''}${rows.map((m, i) => { const o = D.offers.find(x => x.customer === m.customer); return `<tr style="--i:${i}" class="${model.seen.has(m.id) ? '' : 'unread'}">
          <td class="msgcell">${ch(m.channel).icon()}<span><b>${esc(subject(m))}</b><small>${esc(preview(m))}</small></span></td>
          <td>${esc(m.customer.replace(/ GmbH.*/, ''))}</td><td class="nowrap">${when(m.at)}</td><td>${AE ? AE.intents(m) : chip('c-cat', CAT()[m.cat])}</td>
          <td>${o ? statusChip(o.status) : chip('c-warn', L('Gap', 'Lücke'))}</td><td>${conf(m.conf)}</td>
          <td><button class="bfa-btn sm" data-act="msg" data-id="${m.id}">${'View'}</button></td></tr>`; }).join('')}</tbody></table></div>${pager(rows.length)}`;
    }

    function inbox() {
      const tabs = [['all', L('Messages', 'Nachrichten'), D.msgs.length], ['open', L('Unread', 'Ungelesen'), D.msgs.filter(m => !model.seen.has(m.id)).length], ['done', L('Read', 'Gelesen'), D.msgs.filter(m => model.seen.has(m.id)).length], ['drafts', L('Drafts', 'Entwürfe'), 0],
        ...(AE ? [['calls', L('Calls', 'Anrufe'), D.msgs.filter(m => m.channel === 'calls' || m.channel === 'call').length], ['lines', L('Demand lines', 'Bedarfe'), D.R.demand.length]] : [])];
      const bar = `<div class="bfa-tabsbar"><div class="bfa-tabs">${tabs.map(([k, l, n]) => `<button class="${st.inboxTab === k ? 'on' : ''}" data-act="itab" data-id="${k}">${l}<em>${n}</em></button>`).join('')}</div>
        <div class="bfa-tabs-r">${AE ? `<button class="bfa-btn sm accent" data-act="nav" data-id="cockpit">${ph('arrows-merge')}${L('Match cockpit', 'Match-Cockpit')}</button>` : ''}<label class="bfa-ap">${ph('sparkle')}<span>AutoPilot</span><button class="bfa-switch ${model.autopilot ? 'on' : ''}" role="switch" aria-checked="${model.autopilot}" data-act="autopilot"><i></i></button></label></div></div>`;
      if (st.inboxTab === 'calls') return bar + calls();
      if (st.inboxTab === 'lines') return bar + demandLines();
      return `${bar}
        ${tiles([[D.msgs.length + (AE?.noOfferCount() || 0), L('Messages', 'Nachrichten')], [D.msgs.reduce((a, m) => a + m.lines.length, 0), L('Demand lines extracted', 'Bedarfe extrahiert')], AE ? [AE.noOfferCount(), L('Answered without an offer', 'Ohne Angebot beantwortet'), L('documents, delivery, technical', 'Dokumente, Lieferung, Technik')] : [nf(D.msgs.reduce((a, m) => a + m.conf, 0) / D.msgs.length, 0) + '\u202f%', L('Avg. AI confidence', 'Ø KI-Konfidenz')], [D.msgs.filter(m => m.conf < 85).length, L('Below 85 %, check', 'Unter 85 %, prüfen')]])}
        ${filters(L('Search messages', 'Nachrichten durchsuchen'))}${messagesTable(D.msgs)}`;
    }

    function calls() {
      const list = D.msgs.filter(m => m.channel === 'calls' || m.channel === 'call');
      return `<div class="bfa-hero-card">
          <div class="bfa-wave">${'<i></i>'.repeat(36)}</div>
          <div><h4>${L('Record a customer call', 'Kundengespräch aufnehmen')}</h4><p>${L('Speech becomes text while you talk. Materials, quantities and dates turn into demand lines on their own.', 'Gesprochenes wird live zu Text. Werkstoffe, Mengen und Termine werden automatisch zu Bedarfen.')}</p></div>
          <button class="bfa-btn primary" data-act="livecall">${ph('microphone')}${L('Start live call', 'Live-Anruf starten')}</button>
        </div>
        ${tiles([[list.length, L('Calls this week', 'Anrufe diese Woche')], [list.reduce((a, m) => a + m.lines.length, 0), L('Demand lines from calls', 'Bedarfe aus Anrufen')], ['4:12', L('Avg. call length', 'Ø Gesprächsdauer'), L('demo value', 'Demo-Wert')], ['0', L('Lines typed by hand', 'Von Hand erfasst')]])}
        ${messagesTable(list)}`;
    }

    function demandLines() {
      let rows = D.R.demand.filter(d => search(st.q, d.customer, d.material, d.grade) && (!st.fCust || d.customer === st.fCust) && (!st.fSource.size || st.fSource.has(d.channel)));
      rows = sortBy(rows, { name: d => d.customer, date: d => d.week, qty: d => d.qty, cov: d => d.matched / d.qty });
      const tot = D.R.demand.reduce((a, d) => a + d.qty, 0), cov = D.R.demand.reduce((a, d) => a + d.matched, 0);
      return `${tiles([[D.R.demand.length, L('Open demand lines', 'Offene Bedarfe')], [tons(tot), L('Requested', 'Angefragt')], [nf(cov / tot * 100) + '\u202f%', L('Covered by stock or inbound', 'Gedeckt aus Lager oder Zulauf')], [D.R.demand.filter(d => d.approved).length, L('Approved-grade lines', 'Positionen mit Typenfreigabe')]])}
        ${filters(L('Search by customer or material', 'Suche nach Kunde oder Werkstoff'))}
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr>${th('name', L('CUSTOMER', 'KUNDE'))}${th('mat', L('MATERIAL', 'WERKSTOFF'), false)}${th('grade', L('GRADE WANTED', 'GEWÜNSCHTE TYPE'), false)}${th('qty', L('QUANTITY', 'MENGE'))}${th('date', L('NEEDED', 'BEDARF'))}${th('rule', L('RULE', 'REGEL'), false)}${th('cov', L('COVERED', 'GEDECKT'))}${th('ds', L('SOURCE', 'QUELLE'), false)}</tr></thead>
        <tbody>${rows.map((d, i) => { const p = d.matched / d.qty; return `<tr style="--i:${i}"><td><b class="cname">${esc(d.customer.replace(/ GmbH.*/, ''))}</b></td><td class="mono sm">${esc(d.material)}</td><td>${esc(d.grade || '-')}</td><td class="num">${tons(d.qty)}</td><td>${wk(d.week)}</td>
          <td>${d.approved ? chip('c-lock', L('Approved only', 'Nur Freigabe'), ph('lock-simple')) : d.alternatives ? chip('c-ok', L('Equivalent OK', 'Gleichwertig OK')) : chip('c-cat', L('Named grade', 'Genannte Type'))}${d.never ? chip('c-rej', `${L('not', 'nicht')} ${d.never}`) : ''}</td>
          <td><span class="bfa-bar"><i style="width:${Math.round(p * 100)}%" class="${p >= 1 ? 'full' : p > 0 ? 'part' : ''}"></i></span><small class="pct">${nf(p * 100)}%</small></td><td>${chTag(d.channel)}</td></tr>`; }).join('')}</tbody></table></div>${pager(rows.length)}`;
    }

    function offersPage() {
      let rows = D.offers.filter(o => (!st.fStatus.size || st.fStatus.has(o.status)) && search(st.q, o.customer, o.id));
      rows = sortBy(rows, { name: o => o.customer, value: o => o.value, conf: o => o.conf, date: o => o.msgs[0]?.at || 0 });
      return `${tiles([[D.offers.length, L('Offers', 'Angebote')], [eurK(D.offers.reduce((a, o) => a + o.value, 0)), L('Offer value', 'Angebotswert')], [eurK(D.offers.reduce((a, o) => a + o.margin, 0)), L('Margin in offers', 'Marge in Angeboten')], [D.offers.filter(o => o.warn).length, L('With warnings', 'Mit Warnungen')]])}
        ${filters(L('Search by offer or customer', 'Suche nach Angebot oder Kunde'))}
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr>${th('id', L('OFFER', 'ANGEBOT'), false)}${th('name', L('CUSTOMER', 'KUNDE'))}${th('st', 'STATUS', false)}${th('conf', L('AI CONFIDENCE', 'KI-KONFIDENZ'))}${th('chk', L('PRE-SEND CHECKS', 'PRÜFUNGEN'), false)}${th('lines', L('LINES', 'POS.'), false)}${th('value', L('VALUE', 'WERT'))}${th('mg', L('MARGIN', 'MARGE'), false)}<th></th></tr></thead>
        <tbody>${rows.map((o, i) => `<tr style="--i:${i}"><td class="mono">${o.id}</td><td><b class="cname">${esc(o.customer.replace(/ GmbH.*/, ''))}</b></td><td>${statusChip(o.status)}</td><td>${conf(o.conf)}</td>
          <td><span class="bfa-checks"><b class="p">${o.checks.length - o.warn} ${L('pass', 'ok')}</b><b class="w">${o.warn} ${L('warn', 'Warnung')}</b></span></td><td class="num">${o.ms.length}</td><td class="num">${eur(o.value)}</td><td class="num mg">${eur(o.margin)}</td>
          <td><button class="bfa-btn sm" data-act="offer" data-id="${o.id}">${'View'}</button></td></tr>`).join('')}</tbody></table></div>${pager(rows.length)}`;
    }

    function followups() {
      const sent = D.offers.filter(o => o.status === 'sent');
      return `${tiles([[sent.length, L('Offers sent', 'Gesendete Angebote')], [sent.length, L('Awaiting reply', 'Warten auf Antwort')], ['0', L('Overdue', 'Überfällig')], ['2', L('Days until first reminder', 'Tage bis zur ersten Erinnerung')]])}
        ${sent.length ? `<div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>${L('OFFER', 'ANGEBOT')}</th><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('SENT', 'GESENDET')}</th><th>${L('NEXT STEP', 'NÄCHSTER SCHRITT')}</th><th></th></tr></thead><tbody>
          ${sent.map((o, i) => `<tr style="--i:${i}"><td class="mono">${o.id}</td><td><b class="cname">${esc(o.customer)}</b></td><td>${L('today', 'heute')}</td><td>${L('AI drafts a reminder in 2 days if there is no reply', 'Die KI entwirft nach 2 Tagen eine Erinnerung, falls keine Antwort kommt')}</td><td><button class="bfa-btn sm" data-act="offer" data-id="${o.id}">${'View'}</button></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="bfa-card">${empty('paper-plane-tilt', L('No offers sent yet', 'Noch keine Angebote gesendet'), L('Approve an offer in the Match cockpit and it shows up here.', 'Geben Sie im Match-Cockpit ein Angebot frei, dann erscheint es hier.'))}<div class="bfa-empty-act"><button class="bfa-btn" data-act="nav" data-id="cockpit">${L('Go to Match cockpit', 'Zum Match-Cockpit')}</button></div></div>`}`;
    }

    function stockPage(inbound) {
      const used = new Map(); for (const m of D.R.matches) used.set(m.s, (used.get(m.s) || 0) + m.qty);
      const lots = D.R.supply.filter(s => inbound ? s.week > 0 : s.week === 0);
      let rows = lots.filter(s => search(st.q, s.grade, s.producer, s.material));
      rows = sortBy(rows, { grade: s => s.grade, qty: s => s.qty, date: s => s.week, value: s => s.qty * s.price });
      const total = lots.reduce((a, s) => a + s.qty, 0), res = lots.reduce((a, s) => a + (s.qty - s.left), 0);
      return `${tiles(inbound ? [[lots.length, L('Inbound lots', 'Posten im Zulauf')], [tons(total), L('On the way', 'Unterwegs')], [lots.filter(s => s.channel === 'ship').length, L('Containers from Asia', 'Container aus Asien')], [tons(res), L('Already promised', 'Bereits zugesagt')]]
        : [[lots.length, L('Lots in stock', 'Lagerposten')], [tons(total), L('Hamburg + Duisburg', 'Hamburg + Duisburg')], [tons(res), L('Reserved by matches', 'Durch Matches reserviert')], [tons(total - res), L('Free to sell', 'Frei verkäuflich')]])}
        ${filters(L('Search by grade or producer', 'Suche nach Type oder Hersteller'))}
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>SKU</th>${th('grade', 'TYPE')}<th>${L('PRODUCER', 'HERSTELLER')}</th><th>${L('MATERIAL', 'WERKSTOFF')}</th>${th('qty', L('QUANTITY', 'MENGE'))}<th>${L('RESERVED', 'RESERVIERT')}</th>${inbound ? `${th('date', 'ETA')}<th>${L('MODE', 'TRANSPORT')}</th>` : `<th>${L('LOCATION', 'STANDORT')}</th>`}<th>€/KG</th><th>${L('MARGIN', 'MARGE')}</th></tr></thead>
        <tbody>${rows.map((s, i) => { const r = (s.qty - s.left) / s.qty; return `<tr style="--i:${i}"><td class="mono sm">${s.sku}</td><td><b>${esc(s.grade)}</b></td><td>${esc(s.producer)}</td><td class="mono sm">${esc(s.material)}</td><td class="num">${tons(s.qty)}</td>
          <td><span class="bfa-bar"><i style="width:${Math.round(r * 100)}%" class="part"></i></span><small class="pct">${tons(s.qty - s.left)}</small></td>
          ${inbound ? `<td>${wk(s.week)}</td><td>${s.channel === 'ship' ? chip('c-cat', L('Container', 'Container'), ph('boat')) : chip('c-cat', 'LKW', ph('truck'))}</td>` : `<td>${hash(s.sku) % 3 ? 'Hamburg' : 'Duisburg'}</td>`}
          <td class="num">${nf(s.price, 2)}</td><td class="num">${nf(s.margin * 100)}%</td></tr>`; }).join('')}</tbody></table></div>${pager(rows.length)}`;
    }

    function allocPage() {
      const by = new Map(); for (const s of D.R.supply) { const p = by.get(s.producer) || { name: s.producer, qty: 0, used: 0, grades: new Set() }; p.qty += s.qty; p.used += s.qty - s.left; p.grades.add(s.grade); by.set(s.producer, p); }
      const rows = [...by.values()].sort((a, b) => b.qty - a.qty);
      return `${tiles([[rows.length, L('Producers', 'Hersteller')], [tons(rows.reduce((a, p) => a + p.qty, 0)), L('Allocated this month', 'Kontingent diesen Monat')], [tons(rows.reduce((a, p) => a + p.used, 0)), L('Placed with customers', 'An Kunden platziert')], [rows.filter(p => p.used / p.qty < .3).length, L('Under 30 % used', 'Unter 30 % genutzt')]])}
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>${L('PRODUCER', 'HERSTELLER')}</th><th>${L('GRADES', 'TYPEN')}</th><th>${L('ALLOCATION', 'KONTINGENT')}</th><th>${L('PLACED', 'PLATZIERT')}</th><th>${L('USE', 'AUSLASTUNG')}</th></tr></thead>
        <tbody>${rows.map((p, i) => { const r = p.used / p.qty; return `<tr style="--i:${i}"><td><b>${esc(p.name)}</b></td><td>${p.grades.size}</td><td class="num">${tons(p.qty)}</td><td class="num">${tons(p.used)}</td><td><span class="bfa-bar wide"><i style="width:${Math.round(r * 100)}%" class="${r < .3 ? 'low' : 'part'}"></i></span><small class="pct">${nf(r * 100)}%</small></td></tr>`; }).join('')}</tbody></table></div>`;
    }

    function openActions() {
      if (!D) return [];
      const a = [];
      for (const o of D.offers) {
        if (o.status === 'new') a.push({ k: 'draft', icon: 'sparkle', o, t: L(`Draft the offer for ${o.customer.replace(/ GmbH.*/, '')}`, `Angebot für ${o.customer.replace(/ GmbH.*/, '')} entwerfen`), s: L(`${o.ms.length} matched lines, ${eur(o.value)}`, `${o.ms.length} gematchte Positionen, ${eur(o.value)}`) });
        for (const c of o.checks.filter(c => c.s === 'warn')) if (o.status !== 'sent' && o.status !== 'rejected') a.push({ k: 'warn', icon: 'warning', o, t: c.t, s: o.customer });
      }
      for (const m of D.msgs.filter(m => m.conf < 85)) a.push({ k: 'conf', icon: 'eye', m, t: L(`Check extraction: ${subject(m)}`, `Extraktion prüfen: ${subject(m)}`), s: L(`AI confidence ${m.conf} %`, `KI-Konfidenz ${m.conf} %`) });
      for (const p of priceNotices().filter(p => p.offers.length && !model.repriced.has(p.id))) a.unshift({ k: 'warn', icon: 'trend-up', nav: 'prices', t: L(`Reprice ${p.offers.length} offers: ${p.producer} +€${p.up}/t from ${p.from}`, `${p.offers.length} Angebote neu bepreisen: ${p.producer} +${p.up} €/t ab ${p.from}`), s: L('Producer price change', 'Preisänderung Hersteller') });
      for (const t of tightFamilies().filter(t => !model.allotted.has(t.fam))) a.unshift({ k: 'warn', icon: 'scales', nav: 'allot', t: L(`Approve allocation for ${t.fam}: ${tons(t.req)} asked, ${tons(t.avail)} available`, `Allokation ${t.fam} freigeben: ${tons(t.req)} angefragt, ${tons(t.avail)} verfügbar`), s: L('Scarce grade', 'Knapper Werkstoff') });
      for (const d of D.R.demand.filter(d => d.matched < d.qty)) a.push({ k: 'gap', icon: 'factory', d, t: L(`Source ${tons(d.qty - d.matched)} ${d.material}`, `${tons(d.qty - d.matched)} ${d.material} beschaffen`), s: d.customer });
      return a;
    }
    function actionsPage() {
      const a = openActions(), groups = [['draft', L('Ready to draft', 'Bereit zum Entwurf')], ['warn', L('Pre-send warnings', 'Warnungen vor Versand')], ['conf', L('Low-confidence extractions', 'Unsichere Extraktionen')], ['gap', L('Gaps to source', 'Lücken beschaffen')]];
      return `${tiles(groups.map(([k, l]) => [a.filter(x => x.k === k).length, l]))}
        <div class="bfa-actions">${groups.map(([k, l]) => { const list = a.filter(x => x.k === k); return list.length ? `<div class="bfa-card bfa-agrp"><h5>${l}<em>${list.length}</em></h5>${list.slice(0, 8).map((x, i) => `<div class="bfa-arow" style="--i:${i}">${ph(x.icon, 'ai-' + k)}<span><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>
            ${x.nav ? `<button class="bfa-btn sm" data-act="nav" data-id="${x.nav}">${'View'}</button>` : x.o ? `<button class="bfa-btn sm" data-act="${k === 'draft' ? 'draft' : 'offer'}" data-id="${x.o.id}">${k === 'draft' ? L('Draft', 'Entwerfen') : L('Open offer', 'Angebot öffnen')}</button>` : x.m ? `<button class="bfa-btn sm" data-act="msg" data-id="${x.m.id}">${L('Check', 'Prüfen')}</button>` : `<button class="bfa-btn sm" data-act="toast" data-msg="${esc(L('RFQ to producers drafted, waiting for your approval.', 'Anfrage an die Hersteller entworfen, wartet auf Ihre Freigabe.'))}">${L('Ask producers', 'Hersteller anfragen')}</button>`}</div>`).join('')}</div>` : ''; }).join('')}</div>`;
    }

    const MEMORY = () => [
      [L('Rheinform: Zytel 70G30HSL is OEM-approved, equivalents only with a sample', 'Rheinform: Zytel 70G30HSL ist OEM-freigegeben, Ersatz nur mit Muster'), L('Customer', 'Kunde'), 'Rheinform', 64, 98, 91, 2],
      [L('"Zwei Züge" means two silo trucks, 48 t', '„Zwei Züge“ bedeutet zwei Silozüge, 48 t'), L('Language', 'Sprache'), L('Company-wide', 'Unternehmensweit'), 212, 97, 96, 0],
      [L('Bodensee never buys from Grupa Azoty', 'Bodensee kauft nie bei Grupa Azoty'), L('Customer', 'Kunde'), 'Bodensee', 38, 99, 94, 1],
      [L('"Wie immer" in WhatsApp means the last order quantity', '„Wie immer“ bedeutet in WhatsApp die letzte Bestellmenge'), L('Language', 'Sprache'), L('Company-wide', 'Unternehmensweit'), 147, 92, 88, 6],
      [L('"KW" is the ISO calendar week, delivery by Friday', '„KW“ ist die ISO-Kalenderwoche, Lieferung bis Freitag'), L('Dates', 'Termine'), L('Company-wide', 'Unternehmensweit'), 421, 99, 97, 0],
      [L('Sauerland accepts natural + black masterbatch for black', 'Sauerland akzeptiert Natur plus Schwarz-Masterbatch für Schwarz'), L('Customer', 'Kunde'), 'Sauerland', 22, 90, 81, 3],
      [L('Prices are quoted per kg, FCA Hamburg, excl. freight', 'Preise je kg, FCA Hamburg, zzgl. Fracht'), L('Pricing', 'Preise'), L('Company-wide', 'Unternehmensweit'), 538, 98, 95, 1],
      [L('Chimei containers: plan 2 weeks buffer on the ETA', 'Chimei-Container: 2 Wochen Puffer auf die ETA einplanen'), L('Supply', 'Angebot'), 'Chimei', 31, 88, 79, 4],
      [L('Medplast needs the lot certificate with every offer', 'Medplast braucht das Chargenzertifikat zu jedem Angebot'), L('Customer', 'Kunde'), 'Medplast', 17, 95, 90, 0],
      [L('PA66 GF30 HS: BASF A3WG6 and Zytel 70G30HSL are equivalents', 'PA66 GF30 HS: BASF A3WG6 und Zytel 70G30HSL sind gleichwertig'), L('Material', 'Werkstoff'), L('Company-wide', 'Unternehmensweit'), 93, 94, 86, 2],
    ];
    function memoryPage() {
      const rows = MEMORY().filter(r => search(st.q, r[0], r[2]));
      return `<div class="bfa-tabsbar"><div class="bfa-tabs"><button class="on">${L('Active', 'Aktiv')}<em>${MEMORY().length}</em></button><button>${L('Under review', 'In Prüfung')}<em>2</em></button><button>${L('Draft', 'Entwurf')}<em>1</em></button><button>${L('Inactive', 'Inaktiv')}<em>0</em></button></div>
        <div class="bfa-tabs-r"><button class="bfa-btn ghost sm" data-act="toast" data-msg="${esc(L('Export started (CSV).', 'Export gestartet (CSV).'))}">${ph('download-simple')}${L('Download', 'Herunterladen')}</button><button class="bfa-btn primary" data-act="memo" data-id="new">${ph('plus')}${L('Add memory', 'Wissen hinzufügen')}</button></div></div>
        ${tiles([[MEMORY().length, L('Total memories', 'Einträge gesamt')], [nf(MEMORY().reduce((a, r) => a + r[3], 0)), L('Times applied', 'Mal angewendet')], [nf(MEMORY().reduce((a, r) => a + r[5], 0) / MEMORY().length) + '\u202f%', L('Applied by AutoPilot', 'Von AutoPilot angewendet')], [MEMORY().reduce((a, r) => a + r[6], 0), L('Operator edits', 'Korrekturen durch Mitarbeitende')]])}
        <label class="bfa-search solo">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Search memories', 'Wissen durchsuchen'))}"></label>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>${L('MEMORY', 'WISSEN')}</th><th>${L('CATEGORY', 'KATEGORIE')}</th><th>${L('SCOPE', 'GELTUNG')}</th><th>STATUS</th><th>${L('APPLIED', 'ANGEWENDET')}</th><th>${L('AI CONFIDENCE', 'KI-KONFIDENZ')}</th><th>AUTOPILOT</th><th>${L('EDITS', 'KORREKTUREN')}</th><th></th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr style="--i:${i}"><td class="memo"><b>${esc(r[0])}</b><small>${L('Learned from operator corrections', 'Gelernt aus Korrekturen')}</small></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${chip('c-ok', L('Active', 'Aktiv'))}</td><td class="num">${r[3]}</td><td>${conf(r[4])}</td><td class="num">${r[5]}%</td><td class="num">${r[6]}</td>
          <td><button class="bfa-btn sm" data-act="memo" data-id="${i}">${L('View details', 'Details')}</button></td></tr>`).join('')}</tbody></table></div>`;
    }

    function kpisPage() {
      const tot = D.R.demand.reduce((a, d) => a + d.qty, 0), cov = D.R.demand.reduce((a, d) => a + d.matched, 0);
      const weeks = Array.from({ length: 8 }, (_, w) => { const ds = D.R.demand.filter(d => d.week === w); return { w, need: ds.reduce((a, d) => a + d.qty, 0), got: ds.reduce((a, d) => a + d.matched, 0) }; });
      const max = Math.max(...weeks.map(x => x.need), 1);
      const chans = Object.keys(CH).map(k => [k, D.msgs.filter(m => m.channel === k).reduce((a, m) => a + m.lines.length, 0)]).filter(x => x[1]);
      const cmax = Math.max(...chans.map(c => c[1]));
      return `${tiles([[nf(cov / tot * 100) + '\u202f%', L('Demand covered', 'Nachfrage gedeckt')], [eurK(D.R.matches.reduce((a, m) => a + m.margin, 0)), L('Margin in matches', 'Marge in Matches')], ['11 min', L('Message to draft offer', 'Nachricht bis Angebotsentwurf'), L('demo value', 'Demo-Wert')], [`${D.offers.filter(o => o.status === 'sent').length}/${D.offers.length}`, L('Offers sent', 'Angebote gesendet')]])}
        <div class="bfa-kgrid">
          <div class="bfa-card bfa-chart"><h5>${L('Demand vs. covered, by need week', 'Bedarf und gedeckte Menge nach Bedarfswoche')}</h5>
            <div class="bars">${weeks.map(x => `<div class="col"><div class="stack" style="height:${x.need / max * 100}%"><i style="height:${x.need ? x.got / x.need * 100 : 0}%"></i></div><span>${wk(x.w)}</span><small>${tons(x.need)}</small></div>`).join('')}</div>
            <div class="leg"><span class="g">${L('Covered', 'Gedeckt')}</span><span class="n">${L('Gap', 'Lücke')}</span></div></div>
          <div class="bfa-card bfa-chart"><h5>${L('Where demand comes from', 'Woher der Bedarf kommt')}</h5>
            <div class="hbars">${chans.map(([k, n]) => `<div class="hrow">${ch(k).icon()}<span>${ch(k).name}</span><b style="--w:${n / cmax * 100}%"></b><em>${n}</em></div>`).join('')}</div></div>
        </div>`;
    }

    function integrationsPage() {
      const groups = [[L('Communication', 'Kommunikation'), [['Outlook', null, 'microsoft-outlook-logo', '#3b8ee0', 1], ['WhatsApp', 'whatsapp', 0, '#25D366', 1], ['Teams', null, 'microsoft-teams-logo', '#7b83eb', 1], [L('Live calls', 'Live-Anrufe'), null, 'microphone', 'var(--a-acc)', 1], ['Gmail', 'gmail', 0, '#EA4335', 0], ['Slack', 'slack', 0, '#e01e5a', 0]]],
        [L('Work', 'Arbeit'), [['Excel', null, 'microsoft-excel-logo', '#2fa866', 1], ['Word', null, 'microsoft-word-logo', '#3b7ce0', 0], ['PDF', null, 'file-pdf', '#e2483d', 1], ['Google Sheets', 'googlesheets', 0, '#34A853', 0], ['SharePoint', null, 'cloud', '#2aa0a4', 0]]],
        [L('Record', 'Stammsysteme'), [['SAP S/4HANA', 'sap', 0, '#0FAAFF', 1], ['Biesterfeld CRM', 'biesterfeld', 0, '#cb3f1d', 1], ['Dynamics 365', null, 'squares-four', '#3b7ce0', 0], ['Oracle', 'oracle', 0, '#F80000', 0], ['HubSpot', 'hubspot', 0, '#FF7A59', 0], ['DATEV', 'datev', 0, '#9BD547', 0]]]];
      return groups.map(([g, list]) => `<div class="bfa-card bfa-intg"><h5>${g}</h5><div class="bfa-igrid">${list.map(([n, slug, icon, color, on], i) => `<div class="bfa-irow" style="--i:${i}">${slug ? logo(slug, color, 'lg') : glyph(icon, color, 'lg')}<span><b>${esc(n)}</b><small>${on ? L('Connected · syncing', 'Verbunden · synchronisiert') : L('Available', 'Verfügbar')}</small></span><button class="bfa-switch ${on ? 'on' : ''}" data-act="toast" data-msg="${esc(on ? L(`${n} stays connected in the demo.`, `${n} bleibt in der Demo verbunden.`) : L(`${n}: your admin approves the connection once (OAuth).`, `${n}: Ihre IT gibt die Verbindung einmalig frei (OAuth).`))}"><i></i></button></div>`).join('')}</div></div>`).join('');
    }

    function masterPage() {
      const rows = D.customers.filter(c => search(st.q, c.name, c.city));
      return `${tiles([[D.customers.length, L('Customers', 'Kunden')], [new Set(S.supply.map(s => s.grade)).size, L('Grades', 'Typen')], [new Set(S.supply.map(s => s.producer)).size, L('Producers', 'Hersteller')], [S.demand.filter(d => d.approved).length, L('Grade approvals', 'Typenfreigaben')]])}
        <label class="bfa-search solo">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Search customers', 'Kunden suchen'))}"></label>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th class="cbx"><span class="cb"></span></th><th>CODE</th><th>${L('CUSTOMER', 'KUNDE')}</th><th>SEGMENT</th><th>${L('CITY', 'ORT')}</th><th>${L('CONTACT', 'KONTAKT')}</th><th>${L('APPROVED GRADES', 'FREIGEGEBENE TYPEN')}</th><th>${L('CREDIT', 'KREDIT')}</th></tr></thead>
        <tbody>${rows.map((c, i) => `<tr style="--i:${i}"><td class="cbx"><span class="cb"></span></td><td class="mono sm">${c.code}</td><td><b class="cname">${esc(c.name)}</b></td><td>${segChip(c.seg)}</td><td>${esc(c.city)}</td><td>${esc(c.contact)}</td><td class="num">${S.demand.filter(d => d.customer === c.name && d.approved).length}</td><td>${hash(c.name) % 7 ? chip('c-ok', L('OK', 'OK')) : chip('c-warn', L('Check', 'Prüfen'))}</td></tr>`).join('')}</tbody></table></div>`;
    }

    function settingsPage() {
      return `<div class="bfa-card bfa-form"><h5>${L('Profile', 'Profil')}</h5>
        <div class="bfa-fgrid"><label>${L('Name', 'Name')}<input value="Lena Hoffmann"></label><label>${L('Role', 'Rolle')}<input value="${esc(L('Sales · Engineering Plastics', 'Vertrieb · Technische Kunststoffe'))}"></label>
        <label>${L('Approval level', 'Freigabestufe')}<input value="${esc(L('Offers up to € 250k', 'Angebote bis 250.000 €'))}"></label><label>${L('Language', 'Sprache')}<input value="${lang() === 'de' ? 'Deutsch' : 'English'}"></label></div>
        <h5>${L('Notifications', 'Benachrichtigungen')}</h5>
        ${[[L('New demand from my accounts', 'Neuer Bedarf meiner Kunden'), 1], [L('Offer ready for approval', 'Angebot bereit zur Freigabe'), 1], [L('Container ETA changes', 'Änderungen der Container-ETA'), 1], [L('Weekly KPI summary', 'Wöchentliche KPI-Zusammenfassung'), 0]].map(([l, on]) => `<div class="bfa-irow">${ph('bell')}<span><b>${l}</b></span><button class="bfa-switch ${on ? 'on' : ''}" data-act="flip"><i></i></button></div>`).join('')}
        <div class="bfa-form-f"><button class="bfa-btn primary" data-act="toast" data-msg="${esc(L('Settings saved.', 'Einstellungen gespeichert.'))}">${L('Save', 'Speichern')}</button></div></div>`;
    }

    // ---------------- 2026 value modules: documents, price changes, allocation, subsidiaries
    const fam = x => E.parseMaterial(`${x.material} ${x.grade || ''}`).family;
    function docRequests() {
      const TYPES = [['coa', 'CoA', L('Certificate of analysis', 'Analysenzertifikat')], ['sds', L('SDS', 'SDB'), L('Safety data sheet', 'Sicherheitsdatenblatt')], ['reach', 'REACH', L('REACH statement', 'REACH-Erklärung')],
        ['ppwr', 'PPWR', L('PPWR declaration of conformity', 'PPWR-Konformitätserklärung')], ['food', 'EU 10/2011', L('Food contact declaration', 'Lebensmittelkontakt-Erklärung')], ['pcf', 'PCF', L('Product carbon footprint', 'CO₂-Fußabdruck (PCF)')]];
      return D.R.demand.slice(0, 20).map((d, i) => {
        const h = hash(`${d.customer}${i}doc`), pack = meta(d.customer).seg === 'pack';
        const t = pack ? TYPES[[3, 4, 0][h % 3]] : TYPES[h % TYPES.length];
        const grade = d.grade || D.R.matches.find(m => m.d === d)?.s.grade || d.material;
        const auto = t[0] !== 'pcf' && h % 6 !== 0;
        return { id: `DR-${2400 + i}`, customer: d.customer, channel: d.channel === 'crm' ? 'email' : d.channel === 'calls' ? 'email' : d.channel, t, grade, auto, conf: auto ? 91 + h % 8 : 72 + h % 10, at: new Date(NOW - (h % 46 + 1) * 3600e3) };
      }).sort((a, b) => b.at - a.at);
    }
    function docsPage() {
      const list = docRequests().filter(r => search(st.q, r.customer, r.grade, r.t[1], r.t[2]));
      const all = docRequests(), auto = all.filter(r => r.auto).length;
      return `${tiles([[all.length, L('Requests this week', 'Anfragen diese Woche')], [`${nf(auto / all.length * 100)} %`, L('Answer prepared from the document library', 'Antwort aus der Dokumentenbibliothek vorbereitet')], [all.filter(r => r.t[0] === 'ppwr').length, L('PPWR requests (since 12 Aug 2026)', 'PPWR-Anfragen (seit 12. Aug. 2026)')], ['4 min', L('Request to answer', 'Anfrage bis Antwort'), L('demo value', 'Demo-Wert')]])}
        <label class="bfa-search solo">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Search by customer, grade or document', 'Suche nach Kunde, Type oder Dokument'))}"></label>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>${L('REQUEST', 'ANFRAGE')}</th><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('DOCUMENT', 'DOKUMENT')}</th><th>TYPE</th><th>${L('RECEIVED', 'EINGANG')}</th><th>${L('AI CONFIDENCE', 'KI-KONFIDENZ')}</th><th>STATUS</th><th></th></tr></thead>
        <tbody>${list.map((r, i) => { const sent = model.docsSent.has(r.id); return `<tr style="--i:${i}"><td class="msgcell">${ch(r.channel).icon()}<span><b>${esc(r.t[2])}</b><small>${esc(r.id)}</small></span></td><td>${esc(r.customer.replace(/ GmbH.*/, ''))}</td><td>${chip(r.t[0] === 'ppwr' ? 'c-ai' : 'c-cat', r.t[1])}</td><td><b>${esc(r.grade)}</b></td><td class="nowrap">${when(r.at)}</td><td>${conf(r.conf)}</td>
          <td>${sent ? chip('c-sent', r.auto ? L('Sent', 'Gesendet') : L('Asked producer', 'Beim Hersteller angefragt')) : r.auto ? chip('c-ready', L('Answer ready', 'Antwort bereit')) : chip('c-warn', r.t[0] === 'pcf' ? L('Not in library', 'Nicht in Bibliothek') : L('Check', 'Prüfen'))}</td>
          <td>${sent ? '' : r.auto ? `<button class="bfa-btn sm accent" data-act="docsend" data-id="${r.id}">${ph('paper-plane-tilt')}${L('Approve & send', 'Freigeben & senden')}</button>` : `<button class="bfa-btn sm" data-act="docask" data-id="${r.id}">${L('Ask producer', 'Hersteller anfragen')}</button>`}</td></tr>`; }).join('')}</tbody></table></div>${pager(list.length)}`;
    }

    // producer notices: Celanese POM from 8 Oct 2026 was announced publicly; the amounts and the other notices are demo values
    function priceNotices() {
      const N = [['P-1', 'Celanese', ['POM'], 180, L('8 Oct 2026', '8. Okt. 2026'), true], ['P-2', 'ExxonMobil', ['LLDPE', 'HDPE', 'PE', 'PP'], 120, L('1 Nov 2026', '1. Nov. 2026'), false],
        ['P-3', 'BASF', ['PA6', 'PA66', 'PBT', 'POM'], 90, L('1 Nov 2026', '1. Nov. 2026'), false], ['P-4', 'Indorama', ['PET'], 60, L('1 Nov 2026', '1. Nov. 2026'), false]];
      return N.map(([id, producer, fams, up, from, real]) => {
        const ms = D.R.matches.filter(m => m.s.producer === producer && fams.includes(fam(m.s)));
        const offers = [...new Set(ms.map(m => offerOf(m)).filter(o => o && o.status !== 'sent' && o.status !== 'rejected'))];
        const t = ms.reduce((a, m) => a + m.qty, 0);
        return { id, producer, fams, up, from, real, ms, offers, t, risk: t / 1000 * up };
      });
    }
    function pricesPage() {
      const ps = priceNotices(), risk = ps.filter(p => !model.repriced.has(p.id)).reduce((a, p) => a + p.risk, 0);
      return `${tiles([[ps.length, L('Producer notices', 'Herstellerschreiben')], [ps.reduce((a, p) => a + p.offers.length, 0), L('Open offers affected', 'Betroffene offene Angebote')], [eur(risk), L('Margin at risk if not repriced', 'Marge in Gefahr, falls nicht neu bepreist wird')], [ps.filter(p => model.repriced.has(p.id)).length, L('Repriced', 'Neu bepreist')]])}
        <div class="bfa-prices">${ps.map((p, i) => { const done = model.repriced.has(p.id); return `<div class="bfa-card bfa-price ${done ? 'done' : ''}" style="--i:${i}">
          <div class="pt"><span class="pp">${ph('megaphone-simple')}</span><span class="pm"><b>${esc(p.producer)} · ${p.fams.filter(f => p.ms.some(m => fam(m.s) === f)).join(', ') || p.fams.join(', ')}</b><small>${L('effective', 'gültig ab')} ${p.from} · ${p.real ? L('announced publicly', 'öffentlich angekündigt') : L('demo notice', 'Demo-Schreiben')}</small></span><em>+${p.up} €/t${p.real ? `<i>${L('amount: demo', 'Betrag: Demo')}</i>` : ''}</em></div>
          <div class="pd"><span><b>${p.offers.length}</b> ${L('open offers', 'offene Angebote')}</span><span><b>${tons(p.t)}</b> ${L('affected', 'betroffen')}</span><span><b>${eur(p.risk)}</b> ${L('margin at risk', 'Marge in Gefahr')}</span></div>
          ${p.offers.length ? `<div class="po">${p.offers.slice(0, 4).map(o => `<button class="lnk" data-act="offer" data-id="${o.id}">${o.id} · ${esc(o.customer.replace(/ GmbH.*/, ''))}</button>`).join('')}</div>` : ''}
          <div class="pf">${done ? `<span class="okline">${ph('check-circle')}${L('Repriced, customer notices drafted', 'Neu bepreist, Kundeninfos entworfen')}</span>` : p.offers.length ? `<button class="bfa-btn primary sm" data-act="reprice" data-id="${p.id}">${ph('arrows-clockwise')}${L('Reprice offers & draft notices', 'Angebote neu bepreisen & Kundeninfo entwerfen')}</button>` : `<span class="okline muted">${L('No open offers affected', 'Keine offenen Angebote betroffen')}</span>`}</div></div>`; }).join('')}</div>`;
    }

    function tightFamilies() {
      const req = new Map(), avail = new Map();
      for (const d of D.R.demand) req.set(fam(d), (req.get(fam(d)) || 0) + d.qty);
      for (const s of D.R.supply) avail.set(fam(s), (avail.get(fam(s)) || 0) + s.qty);
      return [...req.entries()].filter(([f, r]) => r > (avail.get(f) || 0)).map(([f, r]) => ({ fam: f, req: r, avail: avail.get(f) || 0 })).sort((a, b) => (b.req - b.avail) - (a.req - a.avail));
    }
    function allotPage() {
      const tf = tightFamilies(), hormuz = ['LLDPE', 'HDPE', 'PE', 'PP', 'PET'];
      return `${AE && !AE.canAllocate() ? `<div class="bfa-banner ae-role-note">${ph('user-switch')}<span>${L(`You are viewing as ${AE.name()}. Allocation is decided by product management; switch the role in the bottom-left to approve.`, `Ansicht: ${AE.name()}. Über die Allokation entscheidet das Produktmanagement; zum Freigeben unten links die Rolle wechseln.`)}</span></div>` : ''}<div class="bfa-banner">${ph('scales')}<span>${L('Rules, in this order: approved grades first, framework call-offs second, then need date. Customers flagged for credit are held for a person. You approve every allocation.', 'Regeln in dieser Reihenfolge: zuerst freigegebene Typen, dann Rahmenabrufe, dann Bedarfstermin. Über Kunden mit Kreditvermerk entscheidet ein Mensch. Jede Allokation geben Sie frei.')}</span></div>
        ${tiles([[tf.length, L('Scarce materials', 'Knappe Werkstoffe')], [tons(tf.reduce((a, t) => a + t.req, 0)), L('Requested', 'Angefragt')], [tons(tf.reduce((a, t) => a + t.avail, 0)), L('Available incl. inbound', 'Verfügbar inkl. Zulauf')], [tf.filter(t => model.allotted.has(t.fam)).length, L('Allocations approved', 'Allokationen freigegeben')]])}
        <div class="bfa-allot">${tf.map((t, i) => { const rows = D.R.demand.filter(d => fam(d) === t.fam); const ok = model.allotted.has(t.fam); return `<div class="bfa-card bfa-al" style="--i:${i}">
          <div class="at"><b>${t.fam}</b>${hormuz.includes(t.fam) ? chip('c-warn', L('Hormuz allocation', 'Hormus-Allokation')) : chip('c-cat', L('Tight', 'Knapp'))}<span class="sp"></span><span class="ar"><b>${tons(t.avail)}</b> / ${tons(t.req)} · ${nf(t.avail / t.req * 100)} %</span></div>
          <span class="bfa-bar wide2"><i style="width:${Math.round(t.avail / t.req * 100)}%" class="part"></i></span>
          <div class="al-rows">${rows.map(d => { const credit = hash(d.customer) % 7 === 0; const p = d.matched / d.qty; return `<div class="al-row"><span class="nm">${esc(d.customer.replace(/ GmbH.*/, ''))}</span><span class="tg">${d.approved ? chip('c-lock', L('Approved grade', 'Freigegebene Type'), ph('lock-simple')) : d.channel === 'crm' ? chip('c-sent', L('Framework', 'Rahmenvertrag')) : chip('c-cat', wk(d.week))}${credit ? chip('c-rej', L('Credit check', 'Kredit prüfen')) : ''}</span><span class="bfa-bar"><i style="width:${Math.round(p * 100)}%" class="${p >= 1 ? 'full' : 'part'}"></i></span><span class="q">${tons(d.matched)} / ${tons(d.qty)}</span></div>`; }).join('')}</div>
          <div class="pf">${ok ? `<span class="okline">${ph('check-circle')}${L('Approved, sales informed', 'Freigegeben, Vertrieb informiert')}</span>` : AE && !AE.canAllocate() ? `<span class="okline muted">${ph('lock-simple')}${L('Product management decides', 'Entscheidet das Produktmanagement')}</span><button class="bfa-btn sm" data-act="ae-allocreq">${L('Ask for a change', 'Änderung anfragen')}</button>` : `<button class="bfa-btn primary sm" data-act="allotok" data-id="${t.fam}">${ph('check')}${L('Approve allocation', 'Allokation freigeben')}</button>`}</div></div>`; }).join('')}</div>`;
    }

    function entitiesPage() {
      // public facts: the acquisitions and dates; system and connection states are demo assumptions
      const E2 = [['Biesterfeld SE · Biesterfeld Plastic', 'DE', L('Group', 'Konzern'), 'SAP S/4HANA', [1, 1, 1], 'live'],
        ['Biesterfeld Polybass · Polychem', 'IT', L('100 % since Jul 2026', '100 % seit Juli 2026'), L('own system', 'eigenes System'), [1, 1, 0], 'pilot'],
        ['Biesterfeld Plastik · Özel Kimyasallar', 'TR', L('100 % since 2025', '100 % seit 2025'), L('own system', 'eigenes System'), [1, 0, 0], 'plan'],
        ['GME Chemicals (incl. Tat Lee)', 'SG', L('since 2021 / 2025', 'seit 2021 / 2025'), L('own system', 'eigenes System'), [0, 0, 0], 'plan'],
        ['OSP', 'KR', L('majority since May 2026', 'Mehrheit seit Mai 2026'), L('own system', 'eigenes System'), [0, 0, 0], 'plan']];
      const yes = v => v ? `<span class="yn y">${ph('check')}</span>` : `<span class="yn">${ph('minus')}</span>`;
      const stc = { live: ['c-ready', 'Live'], pilot: ['c-review', 'Pilot'], plan: ['c-cat', L('Planned 2027', 'Geplant 2027')] };
      return `${tiles([[E2.length, L('Companies', 'Gesellschaften')], [E2.filter(e => e[4][0]).length, L('Inboxes connected', 'Postfächer verbunden')], [E2.filter(e => e[4][2]).length, L('Writing to ERP with approval', 'Schreiben ins ERP mit Freigabe')], ['0', L('ERP migrations needed first', 'Nötige ERP-Migrationen vorab')]])}
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table"><thead><tr><th>${L('COMPANY', 'GESELLSCHAFT')}</th><th>${L('COUNTRY', 'LAND')}</th><th>${L('IN THE GROUP', 'IM KONZERN')}</th><th>ERP</th><th>${L('INBOX', 'POSTFACH')}</th><th>${L('AI READS', 'KI LIEST')}</th><th>${L('AI WRITES', 'KI SCHREIBT')}</th><th>STATUS</th></tr></thead>
        <tbody>${E2.map((e, i) => `<tr style="--i:${i}"><td><b class="cname">${esc(e[0])}</b></td><td class="mono">${e[1]}</td><td>${esc(e[2])}</td><td>${esc(e[3])}</td><td>${yes(e[4][0])}</td><td>${yes(e[4][1])}</td><td>${yes(e[4][2])}</td><td>${chip(stc[e[5]][0], stc[e[5]][1])}</td></tr>`).join('')}</tbody></table></div>
        <p class="bfa-fn">${L('Acquisitions and dates are public. Systems and connection states are demo assumptions.', 'Übernahmen und Daten sind öffentlich. Systeme und Verbindungsstände sind Demo-Annahmen.')}</p>`;
    }

    // the email that carries an offer: used by the offer document and by the account manager's send drawer
    function offerMail(o) { const r = offerMailRaw(o); return { subj: personal(r.subj, o.customer), body: personal(r.body, o.customer) }; }
    function offerMailRaw(o) {
      const c = meta(o.customer), who = AE ? AE.name() : 'Lena Hoffmann';
      const need = o.demand.reduce((a, d) => a + d.qty, 0), got = o.demand.reduce((a, d) => a + d.matched, 0);
      const line = (m, de) => `- ${tons(m.qty)} ${m.s.producer} ${m.s.grade}${m.grade === 'alt' ? (de ? ' (gleichwertig, bitte freigeben)' : ' (equivalent, needs your release)') : ''}: ${nf(m.s.price, 2)} €/kg, ${!m.s.week ? (de ? 'ab Lager Hamburg, sofort lieferbar' : 'in stock in Hamburg, ready to ship') : m.onTime ? (de ? `im Zulauf, lieferbar ${wk(m.s.week)}` : `inbound, available ${wk(m.s.week)}`) : (de ? `im Zulauf, lieferbar ${wk(m.s.week)} (nach Ihrer Wunschwoche ${wk(m.d.week)})` : `inbound, available ${wk(m.s.week)} (after your week ${wk(m.d.week)})`)}`;
      const gap = need > got ? [`\n\n${tons(need - got)} of your ${tons(need)} we cannot cover right now. I will come back to you with a date or an alternative.`, `\n\n${tons(need - got)} Ihrer ${tons(need)} können wir im Moment nicht decken. Dazu melde ich mich mit einem Termin oder einer Alternative.`] : ['', ''];
      const firm = ['Biesterfeld Plastic GmbH · Ferdinandstraße 41 · 20095 Hamburg\nDistributor for BASF, Celanese, ExxonMobil, LG Chem and others · ISO 9001', 'Biesterfeld Plastic GmbH · Ferdinandstraße 41 · 20095 Hamburg\nDistributor u. a. für BASF, Celanese, ExxonMobil, LG Chem · ISO 9001'];
      if (o.priceOnly) { const gs = o.scale || [...new Map(o.ms.map(m => [m.s.grade, m.s])).values()];
        const sc = de => gs.map(g => `${g.producer} ${g.grade}:\n${TIERS.map(([t, up, fr]) => `- ${t} t: ${nf(g.price + up, 2)} €/kg ${de ? 'zzgl.' : 'plus'} ${nf(fr, 2)} €/kg ${de ? 'Fracht' : 'freight'}`).join('\n')}`).join('\n\n');
        return { subj: `${L('Price scale', 'Preisstaffel')} 1 / 3 / 5 t · ${gs.map(g => g.grade).join(', ')}`,
          body: L(`Dear ${c.contact},\n\nthank you for your price inquiry. For your calculation, our scale, FCA Hamburg, 30 days net:\n\n${sc(false)}\n\nThe prices are valid for 14 days. When a quantity is fixed, I will gladly send you a firm offer.\n\nKind regards\n${who}\n${firm[0]}`,
            `Guten Tag ${c.contact},\n\nvielen Dank für Ihre Preisanfrage. Für Ihre Kalkulation unsere Staffel, FCA Hamburg, 30 Tage netto:\n\n${sc(true)}\n\nDie Preise gelten 14 Tage. Steht eine Menge fest, schicke ich Ihnen gern ein festes Angebot.\n\nMit freundlichen Grüßen\n${who}\n${firm[1]}`) }; }
      if (o.kind === 'order') return { subj: `${L('Order confirmation', 'Auftragsbestätigung')} ${o.id} · ${[...new Set(o.ms.map(m => m.s.grade))].join(', ')}`,
        body: L(`Dear ${c.contact},\n\nthank you for your call-off against our framework agreement. We confirm:\n${o.ms.map(m => line(m, false)).join('\n')}\n\nAt the agreed framework price, FCA Hamburg.${need > got ? `\n\nWe are securing the remaining ${tons(need - got)} with the producer and will confirm the date by Friday.` : ''}\n\nKind regards\n${who}\n${firm[0]}`,
          `Guten Tag ${c.contact},\n\nvielen Dank für Ihren Abruf aus dem Rahmenvertrag. Wir bestätigen:\n${o.ms.map(m => line(m, true)).join('\n')}\n\nZum vereinbarten Rahmenpreis, FCA Hamburg.${need > got ? `\n\nDie restlichen ${tons(need - got)} sichern wir gerade beim Hersteller ab; den Termin bestätigen wir Ihnen bis Freitag.` : ''}\n\nMit freundlichen Grüßen\n${who}\n${firm[1]}`) };
      return { subj: `${L('Offer', 'Angebot')} ${o.id} · ${[...new Set(o.ms.map(m => m.s.grade))].join(', ')}`,
        body: L(`Dear ${c.contact},\n\nthank you for your request. Please find attached offer ${o.id}:\n${o.ms.map(m => line(m, false)).join('\n')}\n\nTotal ${eur(o.value)}, FCA Hamburg, 30 days net, valid for 14 days.${gap[0]}\n\nKind regards\n${who}\n${firm[0]}`,
          `Guten Tag ${c.contact},\n\nvielen Dank für Ihre Anfrage. Anbei finden Sie unser Angebot ${o.id}:\n${o.ms.map(m => line(m, true)).join('\n')}\n\nGesamt ${eur(o.value)}, FCA Hamburg, 30 Tage netto, gültig 14 Tage.${gap[1]}\n\nMit freundlichen Grüßen\n${who}\n${firm[1]}`) };
    }

    // the document as the customer gets it: a draft with a watermark, or sent with the date
    function offerDoc(o) {
      const ord = o.kind === 'order', c = meta(o.customer), sent = o.status === 'sent', sentAt = AE?.sentAt?.(o.id);
      const po = o.priceOnly, docT = po ? L('Price scale', 'Preisstaffel') : ord ? L('Order confirmation', 'Auftragsbestätigung') : L('Offer', 'Angebot');
      const gs = o.scale || [...new Map(o.ms.map(m => [m.s.grade, m.s])).values()];
      const rows = po ? gs.flatMap((g, gi) => TIERS.map(([t, up, fr], ti) => `<tr class="${ti === 0 && gi ? 'grp' : ''}"><td>${ti === 0 ? String(gi + 1).padStart(2, '0') : ''}</td><td>${ti === 0 ? `<b>${esc(g.producer)} ${esc(g.grade)}</b><small>${esc(g.material)}</small>` : ''}</td><td>${t} t</td><td>${nf(g.price + up, 2)}</td><td>${nf(fr, 2)}</td><td>${nf((g.price + up + fr) * t * 1000, 2)}</td></tr>`)).join('')
        : o.ms.map((m, i) => `<tr><td>${String(i + 1).padStart(2, '0')}</td><td><b>${esc(m.s.producer)} ${esc(m.s.grade)}</b><small>${esc(m.s.material)}</small></td><td>${nf(m.qty / 1000, m.qty % 1000 ? 1 : 0)} t</td><td>${nf(m.s.price, 2)}</td><td>${m.s.week ? wk(m.s.week) : L('stock', 'Lager')}</td><td>${nf(m.value, 2)}</td></tr>`).join('');
      return `<div class="bfa-doc gm ${sent ? 'final' : ''}">
          <div class="doc-head"><div><small>BIESTERFELD PLASTIC GMBH · ${L('SALES', 'VERTRIEB')}</small><h4>${docT}</h4><span>Ferdinandstraße 41 · 20095 Hamburg</span></div><div class="r"><small>${po ? L('REFERENCE', 'REFERENZ') : ord ? L('ORDER NUMBER', 'AUFTRAGSNUMMER') : L('OFFER NUMBER', 'ANGEBOTSNUMMER')}</small><b>${o.id}</b><span>${L('Issue date', 'Ausstellungsdatum')}: ${short(sentAt || NOW)}</span>${sent && sentAt ? `<span class="doc-stamp">${ph('paper-plane-tilt')}${L('Sent', 'Gesendet')} ${short(sentAt)}</span>` : ''}</div></div>
          <div class="doc-addr"><div><small>${L('CUSTOMER', 'KUNDE')}</small><b>${esc(o.customer)}</b><em>${esc(c.code)}</em><span>${L('Attn.', 'z. Hd.')} ${esc(c.contact)}</span></div><div><small>${L('SHIP TO', 'LIEFERADRESSE')}</small><b>${esc(c.city)} · ${L('Plant', 'Werk')}</b><span>${esc(o.customer.replace(/ GmbH.*/, ''))}<br>${L('Germany', 'Deutschland')}</span></div></div>
          <div class="doc-terms"><div><small>${L('PAYMENT', 'ZAHLUNG')}</small><b>${L('30 days net', '30 Tage netto')}</b></div><div><small>INCOTERM</small><b>FCA Hamburg</b></div><div><small>${po ? L('VALID UNTIL', 'GÜLTIG BIS') : ord ? L('FRAMEWORK', 'RAHMENVERTRAG') : L('REQUESTED DELIVERY', 'GEWÜNSCHTE LIEFERUNG')}</small><b>${po ? short(new Date(+NOW + 14 * 864e5)) : ord ? L('agreed price', 'vereinbarter Preis') : wk(Math.min(...o.demand.map(d => d.week)))}</b></div></div>
          <table><thead><tr><th>#</th><th>${L('GRADE · DESCRIPTION', 'TYPE · BESCHREIBUNG')}</th><th>${po ? L('TIER', 'STAFFEL') : L('QTY', 'MENGE')}</th><th>${L('UNIT · €/KG', 'PREIS · €/KG')}</th><th>${po ? L('FREIGHT · €/KG', 'FRACHT · €/KG') : L('DELIVERY', 'LIEFERUNG')}</th><th>${L('TOTAL · EUR', 'SUMME · EUR')}</th></tr></thead>
          <tbody>${rows}</tbody></table>
          ${po ? `<p class="doc-note">${L('Non-binding price information for your calculation. No quantity is reserved; a firm offer follows once a quantity is fixed.', 'Unverbindliche Preisinformation für Ihre Kalkulation. Es ist keine Menge reserviert; ein festes Angebot folgt, sobald eine Menge feststeht.')}</p>`
            : `<div class="doc-total"><span>${ord ? L('TOTAL ORDER VALUE', 'AUFTRAGSWERT GESAMT') : L('TOTAL OFFER VALUE', 'ANGEBOTSWERT GESAMT')}</span><b><small>EUR</small>${nf(o.value, 2)}</b></div>`}
          <div class="doc-sign"><span>${L('Authorised signatory', 'Unterschrift')} · Biesterfeld Plastic GmbH<br>${AE ? AE.name() : 'Lena Hoffmann'}</span><span>${po ? L('For your calculation', 'Für Ihre Kalkulation') : L('Customer acknowledgement', 'Bestätigung Kunde')}<br>${po ? L('no signature needed', 'keine Unterschrift nötig') : L('to be signed on order', 'bei Auftrag zu unterzeichnen')}</span></div>
          ${sent ? '' : `<i class="wm">${L('DRAFT', 'ENTWURF')}</i>`}
        </div>`;
    }

    // ---------------- offer detail (split view)
    function offerDetail() {
      const o = D.offers.find(x => x.id === st.offer) || D.orders.find(x => x.id === st.offer); if (!o) return '';
      const ord = o.kind === 'order', c = meta(o.customer), dsrc = [...new Set(o.msgs.map(m => m.channel))];
      const sent = o.status === 'sent', rej = o.status === 'rejected';
      const late = o.ms.some(m => !m.onTime);
      const tabs = AE ? [['details', o.priceOnly ? L('Scale details', 'Staffeldetails') : ord ? L('Order details', 'Auftragsdetails') : L('Offer details', 'Angebotsdetails')], ['demand', L('Source & demand', 'Quelle & Bedarf'), o.msgs.length], ['log', L('Activity log', 'Aktivitäten'), 4 + (sent ? 1 : 0)], ['email', sent ? L('Sent email', 'Gesendete E-Mail') : L('Our reply', 'Unsere Antwort')]]
        : [['details', L('Offer details', 'Angebotsdetails')], ['demand', L('Linked demand', 'Verknüpfter Bedarf'), o.demand.length], ['log', L('Activity log', 'Aktivitäten')], ['email', L('Email draft', 'E-Mail-Entwurf')]];
      const need = o.demand.reduce((a, d) => a + d.qty, 0), got = o.demand.reduce((a, d) => a + d.matched, 0), stock = o.ms.filter(m => !m.s.week).reduce((a, m) => a + m.qty, 0);
      const next = ord ? (sent ? L('Nothing, order created', 'Nichts, Auftrag angelegt') : L('Create the order in SAP and confirm', 'Auftrag in SAP anlegen und bestätigen')) : sent ? L('Follow up with the customer', 'Beim Kunden nachfassen') : rej ? L('Nothing, rejected', 'Nichts, abgelehnt') : o.warn ? L(`Check ${o.warn} point${o.warn > 1 ? 's' : ''}, then send`, `${o.warn} Prüfpunkt${o.warn > 1 ? 'e' : ''} ansehen, dann senden`) : L('Send to customer', 'An Kunden senden');
      const summary = L(`${c.contact} ${ord ? 'called off' : 'asked for'} ${o.demand.length} line${o.demand.length > 1 ? 's' : ''} via ${[...new Set(o.msgs.map(m => ch(m.channel).name))].join(' and ')}. ${tons(got)} of ${tons(need)} covered: ${tons(stock)} from stock in Hamburg${got > stock ? `, ${tons(got - stock)} inbound` : ''}. Margin ${nf(o.value ? o.margin / o.value * 100 : 0, 1)} %.`,
        `${c.contact} hat ${o.demand.length} Position${o.demand.length > 1 ? 'en' : ''} per ${[...new Set(o.msgs.map(m => ch(m.channel).name))].join(' und ')} ${ord ? 'abgerufen' : 'angefragt'}. ${tons(got)} von ${tons(need)} gedeckt: ${tons(stock)} ab Lager Hamburg${got > stock ? `, ${tons(got - stock)} im Zulauf` : ''}. Marge ${nf(o.value ? o.margin / o.value * 100 : 0, 1)} %.`);
      const po = o.priceOnly, gs = o.scale || [...new Map(o.ms.map(m => [m.s.grade, m.s])).values()];
      const doc = `${offerDoc(o)}<p class="doc-cap">${L('Live preview of the PDF that goes out with the email. The watermark disappears on send.', 'Live-Vorschau des PDFs, das mit der E-Mail rausgeht. Das Wasserzeichen verschwindet beim Versand.')}</p>`;
      let pane = '';
      const val = `<div class="bfa-val ${o.warn ? 'has-warn' : ''}"><div class="vh">${ph('check-square-offset')}<b>${ord ? L('Checks before the order', 'Prüfung vor Auftrag') : L('Pre-send validation', 'Prüfung vor Versand')}</b><span class="vc"><i class="p"></i>${o.checks.length - o.warn} ${L('pass', 'ok')}<i class="w"></i>${o.warn} ${L('warn', 'Warnung')}<i class="f"></i>0 ${L('fail', 'Fehler')}</span></div>
          ${o.checks.map(c => `<div class="vrow ${c.s}"><i class="dot"></i><span>${esc(c.t)}</span><b>${c.s === 'pass' ? 'PASS' : 'WARN'}</b></div>`).join('')}</div>`;
      const fld = (l, v, opts) => `<label><span class="fl">${l}${ph('info')}</span>${opts ? `<select>${opts.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>` : `<input value="${esc(v)}">`}</label>`;
      if (st.oTab === 'details') pane = AE ? `<div class="bfa-gemi"><div class="gh">${ph('sparkle')}<b>${L('AI summary', 'KI-Zusammenfassung')}</b>${conf(o.conf)}<span class="nx">${L('Next', 'Nächster Schritt')}: <b>${esc(po ? (o.status === 'sent' ? L('Nothing, scale sent', 'Nichts, Staffel gesendet') : L('Send the price scale', 'Preisstaffel senden')) : next)}</b></span></div>
          <p>${esc(po ? L(`${c.contact} only asks for prices for their calculation (${gs.map(g => g.grade).join(', ')}). Instead of an offer, a scale for 1 / 3 / 5 t goes out; no quantity is promised.`, `${c.contact} fragt nur Preise für die Kalkulation an (${gs.map(g => g.grade).join(', ')}). Statt eines Angebots geht eine Staffel für 1 / 3 / 5 t raus; es wird keine Menge zugesagt.`) : summary)}</p>
          ${AE.sourceBrief(o)}${val}</div>
        ${AE.coachFor(o)}
        <details class="bfa-sec"><summary>${po ? L('Scale overview', 'Staffelübersicht') : ord ? L('Order overview', 'Auftragsübersicht') : L('Order overview', 'Auftragsübersicht')}${ph('caret-down')}</summary><div class="bfa-fgrid">
          ${po ? gs.map(g => fld(g.grade, `${nf(g.price + TIERS[0][1], 2)} → ${nf(g.price + TIERS[2][1], 2)} €/kg`)).join('') : `${fld(L('Requested', 'Angefragt'), tons(need))}${fld(L('Covered', 'Gedeckt'), `${tons(got)} · ${tons(stock)} ${L('from stock', 'ab Lager')}`)}${fld(L('Earliest need', 'Frühester Bedarf'), wk(Math.min(...o.demand.map(d => d.week))))}${fld(L('Margin', 'Marge'), `${nf(o.value ? o.margin / o.value * 100 : 0, 1)} % · ${eur(o.margin)}`)}`}</div></details>
        <details class="bfa-sec" open><summary>${po ? L('Scale header', 'Staffelkopf') : ord ? L('Order header', 'Auftragskopf') : L('Offer header', 'Angebotskopf')}${ph('caret-down')}</summary><div class="bfa-fgrid gm">
          ${fld(po ? L('Reference', 'Referenz') : ord ? L('Order number', 'Auftragsnummer') : L('Offer number', 'Angebotsnummer'), o.id)}${fld(L('Customer', 'Kunde'), `${c.code}  ${o.customer}`)}
          ${fld(L('Contact', 'Ansprechpartner'), c.contact)}${fld(L('Ship to', 'Lieferwerk'), `${c.city} · DE`)}
          ${fld('Incoterm', 'FCA Hamburg', ['FCA Hamburg', 'DAP ' + c.city, 'EXW Hamburg'])}${fld(L('Payment terms', 'Zahlungsbedingungen'), L('30 days net', '30 Tage netto'), [L('30 days net', '30 Tage netto'), L('14 days 2 % discount', '14 Tage 2 % Skonto'), L('60 days net', '60 Tage netto')])}
          ${fld(L('Issue date', 'Ausstellungsdatum'), short(NOW))}${fld(L('Valid until', 'Gültig bis'), short(new Date(+NOW + 14 * 864e5)))}
          ${fld(L('Currency', 'Währung'), 'EUR')}${po ? fld(L('Tiers', 'Staffeln'), '1 / 3 / 5 t') : fld(L('Total quantity', 'Gesamtmenge'), tons(o.ms.reduce((a, m) => a + m.qty, 0)))}
          ${po ? '' : fld(L('Total value', 'Gesamtwert'), eur(o.value))}</div></details>
        ${po ? '' : `<details class="bfa-sec ae-lines" open><summary>${L('Lines', 'Positionen')} (${o.ms.length})${ph('caret-down')}</summary>${o.ms.map(m => { const fl = m.cost / .95, ch2 = Math.abs(m.s.price - m.list) > .001; return `<div class="ae-lrow ${m.s.price < fl ? 'low' : ''}">
          <span class="g"><b>${esc(m.s.grade)}</b><small>${tons(m.qty)} · ${!m.s.week ? `<i class="av ok">${L('in stock', 'ab Lager')}</i>` : `<i class="av ${m.onTime ? 'info' : 'warn'}">${L('inbound', 'Zulauf')} ${wk(m.s.week)}</i>`}</small></span>
          <label class="pr"><input type="number" step="0.01" min="0" inputmode="decimal" value="${m.s.price.toFixed(2)}" data-price="${o.id}|${esc(m.s.grade)}" ${sent || ord ? 'disabled' : ''} aria-label="${esc(L(`Price per kg for ${m.s.grade}`, `Preis pro kg für ${m.s.grade}`))}"><span>€/kg</span></label>
          <em>${eur(m.value)}</em>
          <small class="hint">${L('List', 'Liste')} ${nf(m.list, 2)} · ${L('floor', 'Untergrenze')} ${nf(fl, 2)} · ${L('margin', 'Marge')} ${nf((m.s.margin || 0) * 100, 1)} %${ch2 ? ` · <b>${L('changed', 'geändert')}</b>` : ''}</small></div>`; }).join('')}
          ${!sent && !ord ? `<p class="ae-lnote">${ph('pencil-simple')}${L('Change a price and the document, the total, the checks and the email follow at once.', 'Preis ändern: Dokument, Summe, Prüfung und E-Mail passen sich sofort an.')}</p>` : ''}</details>`}`
        : `${AE ? `<div class="bfa-gemi"><div class="gh">${ph('sparkle')}<b>${L('AI summary', 'KI-Zusammenfassung')}</b>${conf(o.conf)}<span class="nx">${L('Next', 'Nächster Schritt')}: <b>${esc(next)}</b></span></div><p>${esc(summary)}</p></div>${AE.sourceBrief(o)}` : ''}<div class="bfa-val ${o.warn ? 'has-warn' : ''}"><div class="vh">${ph('shield-check')}<b>${ord ? L('Checks before the order', 'Prüfung vor Auftrag') : L('Pre-send validation', 'Prüfung vor Versand')}</b><span class="vc"><i class="p"></i>${o.checks.length - o.warn} ${L('pass', 'ok')}<i class="w"></i>${o.warn} ${L('warn', 'Warnung')}<i class="f"></i>0 ${L('fail', 'Fehler')}</span></div>
          ${o.checks.map(c => `<div class="vrow ${c.s}">${ph(c.s === 'pass' ? 'check-circle' : 'warning-circle')}<span>${esc(c.t)}</span><b>${c.s === 'pass' ? 'PASS' : 'WARN'}</b></div>`).join('')}</div>
        ${AE ? `<details class="bfa-sec"><summary>${L('Order overview', 'Auftragsübersicht')}${ph('caret-down')}</summary><div class="bfa-fgrid">
          <label>${L('Requested', 'Angefragt')}<input value="${tons(need)}" readonly></label><label>${L('Covered', 'Gedeckt')}<input value="${tons(got)} · ${tons(stock)} ${L('from stock', 'ab Lager')}" readonly></label>
          <label>${L('Earliest need', 'Frühester Bedarf')}<input value="${wk(Math.min(...o.demand.map(d => d.week)))}" readonly></label><label>${L('Contact', 'Ansprechpartner')}<input value="${esc(c.contact)}" readonly></label></div></details>` : ''}
        <details class="bfa-sec" open><summary>${ord ? L('Order header', 'Auftragskopf') : L('Offer header', 'Angebotskopf')}${ph('caret-down')}</summary><div class="bfa-fgrid">
          <label>${ord ? L('Order number', 'Auftragsnummer') : L('Offer number', 'Angebotsnummer')}<input value="${o.id}" readonly></label><label>${L('Customer', 'Kunde')}<input value="${esc(c.code)} · ${esc(o.customer)}" readonly></label>
          <label>Incoterm<input value="FCA Hamburg"></label><label>${L('Payment terms', 'Zahlungsbedingungen')}<input value="${L('30 days net', '30 Tage netto')}"></label>
          <label>${L('Valid until', 'Gültig bis')}<input value="${short(new Date(+NOW + 14 * 864e5))}"></label><label>${L('Currency', 'Währung')}<input value="EUR"></label></div></details>
        <details class="bfa-sec"><summary>${L('Lines', 'Positionen')} (${o.ms.length})${ph('caret-down')}</summary>${o.ms.map(m => `<div class="bfa-lrow"><b>${esc(m.s.grade)}</b><span>${tons(m.qty)} · ${nf(m.s.price, 2)} €/kg · ${!m.s.week ? `<i class="av ok">${L('in stock', 'ab Lager')}</i>` : `<i class="av ${m.onTime ? 'info' : 'warn'}">${L('inbound', 'Zulauf')} ${wk(m.s.week)}</i>`}</span><em>${eur(m.value)}</em></div>`).join('')}</details>
        <details class="bfa-sec"><summary>${L('Margin', 'Marge')}${ph('caret-down')}</summary><div class="bfa-lrow"><b>${L('Margin', 'Marge')}</b><span>${nf(o.value ? o.margin / o.value * 100 : 0, 1)} %</span><em>${eur(o.margin)}</em></div></details>`;
      else if (st.oTab === 'demand') pane = (AE ? AE.offerSource(o) + `<h6 class="bfa-subh">${L('Demand lines', 'Bedarfspositionen')}</h6>` : '') + o.demand.map(d => { const m = o.msgs.find(x => x.lines.includes(d)); return `<div class="bfa-dcard"><div class="dt">${ch(d.channel).icon()}<b>${esc(d.material)}</b>${d.approved ? chip('c-lock', L('Approved grade', 'Freigegebene Type'), ph('lock-simple')) : ''}<em>${tons(d.qty)}</em></div>
          <div class="dm"><span>${L('Wanted', 'Gewünscht')}: ${esc(d.grade || L('any equivalent', 'beliebig gleichwertig'))}</span><span>${L('Needed', 'Bedarf')}: ${wk(d.week)}</span><span>${L('Covered', 'Gedeckt')}: ${tons(d.matched)}</span></div>
          ${m ? `<blockquote>${esc(body(m).split('\n').find(x => x.includes(d.material.split(' ')[0])) || preview(m))}</blockquote><button class="lnk" data-act="msg" data-id="${m.id}">${L('Open source message', 'Quellnachricht öffnen')} ${ph('arrow-up-right')}</button>` : ''}</div>`; }).join('') + `<div class="bfa-dtot"><span>${L('Total demand', 'Bedarf gesamt')}</span><b>${tons(o.demand.reduce((a, d) => a + d.qty, 0))}</b></div>`;
      else if (st.oTab === 'log') {
        const m0 = o.msgs[o.msgs.length - 1] || o.msgs[0], t0 = m0 ? m0.at : NOW;
        const ev = [[t0, ch(m0?.channel || 'email').icon(), L(`Message received via ${ch(m0?.channel || 'email').name}`, `Nachricht eingegangen über ${ch(m0?.channel || 'email').name}`), o.customer],
          [new Date(+t0 + 40e3), ph('sparkle'), L(`AI extracted ${o.demand.length} demand line${o.demand.length > 1 ? 's' : ''}`, `KI hat ${o.demand.length} Bedarf${o.demand.length > 1 ? 'e' : ''} extrahiert`), L(`Confidence ${o.conf} %`, `Konfidenz ${o.conf} %`)],
          [new Date(+t0 + 65e3), ph('arrows-merge'), L(`Matched to ${[...new Set(o.ms.map(m => m.s.grade))].join(', ')}`, `Abgeglichen mit ${[...new Set(o.ms.map(m => m.s.grade))].join(', ')}`), L('SAP stock and inbound ETAs', 'SAP-Bestand und Zulauf-ETAs')],
          [new Date(+t0 + 90e3), ph('file-text'), L('Offer and email drafted', 'Angebot und E-Mail entworfen'), L(`Pre-send: ${o.warn} warning${o.warn === 1 ? '' : 's'}`, `Vor Versand: ${o.warn} Warnung${o.warn === 1 ? '' : 'en'}`)],
          ...(sent ? [[NOW, ph('paper-plane-tilt'), L('Approved and sent by Lena Hoffmann', 'Freigegeben und gesendet von Lena Hoffmann'), `einkauf@${c.domain}`]] : []),
          ...(rej ? [[NOW, ph('x-circle'), L(`Rejected: ${model.reasons[o.id]}`, `Abgelehnt: ${model.reasons[o.id]}`), L('Feedback goes into shared memory', 'Feedback fließt ins gemeinsame Wissen')]] : [])];
        pane = `<ol class="bfa-log">${ev.map(([t, ic, a, b]) => `<li><span class="ic">${ic}</span><span><b>${esc(a)}</b><small>${esc(b)}</small></span><time>${when(t)}</time></li>`).join('')}</ol>`;
      } else { const om = offerMail(o), sentAt = AE?.sentAt?.(o.id); pane = sent && AE ? `<div class="bfa-ai sent">${ph('paper-plane-tilt')}<span><b>${L('Sent email', 'Gesendete E-Mail')}</b>${sentAt ? L(`Went out on ${short(sentAt)} with the offer attached.`, `Am ${short(sentAt)} mit dem Angebot im Anhang rausgegangen.`) : ''}</span></div>` : `<div class="bfa-ai">${ph('sparkle')}<span><b>${L('Draft email', 'E-Mail-Entwurf')}</b>${L('Reviewed before it goes out. Edit anything, then send.', 'Wird vor dem Versand geprüft. Alles lässt sich bearbeiten, dann senden.')}</span></div>
          <div class="bfa-mail"><div class="mh"><span>${L('To', 'An')}</span><b>einkauf@${c.domain}</b></div><div class="mh"><span>${L('Subject', 'Betreff')}</span><b>${esc(om.subj)}</b></div>
          <div class="mb" contenteditable="${!sent}" spellcheck="false">${esc(om.body).replace(/\n/g, '<br>')}</div>
          <div class="ma">${ph('file-pdf')}${o.id}.pdf · 84 KB</div></div>`; }
      return `<div class="bfa-detail">
        <div class="bfa-dh"><button class="bfa-ic" data-act="back" aria-label="Back">${ph('arrow-left')}</button><h3>${o.id}</h3>${statusChip(o.status)}${o.priceOnly ? chip('c-cat', L('Price inquiry', 'Preisanfrage')) : late ? chip('c-warn', L('Late line', 'Späte Position')) : chip('c-ok', L('On track', 'Im Plan'))}
          ${AE ? '' : `<span class="srcs"><small>${L('DATA SOURCES', 'DATENQUELLEN')}</small>${chip('c-src', 'SAP S/4', logo('sap', '#0FAAFF'))}${dsrc.map(k => chip('c-src', ch(k).name, ch(k).icon())).join('')}${chip('c-src', AE ? L('AI knowledge', 'KI-Wissen') : L('Shared memory', 'Gemeinsames Wissen'), ph('brain'))}</span>`}</div>${AE ? `<div class="bfa-dsbar"><small>${L('DATA SOURCES', 'DATENQUELLEN')}</small>${['SAP / S4', L('Master data', 'Stammdaten'), ...dsrc.map(k => ch(k).name), L('AI computed', 'KI berechnet')].map(x => `<span>${ph('info')}${esc(x)}</span>`).join('')}</div>` : ''}
        <div class="bfa-split"><div class="bfa-docwrap">${doc}</div>
          <div class="bfa-pane"><div class="bfa-ptabs">${tabs.map(([k, l, n]) => `<button class="${st.oTab === k ? 'on' : ''}" data-act="otab" data-id="${k}">${l}${n ? `<em>${n}</em>` : ''}</button>`).join('')}</div><div class="bfa-pbody">${pane}</div>
          <div class="bfa-pfoot">${AE?.offerFoot(o) || (sent ? `<span class="done">${ph('check-circle')}${L('Sent to', 'Gesendet an')} einkauf@${c.domain}</span>` : rej ? `<span class="done rej">${ph('x-circle')}${L('Rejected', 'Abgelehnt')}: ${esc(model.reasons[o.id])}</span><button class="bfa-btn" data-act="reopen" data-id="${o.id}">${L('Reopen', 'Wieder öffnen')}</button>`
            : `<button class="bfa-btn" data-act="save" data-id="${o.id}">${ph('floppy-disk')}${L('Save draft', 'Entwurf speichern')}</button><button class="bfa-btn danger" data-act="reject" data-id="${o.id}">${ph('x')}${L('Reject', 'Ablehnen')}</button><button class="bfa-btn primary" data-act="send" data-id="${o.id}">${ph('paper-plane-tilt')}${L('Send to customer', 'An Kunden senden')}</button>`)}</div></div></div></div>`;
    }

    function linesView() {
      const c = D.customers.find(x => x.name === st.linesFor);
      return `<div class="bfa-dh"><button class="bfa-ic" data-act="back" aria-label="Back">${ph('arrow-left')}</button><h3>${esc(st.linesFor)}</h3>${c ? segChip(c.seg) : ''}<span class="srcs"><small>${c?.code || ''} · ${esc(c?.city || '')}</small></span></div>
        ${tiles([[c?.lines || 0, L('Match lines', 'Match-Positionen')], [c?.offer ? eur(c.offer.value) : '-', L('Offer value', 'Angebotswert')], [tons(c?.gap || 0), L('Not covered', 'Nicht gedeckt')], [c?.offer ? STATUS()[c.offer.status][0] : '-', 'Status']])}
        ${matchLinesTable(st.linesFor)}`;
    }

    // ---------------- drawer (message)
    function drawer() {
      const m = D.msgs.find(x => x.id === st.drawer); if (!m) return '';
      const c = meta(m.customer), o = D.offers.find(x => x.customer === m.customer);
      const tabs = [['msg', L('Message', 'Nachricht')], ['sum', L('AI summary', 'KI-Zusammenfassung')], ['ext', L('Extracted demand', 'Extrahierter Bedarf'), m.lines.length], ['att', L('Attachments', 'Anhänge')]];
      let pane = '';
      const aiCard = `<div class="bfa-ai">${ph('sparkle')}<span><b>${L('AI summary', 'KI-Zusammenfassung')} ${conf(m.conf)}</b>${esc(L(`${m.lines.length} demand line${m.lines.length > 1 ? 's' : ''}: ${preview(m)}.${m.lines.some(l => l.approved) ? ' Approved grade, no substitute.' : ''}`, `${m.lines.length} Bedarf${m.lines.length > 1 ? 'e' : ''}: ${preview(m)}.${m.lines.some(l => l.approved) ? ' Freigegebene Type, kein Ersatz.' : ''}`))}</span></div>`;
      if (st.drawerTab === 'msg') pane = `${aiCard}<div class="bfa-bubble ${m.channel}"><div class="bh">${ch(m.channel).icon()}<b>${esc(c.contact || m.customer)}</b><small>${when(m.at)}</small>${chip('c-cat', CAT()[m.cat])}</div><p>${esc(body(m)).replace(/\n/g, '<br>')}</p></div>`;
      else if (st.drawerTab === 'sum') pane = `${aiCard}<ul class="bfa-facts"><li><span>${L('Customer', 'Kunde')}</span><b>${esc(m.customer)}</b></li><li><span>${L('Intent', 'Absicht')}</span><b>${CAT()[m.cat]}</b></li><li><span>${L('Urgency', 'Dringlichkeit')}</span><b>${Math.min(...m.lines.map(l => l.week)) <= 2 ? L('High', 'Hoch') : L('Normal', 'Normal')}</b></li><li><span>${L('Memory used', 'Genutztes Wissen')}</span><b>${L('"KW" is the ISO week', '„KW“ ist die ISO-Woche')}</b></li></ul>`;
      else if (st.drawerTab === 'ext') pane = m.lines.map(l => `<div class="bfa-dcard"><div class="dt"><b>${esc(l.material)}</b>${l.approved ? chip('c-lock', L('Approved grade', 'Freigegebene Type'), ph('lock-simple')) : ''}<em>${tons(l.qty)}</em></div><div class="dm"><span>${esc(l.grade || L('any equivalent', 'beliebig gleichwertig'))}</span><span>${wk(l.week)}</span><span>${L('Covered', 'Gedeckt')} ${tons(l.matched)}</span></div></div>`).join('');
      else pane = m.channel === 'email' ? `<div class="bfa-att">${ph('file-pdf')}<span><b>${L('Drawing', 'Zeichnung')}_${c.code}.pdf</b><small>212 KB</small></span></div>` : empty('paperclip', L('No attachments', 'Keine Anhänge'), '');
      return `<div class="bfa-scrim" data-act="closedrawer"></div><aside class="bfa-drawer ${st.fresh ? 'enter' : ''}">
        <div class="dh"><div><h4>${esc(subject(m))}</h4><small>${L('From', 'Von')}: ${esc(c.contact || m.customer)} · ${ch(m.channel).name}</small></div><button class="bfa-ic" data-act="closedrawer" aria-label="Close">${ph('x')}</button></div>
        <div class="bfa-ptabs">${tabs.map(([k, l, n]) => `<button class="${st.drawerTab === k ? 'on' : ''}" data-act="dtab" data-id="${k}">${l}${n ? `<em>${n}</em>` : ''}</button>`).join('')}</div>
        <div class="db">${pane}</div>
        <div class="df">${o ? `<button class="bfa-btn primary" data-act="offer" data-id="${o.id}">${ph('file-text')}${o.status === 'new' ? L('Draft offer', 'Angebot entwerfen') : L('Open offer', 'Angebot öffnen')}</button>` : `<button class="bfa-btn" data-act="nav" data-id="actions">${L('Source the gap', 'Inventar zu beschaffen')}</button>`}</div>
      </aside>`;
    }

    // ---------------- modals
    function modal() {
      if (!st.modal) return '';
      let inner = '';
      if (st.modal === 'new') inner = `<div class="mh"><h4>${L('New offer', 'Neues Angebot')}</h4><small>${L('How would you like to start?', 'Wie möchten Sie beginnen?')}</small><button class="bfa-ic" data-act="closemodal">${ph('x')}</button></div>
        <div class="bfa-choice"><button data-act="newsingle">${ph('file-plus')}<b>${L('Single offer', 'Einzelangebot')}</b><span>${L('One customer, one or more lines. The AI fills in grade, price and dates.', 'Ein Kunde, eine oder mehrere Positionen. Die KI ergänzt Type, Preis und Termine.')}</span></button>
        <label>${ph('upload-simple')}<b>${L('Bulk upload', 'Massen-Upload')}</b><span>${L('Upload an Excel or CSV with many demand lines at once.', 'Excel- oder CSV-Datei mit vielen Bedarfen auf einmal hochladen.')}</span><input type="file" accept=".xlsx,.xls,.csv" hidden data-act="bulk"></label></div>`;
      else if (st.modal === 'single') inner = `<div class="mh"><h4>${L('Single offer', 'Einzelangebot')}</h4><button class="bfa-ic" data-act="closemodal">${ph('x')}</button></div>
        <div class="bfa-fgrid one"><label>${L('Customer', 'Kunde')}<select data-f="customer">${D.customers.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></label>
        <label>${L('Material or grade', 'Werkstoff oder Type')}<input data-f="material" value="PC/ABS V-0 black"></label>
        <label>${L('Quantity (t)', 'Menge (t)')}<input data-f="qty" value="8" inputmode="decimal"></label><label>${L('Needed in weeks', 'Bedarf in Wochen')}<input data-f="week" value="3" inputmode="numeric"></label></div>
        <div class="mf"><button class="bfa-btn" data-act="closemodal">${L('Cancel', 'Abbrechen')}</button><button class="bfa-btn primary" data-act="createsingle">${ph('sparkle')}${L('Match and draft', 'Matchen und entwerfen')}</button></div>`;
      else if (st.modal === 'reject') inner = `<div class="mh"><h4>${L('Why reject?', 'Warum ablehnen?')}</h4><small>${L('The reason trains the shared memory.', 'Der Grund trainiert das gemeinsame Wissen.')}</small><button class="bfa-ic" data-act="closemodal">${ph('x')}</button></div>
        <div class="bfa-reasons">${[L('Price too high for this customer', 'Preis zu hoch für diesen Kunden'), L('Wrong grade or material', 'Falsche Type oder Werkstoff'), L('Customer already covered', 'Kunde bereits versorgt'), L('Timing does not work', 'Termin passt nicht'), L('Customer is on hold', 'Kunde ist gesperrt')].map(r => `<button data-act="rejectwhy" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>`;
      else if (st.modal === 'sendready') { const ready = D.offers.filter(o => o.status === 'ready'); inner = `<div class="mh"><h4>${L(`Send ${ready.length} offers?`, `${ready.length} Angebote senden?`)}</h4><small>${L('Every one passed all pre-send checks. They go out the moment you approve.', 'Alle haben jede Prüfung bestanden. Sie gehen raus, sobald Sie freigeben.')}</small><button class="bfa-ic" data-act="closemodal">${ph('x')}</button></div>
        <div class="bfa-sendlist">${ready.map(o => `<div>${ph('check-circle')}<b>${esc(o.customer)}</b><span>${o.ms.length} ${L('lines', 'Pos.')} · ${eur(o.value)}</span></div>`).join('')}</div>
        <div class="mf"><button class="bfa-btn" data-act="closemodal">${L('Not now', 'Nicht jetzt')}</button><button class="bfa-btn primary" data-act="sendall">${ph('paper-plane-tilt')}${L('Approve and send', 'Freigeben und senden')}</button></div>`; }
      else if (st.modal === 'memo') { const r = st.memo === 'new' ? ['', L('Customer', 'Kunde'), '', 0, 0, 0, 0] : MEMORY()[st.memo]; inner = `<div class="mh"><h4>${st.memo === 'new' ? L('Add memory', 'Wissen hinzufügen') : L('Memory details', 'Wissensdetails')}</h4><button class="bfa-ic" data-act="closemodal">${ph('x')}</button></div>
        <div class="bfa-ptabs"><button class="on">${L('Edit details', 'Details bearbeiten')}</button><button data-act="toast" data-msg="${esc(L('Version 3 · edited by Lena Hoffmann, 2 days ago', 'Version 3 · bearbeitet von Lena Hoffmann, vor 2 Tagen'))}">${L('Version history', 'Versionen')}</button></div>
        <div class="bfa-fgrid one"><label>${L('Memory title', 'Titel')}<input value="${esc(r[0])}"></label><label>${L('Category', 'Kategorie')}<input value="${esc(r[1])}"></label><label>${L('Scope', 'Geltung')}<input value="${esc(r[2])}"></label>
        <label>${L('Memory details', 'Details')}<textarea rows="3">${esc(L('The AI applies this when it reads messages and drafts offers.', 'Die KI wendet dies an, wenn sie Nachrichten liest und Angebote entwirft.'))}</textarea></label></div>
        <div class="bfa-backtest"><span>${ph('clock-counter-clockwise')}<b>Backtest</b><small>${L('Replays past messages with this memory and compares the result.', 'Spielt vergangene Nachrichten mit diesem Wissen erneut ab und vergleicht das Ergebnis.')}</small></span>
          ${st.backtest === 0 ? `<button class="bfa-btn sm" data-act="backtest">${L('Run backtest', 'Backtest starten')}</button>` : st.backtest < 100 ? `<span class="bt-run"><i style="width:${st.backtest}%"></i></span>` : `<b class="bt-ok">${L('412 messages · 97 % agree · 3 improved', '412 Nachrichten · 97 % gleich · 3 verbessert')}</b>`}</div>
        <div class="mf"><button class="bfa-btn" data-act="closemodal">${L('Cancel', 'Abbrechen')}</button><button class="bfa-btn" data-act="closemodal">${L('Save as draft', 'Als Entwurf')}</button><button class="bfa-btn primary" data-act="memosave">${L('Save changes', 'Änderungen speichern')}</button></div>`; }
      return `<div class="bfa-overlay" data-act="closemodal"></div><div class="bfa-modal" role="dialog">${inner}</div>`;
    }

    // ---------------- tour
    const TOURS = () => ({ cockpit: TOUR(), ...(AE ? AE.tour() : {}) });
    const TOUR = () => [
      ['tabs', L('Three ways to work', 'Drei Arbeitsweisen'), L('Switch between customers, single match lines and the messages behind them, all for the same offers.', 'Wechseln Sie zwischen Kunden, einzelnen Match-Positionen und den Nachrichten dahinter, alles für dieselben Angebote.')],
      ['autopilot', 'AutoPilot', L('Turn it on and the AI reads every message, matches stock and drafts the offer. Nothing goes out without your click.', 'Einschalten: Die KI liest jede Nachricht, gleicht den Bestand ab und entwirft das Angebot. Ohne Ihren Klick geht nichts raus.')],
      ['new', L('Create an offer', 'Angebot erstellen'), L('Start from a demand line, a customer or a blank offer. The AI fills in everything it can.', 'Starten Sie mit einem Bedarf, einem Kunden oder einem leeren Angebot. Die KI füllt aus, was sie kann.')],
      ['tiles', L('Live status at a glance', 'Live-Status auf einen Blick'), L('How many offers are drafted, waiting for you and already with the customer.', 'Wie viele Angebote entworfen sind, auf Sie warten und schon beim Kunden liegen.')],
      ['filters', L('Find anything fast', 'Alles schnell finden'), L('Search by customer, grade or demand reference, and narrow by status and source.', 'Suchen Sie nach Kunde, Type oder Bedarfsreferenz und filtern Sie nach Status und Quelle.')],
    ];
    function tour() {
      const steps = TOURS()[st.page];
      if (st.tour < 0 || !steps || st.offer || st.linesFor || st.cust || st.case) return '';
      const [anchor, title, text] = steps[st.tour], n = steps.length;
      return `<div class="bfa-tour" data-anchor="${anchor}"><div class="spot"></div><div class="pop"><button class="bfa-ic x" data-act="tourend">${ph('x')}</button><b>${title}</b><p>${text}</p>
        <div class="tf"><span class="dots">${Array.from({ length: n }, (_, i) => `<i class="${i === st.tour ? 'on' : ''}"></i>`).join('')}</span>${st.tour ? `<button class="bfa-btn sm" data-act="tourprev">${L('Prev', 'Zurück')}</button>` : ''}<button class="bfa-btn sm primary" data-act="tournext">${st.tour === n - 1 ? L('Done', 'Fertig') : L('Next', 'Weiter')}${st.tour === n - 1 ? '' : ph('caret-right')}</button></div></div></div>`;
    }
    function placeTour() {
      const t = root.querySelector('.bfa-tour'); if (!t) return;
      const a = root.querySelector(`[data-tour="${t.dataset.anchor}"]`);
      if (!a) { st.tour = -1; t.remove(); return; } // the step's target is gone: end the tour instead of leaving the app dimmed
      const r0 = root.getBoundingClientRect(), r = a.getBoundingClientRect(), pad = 6;
      const spot = t.querySelector('.spot'), pop = t.querySelector('.pop');
      Object.assign(spot.style, { left: `${r.left - r0.left - pad}px`, top: `${r.top - r0.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
      const pw = 300, below = r.bottom - r0.top + 14;
      let left = Math.min(Math.max(12, r.left - r0.left + r.width / 2 - pw / 2), r0.width - pw - 12);
      if (r.right - r0.left > r0.width - 120) left = r.right - r0.left - pw;
      // no room below (the role switcher sits at the bottom): open above the target
      const top = below + pop.offsetHeight > r0.height - 12 ? Math.max(12, r.top - r0.top - pop.offsetHeight - 14) : below;
      Object.assign(pop.style, { left: `${left}px`, top: `${top}px` });
    }

    // ---------------- render
    function content() {
      if (st.offer) return offerDetail();
      const ae = AE?.content(); if (ae) return ae;
      if (st.linesFor) return linesView();
      return ({ cockpit, inbox, calls, lines: demandLines, docs: docsPage, prices: pricesPage, allot: allotPage, entities: entitiesPage, offers: offersPage, followup: followups, stock: () => stockPage(false), inbound: () => stockPage(true), alloc: allocPage, actions: actionsPage, memory: memoryPage, kpis: kpisPage, integrations: integrationsPage, master: masterPage, settings: settingsPage }[st.page] || cockpit)();
    }
    AE = window.BFAE ? window.BFAE({ st, model, L, lang, esc, ph, nf, eur, eurK, tons, wk, when, short, hash, NOW, E, S, reduced, chip, statusChip, tiles, empty, segChip, chTag, ch, meta, conf, logo, glyph, search, subject,
      body: m => body(m), offerMail: o => offerMail(o), fam: x => fam(x), memory: () => MEMORY(),
      personal: (t, c) => personal(t, c), offerDoc: o => offerDoc(o), offerOf: m => offerOf(m), docRequests: () => docRequests(), tightFamilies: () => tightFamilies(), priceNotices: () => priceNotices(), go: (p, x) => go(p, x), render: a => render(a), emit: () => emit(), toast: m => toast(m),
      get D() { return D; } }) : null;

    let lastPage = '';
    function render(animate) {
      if (!D) D = derive();
      const sc = root.querySelector('.bfa-content'), keep = sc && lastPage === pageKey() ? sc.scrollTop : 0;
      const anim = animate || lastPage !== pageKey();
      root.innerHTML = `${sidebar()}<div class="bfa-main">${header()}<div class="bfa-content ${anim ? 'anim' : ''}">${content()}</div></div>${drawer()}${AE ? AE.overlays() : ''}${modal()}${tour()}<div class="bfa-toasts">${st.toasts.map(t => toastHtml(t)).join('')}</div>`;
      AE?.after(root);
      const nc = root.querySelector('.bfa-content'); if (nc && keep) nc.scrollTop = keep;
      lastPage = pageKey();
      st.fresh = false;
      if (st.tour >= 0) requestAnimationFrame(placeTour);
    }
    const pageKey = () => `${st.page}|${st.offer}|${st.linesFor}|${st.tab}|${st.inboxTab}|${st.cust}|${st.case}|${st.push}`;
    // toasts live outside the render cycle so they never replay the page animations
    const toastHtml = t => `<div class="bfa-toast${t.shown ? ' shown' : ''}" data-t="${t.id}">${ph('check-circle')}<span>${esc(t.m)}</span></div>`;
    const toast = m => {
      const t = { m, id: String(Math.random()).slice(2) }; st.toasts.push(t);
      root.querySelector('.bfa-toasts')?.insertAdjacentHTML('beforeend', toastHtml(t)); t.shown = true;
      setTimeout(() => { st.toasts = st.toasts.filter(x => x !== t); root.querySelector(`.bfa-toast[data-t="${t.id}"]`)?.remove(); }, 3200);
    };

    // ---------------- actions
    async function autopilotRun() {
      const todo = D.offers.filter(o => o.status === 'new' || o.status === 'review');
      for (const o of todo) {
        if (!model.autopilot) break;
        model.status[o.id] = o.warn ? 'review' : 'ready';
        emit(); await new Promise(r => setTimeout(r, reduced ? 0 : 260));
      }
    }
    root.addEventListener('click', e => {
      if (opts.mini) return;
      const el = e.target.closest('[data-act]');
      if (!el || !root.contains(el)) { if (st.menu) { st.menu = null; render(); } return; }
      const act = el.dataset.act, id = el.dataset.id;
      if (!['menu', 'fstatus', 'fsrc'].includes(act) && st.menu) st.menu = null;
      if (AE?.act(act, id, el)) return;
      switch (act) {
        case 'nav': go(id, { linesFor: null, cust: null, case: null, q: '', tour: -1 }); break;
        case 'grp': st.collapsed.has(id) ? st.collapsed.delete(id) : st.collapsed.add(id); render(); break;
        case 'tab': st.tab = id; st.q = st.q; render(true); break;
        case 'itab': st.inboxTab = id; render(true); break;
        case 'menu': st.menu = st.menu === id ? null : id; st.tour = -1; render(); break;
        case 'region': st.menu = null; toast(L(`Region switched to ${el.innerText.trim()} (demo data stays the same)`, `Region auf ${el.innerText.trim()} umgestellt (Demo-Daten bleiben gleich)`)); break;
        case 'setlang': st.menu = null; document.querySelector(`.lang button[data-lang="${el.dataset.v}"]`)?.click(); break;
        case 'fcust': st.fCust = el.dataset.v; st.menu = null; render(); break;
        case 'fseg': st.fSeg = el.dataset.v; st.menu = null; render(); break;
        case 'fstatus': { const v = el.dataset.v; st.fStatus.has(v) ? st.fStatus.delete(v) : st.fStatus.add(v); render(); break; }
        case 'fsrc': { const v = el.dataset.v; st.fSource.has(v) ? st.fSource.delete(v) : st.fSource.add(v); render(); break; }
        case 'sort': st.sort = [id, st.sort[0] === id ? -st.sort[1] : -1]; render(); break;
        case 'lines': st.linesFor = id; st.drawer = null; render(true); break;
        case 'offer': st.offer = id; st.oTab = 'details'; st.drawer = null; st.tour = -1; render(true); break;
        case 'back': if (st.offer) st.offer = null; else if (st.case) st.case = null; else if (st.cust) st.cust = null; else if (st.push) st.push = null; else st.linesFor = null; render(true); break;
        case 'otab': st.oTab = id; render(); break;
        case 'msg': st.drawer = id; st.drawerTab = 'msg'; st.fresh = true; model.seen.add(id); render(); break;
        case 'dtab': st.drawerTab = id; render(); break;
        case 'closedrawer': st.drawer = null; render(); break;
        case 'draft': { const o = D.offers.find(x => x.id === id); model.status[id] = 'review'; emit(); toast(L(`Offer ${id} drafted for ${o.customer.replace(/ GmbH.*/, '')}`, `Angebot ${id} für ${o.customer.replace(/ GmbH.*/, '')} entworfen`)); break; }
        case 'autopilot': model.autopilot = !model.autopilot; emit(); if (model.autopilot) { toast(L('AutoPilot on: drafting and validating. Sending stays with you.', 'AutoPilot an: entwirft und prüft. Senden bleibt bei Ihnen.')); autopilotRun(); } break;
        case 'sendready': st.modal = 'sendready'; render(); break;
        case 'sendall': { const r = D.offers.filter(o => o.status === 'ready'); r.forEach(o => { model.status[o.id] = 'sent'; AE?.onSent(o.id); }); st.modal = null; emit(); toast(L(`${r.length} offers approved and sent`, `${r.length} Angebote freigegeben und gesendet`)); break; }
        case 'send': model.status[id] = 'sent'; { const f = AE?.onSent(id); emit(); toast(L('Offer approved and sent to the customer', 'Angebot freigegeben und an den Kunden gesendet') + (f ? ` ${f}` : '')); } break;
        case 'save': toast(L('Draft saved', 'Entwurf gespeichert')); break;
        case 'reject': st.modal = 'reject'; st.rejectId = id; render(); break;
        case 'rejectwhy': model.status[st.rejectId] = 'rejected'; model.reasons[st.rejectId] = el.dataset.v; st.modal = null; emit(); toast(AE ? L('Rejected. The AI learns from the reason.', 'Abgelehnt. Die KI lernt aus dem Grund.') : L('Rejected. The reason goes into shared memory.', 'Abgelehnt. Der Grund fließt ins gemeinsame Wissen.')); break;
        case 'reopen': model.status[id] = 'review'; emit(); break;
        case 'newoffer': st.modal = 'new'; render(); break;
        case 'newsingle': st.modal = 'single'; render(); break;
        case 'createsingle': {
          const f = k => root.querySelector(`.bfa-modal [data-f="${k}"]`)?.value || '';
          const customer = f('customer'), qty = Math.round(E.num(f('qty')) * 1000), week = Math.max(0, Math.round(E.num(f('week'))));
          if (!qty) break;
          model.extra.push({ customer, material: f('material'), grade: '', producer: '', qty, week, alternatives: true, approved: false, never: '', channel: 'manual', origin: `manual:${Date.now()}`, at: Date.now(), conf: 99 });
          st.modal = null; emit();
          const o = D.offers.find(x => x.customer === customer);
          if (o) { model.status[o.id] = 'review'; emit(); st.offer = o.id; st.oTab = 'details'; render(true); }
          toast(o ? L('Matched and drafted', 'Gematcht und entworfen') : L('Added. No stock fits yet, see Open actions.', 'Hinzugefügt. Noch kein passender Bestand, siehe Offene Aktionen.'));
          break;
        }
        case 'closemodal': if (e.target === el || el.tagName === 'BUTTON') { st.modal = null; st.backtest = 0; render(); } break;
        case 'memo': st.modal = 'memo'; st.memo = id === 'new' ? 'new' : +id; st.backtest = 0; render(); break;
        case 'memosave': st.modal = null; toast(L('Memory saved. AutoPilot uses it from the next message.', 'Gespeichert. AutoPilot nutzt es ab der nächsten Nachricht.')); break;
        case 'backtest': { const tick = () => { st.backtest = Math.min(100, st.backtest + 9); render(); if (st.backtest < 100 && st.modal === 'memo') setTimeout(tick, 90); }; tick(); break; }
        case 'livecall': window.LiveCall?.open(); break;
        case 'docsend': model.docsSent.add(id); render(); toast(L('Document sent with the approved answer', 'Dokument mit freigegebener Antwort gesendet')); break;
        case 'docask': model.docsSent.add(id); render(); toast(L('Request to the producer drafted for your approval', 'Anfrage an den Hersteller zur Freigabe entworfen')); break;
        case 'reprice': { const p = priceNotices().find(x => x.id === id); model.repriced.add(id); render(); toast(L(`${p.offers.length} offers repriced, customer notices drafted`, `${p.offers.length} Angebote neu bepreist, Kundeninfos entworfen`)); break; }
        case 'allotok': model.allotted.add(id); render(); toast(L(`Allocation for ${id} approved and sent to sales`, `Allokation ${id} freigegeben und an den Vertrieb gegeben`)); break;
        case 'refresh': emit(); toast(L('Synced with SAP, Biesterfeld CRM and the inbox', 'Mit SAP, Biesterfeld CRM und Posteingang synchronisiert')); break;
        case 'toast': toast(el.dataset.msg); break;
        case 'flip': el.classList.toggle('on'); break;
        case 'tour': st.page = TOURS()[st.page] ? st.page : AE ? 'today' : 'cockpit'; Object.assign(st, { offer: null, linesFor: null, cust: null, case: null, chat: null, tour: 0 }); render(true); break;
        case 'tournext': st.tour = st.tour >= (TOURS()[st.page] || TOUR()).length - 1 ? -1 : st.tour + 1; render(); break;
        case 'tourprev': st.tour = Math.max(0, st.tour - 1); render(); break;
        case 'tourend': st.tour = -1; render(); break;
      }
    });
    root.addEventListener('input', e => {
      if (e.target.dataset.act !== 'q') return;
      st.q = e.target.value; const pos = e.target.selectionStart; render();
      const inp = root.querySelector('input[data-act="q"]'); if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
    });
    root.addEventListener('change', async e => {
      if (e.target.dataset.price) { // the account manager sets a price on a line
        const [id, g] = e.target.dataset.price.split('|'), v = parseFloat(String(e.target.value).replace(',', '.'));
        if (v > 0) { (model.prices[id] = model.prices[id] || {})[g] = v; emit(); toast(L(`${g}: ${nf(v, 2)} €/kg. Offer, total and email updated.`, `${g}: ${nf(v, 2)} €/kg. Angebot, Summe und E-Mail aktualisiert.`)); }
        return;
      }
      if (e.target.dataset.act !== 'bulk') return;
      const file = e.target.files[0]; if (!file) return;
      try {
        const wb = /\.(csv|txt)$/i.test(file.name) ? XLSX.read(await file.text(), { type: 'string', raw: true }) : XLSX.read(await file.arrayBuffer(), { cellDates: true });
        const rows = E.normalise('demand', wb.SheetNames.flatMap(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })), `file:${file.name}`);
        model.extra.push(...rows.map(r => ({ ...r, channel: 'file', at: Date.now(), conf: 97 })));
        st.modal = null; emit(); toast(L(`${rows.length} demand lines imported from ${file.name}`, `${rows.length} Bedarfe aus ${file.name} importiert`));
      } catch (err) { toast(L('Could not read that file', 'Die Datei konnte nicht gelesen werden')); }
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.dataset?.act === 'chatin') { e.preventDefault(); AE?.act('ae-send', null, e.target); return; }
      if (e.key === 'Escape') { st.drawer = null; st.modal = null; st.menu = null; st.tour = -1; st.chat = null; st.compose = null; st.bulk = null; render(); }
    });
    addEventListener('resize', () => { if (st.tour >= 0) placeTour(); });

    subs.add((kind, msg) => { if (kind === 'toast') { if (!opts.mini) toast(msg); } else render(); });
    window.UI?.onLang(() => emit()); // texts inside the derived data (checks) follow the language too
    render();
    return { startTour() { if (st.tour < 0 && !opts.mini && TOURS()[st.page] && !st.cust && !st.case && !st.offer) { st.tour = 0; render(); } }, openNew() { st.tour = -1; st.modal = 'new'; render(); }, render,
      // jump to a screen from the page around the app ("Show me in the product")
      open({ page, case: c, cust, chat, push } = {}) { Object.assign(st, { tour: -1, offer: null, linesFor: null, drawer: null, modal: null, menu: null, q: '', push: push || null, compose: null, bulk: null, page: page || (c || cust ? st.page : 'today'), case: c || null, cust: cust || null, chat: null }); render(true); if (chat && AE) AE.act('ae-chat', c ? `case:${c}` : `cust:${cust}`); } };
  }

  window.BFApp = { mount: (el, opts) => createApp(el, opts) };
})();
