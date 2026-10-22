/* Shared page behaviour for both Biesterfeld versions: language, sources, uploads, match, result.
   Each version supplies its own markup (same ids/classes), its own CSS and its own hero visual. */
(() => {
  const C = window.CLIENT, S = window.SAMPLE, E = window.Engine;
  const BASE = window.SHARED_BASE || '../shared/';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }; // stable pseudo-random
  const wait = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ------------------------------------------------------------------ words
  const T = {
    en: {
      demo: 'Demo with synthetic data', what: 'What', how: 'How', result: 'Result', start: 'Start', sources: 'Sources', product: 'Product', value: 'Value', plan: 'Plan', workday: 'Workday',
      h1: 'Volatile supply. Nervous demand. Scarce inventory.',
      demand: 'Demand', supply: 'Supply',
      f_calloff: 'Cautious call-offs', f_calloff_s: 'Smaller lots, shorter notice', f_season: 'Looking for substitutes', f_season_s: '37% of converters weigh alternatives',
      f_reg: 'PPWR paperwork', f_reg_s: 'Mandatory since 12 Aug 2026', f_price: 'Price jumps', f_price_s: 'PE and PP up to +60% in spring',
      f_fm: 'Hormuz', f_fm_s: 'Force majeure and allocations', f_freight: 'Slow recovery', f_freight_s: '12 to 18 months for Gulf exports',
      glue: 'Today scarce supply gets shared out by email and gut feel.',
      h2_how: 'Every request in. All inventory placed.', sample: 'Try with sample data', drop: 'Drop Excel or CSV', template: 'Template',
      go: 'Connect', api_ph: 'https://…/demand.json', api_ph_s: 'https://…/stock.json', live: 'Live call', api: 'API', excel: 'Excel',
      needs: 'needs', customers: 'customers', lots: 'lots', inbound: 'inbound', match: 'Match',
      h2_result: 'Who gets the scarce supply, at what price.', k_cov: 'demand covered', k_val: 'matched', k_margin: 'margin', k_gap: 'gap to source',
      mode_scarce: 'Scarce supply', mode_surplus: 'Surplus stock',
      h2_surplus: 'Surplus stock ties up cash. Here it goes fast to the customers who can use it, without giving margin away.',
      s_cov: 'of surplus has a buyer', s_val: 'surplus in stock', s_margin: 'margin when sold', s_hold: 'below the margin floor',
      lg_lot: 'Surplus lot', lg_rest: 'no buyer yet', customers_lg: 'Customer', surplus_lot: 'surplus',
      c_offer: 'Offer now', c_volume: 'Volume only', c_hold: 'Hold', c_none: 'No buyer',
      v_offer: 'Good margin: offer it now at the normal price.', v_volume: 'Thin margin: a discount only against volume.', v_hold: 'Below the 5 % floor: hold it, or ask the producer for support.', v_none: 'No customer fits the spec yet: ask the producer or the network.',
      b_fit: 'Spec fits', b_approval: 'Grade approval needed',
      surplus_first: 'Move these lots first', s_approve: 'You approve every offer.', prepare: 'Prepare offer', prepared: 'Prepared', ask_producer: 'Ask producer', asked: 'Asked',
      all: 'All', call_first: 'Call first', approve: 'You approve every call.', call: 'Call', done: 'Done', more: 'more',
      exact: 'Grade', producer: 'Producer', any: 'Spec', alt: 'Equivalent', colour: 'Colour', masterbatch: 'Masterbatch', ontime: 'On time', late: 'Late',
      stock: 'Stock', eta: 'ETA', wk: 'W', via: 'via', approved: 'Approved grade', margin: 'Margin',
      h2_start: 'One tight grade. Your data. 30 days.', start_cta: 'Drop your export',
      st_1: 'Your export', st_1s: 'Inbox, stock and allocations', st_2: 'Matched', st_2s: 'In days, not months', st_3: 'Measured', st_3s: 'Hours and margin',
      private: 'Your file never leaves your browser.', proof: 'In daily use at a B2B wholesaler.', connects: 'Connects to',
      foot: 'Demo with synthetic data and fictional customers. Not a Biesterfeld product.',
      ch_crm: 'Biesterfeld CRM', ch_email: 'Email', ch_whatsapp: 'WhatsApp', ch_calls: 'Call', ch_call: 'Live call', ch_file: 'Excel', ch_api: 'API',
      ch_erp: 'SAP', ch_producer: 'Producer EDI', ch_ship: 'Shipping ETA',
    },
    de: {
      demo: 'Demo mit synthetischen Daten', what: 'Was', how: 'Wie', result: 'Ergebnis', start: 'Start', sources: 'Quellen', product: 'Produkt', value: 'Wert', plan: 'Plan', workday: 'Arbeitstag',
      h1: 'Volatiles Angebot. Nervöse Nachfrage. Knappes Inventar.',
      demand: 'Nachfrage', supply: 'Angebot',
      f_calloff: 'Vorsichtige Abrufe', f_calloff_s: 'Kleinere Mengen, kürzere Fristen', f_season: 'Ersatz gesucht', f_season_s: '37 % der Verarbeiter prüfen Alternativen',
      f_reg: 'PPWR-Nachweise', f_reg_s: 'Pflicht seit 12. Aug. 2026', f_price: 'Preissprünge', f_price_s: 'PE und PP bis +60 % im Frühjahr',
      f_fm: 'Hormus', f_fm_s: 'Force Majeure und Allokationen', f_freight: 'Langsame Erholung', f_freight_s: '12 bis 18 Monate für Exporte aus der Golfregion',
      glue: 'Heute wird knappes Inventar per E-Mail und nach Bauchgefühl verteilt.',
      h2_how: 'Jede Anfrage rein. Das ganze Inventar platziert.', sample: 'Mit Beispieldaten testen', drop: 'Excel oder CSV ablegen', template: 'Vorlage',
      go: 'Verbinden', api_ph: 'https://…/bedarf.json', api_ph_s: 'https://…/bestand.json', live: 'Live-Anruf', api: 'API', excel: 'Excel',
      needs: 'Bedarfe', customers: 'Kunden', lots: 'Posten', inbound: 'im Zulauf', match: 'Abgleichen',
      h2_result: 'Wer bekommt das knappe Inventar, zu welchem Preis.', k_cov: 'Nachfrage gedeckt', k_val: 'zugeordnet', k_margin: 'Marge', k_gap: 'Inventar zu beschaffen',
      mode_scarce: 'Knappes Inventar', mode_surplus: 'Überbestand',
      h2_surplus: 'Überbestand bindet Kapital. Hier geht er schnell an die Kunden, die ihn brauchen, ohne Marge zu verschenken.',
      s_cov: 'des Überbestands mit Abnehmer', s_val: 'Überbestand im Lager', s_margin: 'Marge beim Verkauf', s_hold: 'unter der Marge-Untergrenze',
      lg_lot: 'Überbestand', lg_rest: 'noch ohne Abnehmer', customers_lg: 'Kunde', surplus_lot: 'Überbestand',
      c_offer: 'Jetzt anbieten', c_volume: 'Nur gegen Menge', c_hold: 'Halten', c_none: 'Kein Abnehmer',
      v_offer: 'Gute Marge: jetzt zum normalen Preis anbieten.', v_volume: 'Knappe Marge: Rabatt nur gegen Menge.', v_hold: 'Unter der Untergrenze von 5 %: halten oder Hersteller um Unterstützung bitten.', v_none: 'Noch kein Kunde mit passender Spezifikation: Hersteller oder Netzwerk fragen.',
      b_fit: 'Spezifikation passt', b_approval: 'Freigabe der Type nötig',
      surplus_first: 'Diese Partien zuerst abbauen', s_approve: 'Jedes Angebot wird von Ihnen freigegeben.', prepare: 'Angebot vorbereiten', prepared: 'Vorbereitet', ask_producer: 'Hersteller fragen', asked: 'Angefragt',
      all: 'Alle', call_first: 'Zuerst anrufen', approve: 'Jeder Anruf wird von Ihnen freigegeben.', call: 'Anrufen', done: 'Erledigt', more: 'weitere',
      exact: 'Type', producer: 'Hersteller', any: 'Spezifikation', alt: 'Gleichwertig', colour: 'Farbe', masterbatch: 'Masterbatch', ontime: 'Pünktlich', late: 'Später',
      stock: 'Lager', eta: 'ETA', wk: 'KW', via: 'über', approved: 'Freigegebene Type', margin: 'Marge',
      h2_start: 'Ein knapper Werkstoff. Ihre Daten. 30 Tage.', start_cta: 'Export ablegen',
      st_1: 'Ihr Export', st_1s: 'Postfach, Bestand und Allokationen', st_2: 'Abgeglichen', st_2s: 'In Tagen, nicht Monaten', st_3: 'Gemessen', st_3s: 'Stunden und Marge',
      private: 'Ihre Datei verlässt nie Ihren Browser.', proof: 'Im täglichen Einsatz bei einem B2B-Großhändler.', connects: 'Verbindet sich mit',
      foot: 'Demo mit synthetischen Daten und fiktiven Kunden. Kein Produkt von Biesterfeld.',
      ch_crm: 'Biesterfeld CRM', ch_email: 'E-Mail', ch_whatsapp: 'WhatsApp', ch_calls: 'Anruf', ch_call: 'Live-Anruf', ch_file: 'Excel', ch_api: 'API',
      ch_erp: 'SAP', ch_producer: 'Hersteller-EDI', ch_ship: 'Schiffs-ETA',
    },
  };
  // a page can replace any of these words, e.g. its headings (window.UI_TEXT = { en: {...}, de: {...} })
  for (const l of Object.keys(window.UI_TEXT || {})) Object.assign(T[l] || (T[l] = {}), window.UI_TEXT[l]);
  // a published page can fix its language (/ is German, /en/ is English); otherwise the last choice, German by default
  let lang = window.PAGE_LANG || (store.get('bf-lang') === 'en' ? 'en' : 'de');
  const t = k => T[lang][k] ?? T.en[k] ?? k;
  const loc = () => (lang === 'de' ? 'de-DE' : 'en-GB');
  const nf = (n, d = 0) => n.toLocaleString(loc(), { maximumFractionDigits: d });
  const money = v => v >= 1e6 ? `€\u202f${nf(v / 1e6, 2)}\u202fM` : v >= 1e4 ? `€\u202f${nf(v / 1e3)}k` : `€\u202f${nf(v)}`;
  const tons = kg => `${nf(kg / 1000, kg < 10000 ? 1 : 0)}\u202ft`;
  const wkLabel = w => `${t('wk')} ${((E.NOW_WK - 1 + w) % 52) + 1}`;

  // ------------------------------------------------------------------ icons
  const ph = (name, cls = '') => `<i class="ph-light ph-${name} ${cls}" aria-hidden="true"></i>`;
  const logo = src => src.logo
    ? `<span class="logo" style="--c:${src.color};-webkit-mask-image:url(${BASE}logos/${src.logo}.svg);mask-image:url(${BASE}logos/${src.logo}.svg)" aria-hidden="true"></span>`
    : `<span class="logo-ph" style="--c:${src.color || 'currentColor'}">${ph(src.ph)}</span>`;
  const CH = { crm: 'biesterfeld', whatsapp: 'whatsapp', erp: 'sap' };
  const chIcon = ch => {
    const all = [...C.demandSources, ...C.supplySources];
    const src = all.find(s => s.id === ch) || ({ call: { ph: 'microphone', color: css('--d') }, file: { ph: 'microsoft-excel-logo', color: '#107C41' }, api: { ph: 'plugs-connected' } })[ch];
    return src ? logo(src) : '';
  };

  // ------------------------------------------------------------------ state
  const state = { demand: [], supply: [], on: { demand: new Set(), supply: new Set() }, result: null, surplus: [], mode: 'surplus', filter: 'all', done: new Set() };
  const listeners = [];

  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    $$('[data-tp]').forEach(el => { el.placeholder = t(el.dataset.tp); });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderSources('demand'); renderSources('supply');
    renderSide('demand'); renderSide('supply');
    if (state.result) renderResult(false); else drawGhost();
    listeners.forEach(fn => fn(lang));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    const to = b.dataset.lang, url = window.LANG_URLS?.[to];
    if (url && to !== lang) { location.href = url + location.hash; return; } // each language has its own address
    lang = to; store.set('bf-lang', lang); applyLang();
  }));

  // ------------------------------------------------------------------ sources
  function renderSources(side) {
    const box = $(`.panel[data-side="${side}"] .sources`); if (!box) return;
    const extra = side === 'demand' ? [{ id: 'call', name: t('live'), ph: 'microphone', color: css('--d'), live: true }] : [];
    const list = [...C[side + 'Sources'], ...extra, { id: 'api', name: t('api'), ph: 'plugs-connected', color: css('--ink-2') }];
    box.innerHTML = '';
    for (const src of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = `src${src.live ? ' src-live' : ''}${state.on[side].has(src.id) ? ' on' : ''}`; b.dataset.id = src.id;
      const n = state[side].filter(r => r.origin === src.id).length;
      b.innerHTML = `${logo(src)}<span class="src-name">${esc(src.name)}</span><span class="src-state">${n ? `+${n}` : ''}</span><i class="src-bar"></i>`;
      b.addEventListener('click', () => src.id === 'api' ? toggleApi(side, b) : src.live ? window.LiveCall?.open() : connect(side, src, b));
      box.append(b);
    }
  }

  async function connect(side, src, btn, quick) {
    if (btn.classList.contains('busy')) return;
    if (state.on[side].has(src.id)) {
      state.on[side].delete(src.id);
      state[side] = state[side].filter(r => r.origin !== src.id);
      btn.classList.remove('on'); btn.querySelector('.src-state').textContent = '';
      return changed(side);
    }
    btn.classList.add('busy');
    await wait(quick ? 450 : 700 + Math.random() * 500);
    btn.classList.remove('busy');
    const rows = S[side].filter(src.take).map(r => ({ ...r, origin: src.id }));
    state[side].push(...rows);
    state.on[side].add(src.id);
    btn.classList.add('on');
    btn.querySelector('.src-state').textContent = `+${rows.length}`;
    changed(side);
  }

  function toggleApi(side, btn) {
    const form = $(`.panel[data-side="${side}"] .api`);
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector('input').focus();
  }
  $$('.api').forEach(form => form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const side = form.closest('.panel').dataset.side, url = form.querySelector('input').value.trim();
    const btn = $(`.panel[data-side="${side}"] .src[data-id="api"]`);
    btn.classList.add('busy');
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data ?? json.items ?? json.records ?? json.results ?? json.rows;
      if (!Array.isArray(list)) throw new Error('no list');
      const rows = E.normalise(side, list, 'api').map(r => ({ ...r, channel: 'api' }));
      if (!rows.length) throw new Error('no rows');
      state[side] = state[side].filter(r => r.origin !== 'api').concat(rows);
      state.on[side].add('api'); btn.classList.add('on'); btn.querySelector('.src-state').textContent = `+${rows.length}`;
      form.hidden = true; changed(side);
    } catch (e) {
      form.classList.remove('bad'); void form.offsetWidth; form.classList.add('bad');
    } finally { btn.classList.remove('busy'); }
  }));

  // drop zones and whole panels accept files
  $$('.drop').forEach(drop => {
    const side = drop.closest('.panel').dataset.side, input = drop.querySelector('input');
    input.addEventListener('change', () => { [...input.files].forEach(f => readFile(side, f, drop)); input.value = ''; });
  });
  $$('.panel').forEach(panel => {
    const drop = panel.querySelector('.drop');
    panel.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    panel.addEventListener('dragleave', e => { if (!panel.contains(e.relatedTarget)) drop.classList.remove('over'); });
    panel.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); [...e.dataTransfer.files].forEach(f => readFile(panel.dataset.side, f, drop)); });
  });
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => e.preventDefault());

  async function readFile(side, file, drop) {
    try {
      // CSV as UTF-8 text with cells kept as written ("1.008" stays a thousand); Excel as a workbook
      const wb = /\.(csv|txt)$/i.test(file.name)
        ? XLSX.read(await file.text(), { type: 'string', raw: true })
        : XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const list = wb.SheetNames.flatMap(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' }));
      const rows = E.normalise(side, list, `file:${file.name}:${Date.now()}`);
      if (!rows.length) throw new Error('nothing usable');
      state[side].push(...rows);
      changed(side);
    } catch (e) {
      drop.classList.remove('bad'); void drop.offsetWidth; drop.classList.add('bad');
    }
  }

  const isoDate = w => { const d = new Date(E.TODAY); d.setDate(d.getDate() + 7 * w); return d.toISOString().slice(0, 10); };
  $$('.tmpl').forEach(btn => btn.addEventListener('click', () => {
    const side = btn.closest('.panel').dataset.side;
    const rows = side === 'demand'
      ? S.demand.map(r => ({ Customer: r.customer, Material: r.material, Grade: r.grade, Producer: r.producer, 'Quantity (kg)': r.qty, 'Needed by': isoDate(r.week), 'Equivalent OK': r.alternatives ? 'yes' : 'no', 'Approved only': r.approved ? 'yes' : 'no', 'Never from': r.never }))
      : S.supply.map(r => ({ SKU: r.sku, Material: r.material, Grade: r.grade, Producer: r.producer, 'Quantity (kg)': r.qty, 'Available from': isoDate(r.week), 'Price EUR/kg': r.price, 'Margin %': Math.round(r.margin * 100) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), side === 'demand' ? 'Demand' : 'Supply');
    XLSX.writeFile(wb, `biesterfeld-${side}-template.xlsx`);
  }));

  // ------------------------------------------------------------------ panels
  function changed(side) { renderSide(side); updateEngine(); if (state.result) runMatch(true); }

  function renderSide(side) {
    const panel = $(`.panel[data-side="${side}"]`), rows = state[side];
    if (!panel) return; // pages without the How panels (the in-page app takes demand instead)
    panel.classList.toggle('live', rows.length > 0);
    $(`.feed-${side[0]}`)?.classList.toggle('live', rows.length > 0);
    $('.n', panel).textContent = nf(rows.length);
    $('.n2', panel).textContent = nf(side === 'demand' ? new Set(rows.map(r => r.customer)).size : rows.filter(r => r.week > 0).length);
    const tonsEl = $('.n3', panel); if (tonsEl) tonsEl.textContent = tons(rows.reduce((a, r) => a + r.qty, 0));
    // one granule per row, sized by volume
    const dots = $('.dots', panel);
    if (dots.dataset.n !== String(rows.length)) {
      dots.innerHTML = '';
      rows.slice(0, 120).forEach((r, i) => {
        const d = document.createElement('i');
        d.style.setProperty('--s', Math.min(1.6, 0.7 + Math.sqrt(r.qty / 20000) * 0.5).toFixed(2));
        d.style.animationDelay = `${Math.min(i, 100) * 8}ms`;
        d.title = `${r.customer || r.grade} · ${tons(r.qty)}`;
        dots.append(d);
      });
      if (rows.length > 120) dots.insertAdjacentHTML('beforeend', `<em>+${rows.length - 120}</em>`);
      dots.dataset.n = String(rows.length);
    }
    const files = $('.files', panel); files.innerHTML = '';
    const byOrigin = {};
    rows.filter(r => /^(file|call):/.test(r.origin)).forEach(r => { byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1; });
    for (const [o, count] of Object.entries(byOrigin)) {
      const chip = document.createElement('span'); chip.className = 'file';
      chip.innerHTML = `${o.startsWith('call:') ? ph('microphone') : ph('microsoft-excel-logo')}<span>${esc(o.split(':')[1])} · ${count}</span><button type="button" aria-label="Remove">${ph('x')}</button>`;
      chip.querySelector('button').addEventListener('click', () => { state[side] = state[side].filter(r => r.origin !== o); changed(side); });
      files.append(chip);
    }
  }

  function updateEngine() {
    const d = state.demand.length > 0, s = state.supply.length > 0;
    const core = $('#core');
    core?.classList.toggle('half', d !== s);
    core?.classList.toggle('ready', d && s);
    const run = $('#run'); if (run) run.disabled = !(d && s);
    document.dispatchEvent(new CustomEvent('bf:loaded', { detail: { demand: d, supply: s } }));
  }

  async function loadSample() {
    const jobs = [];
    for (const side of ['demand', 'supply']) {
      for (const src of C[side + 'Sources']) {
        if (state.on[side].has(src.id)) continue;
        jobs.push(connect(side, src, $(`.panel[data-side="${side}"] .src[data-id="${src.id}"]`), true));
        await wait(140);
      }
    }
    await Promise.all(jobs);
  }
  $('#sample-all')?.addEventListener('click', loadSample);
  $('#sample-run')?.addEventListener('click', async () => {
    $('#how').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    await wait(500); await loadSample(); await wait(350);
    $('#run').click();
  });
  $('#run')?.addEventListener('click', async () => {
    const core = $('#core'); core?.classList.remove('spin'); void core?.offsetWidth; core?.classList.add('spin');
    await wait(380);
    runMatch(false);
    $('#result').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  // ------------------------------------------------------------------ result
  function runMatch(silent) {
    state.result = E.match(state.demand, state.supply);
    state.surplus = E.surplus(state.result);
    renderResult(!silent);
    document.dispatchEvent(new CustomEvent('bf:matched', { detail: state.result }));
  }
  const famOf = d => E.parseMaterial(`${d.material} ${d.grade}`).family || '?';

  function renderFilters() {
    const fams = [...new Set((state.mode === 'surplus' ? state.surplus.map(l => l.s) : state.result.demand).map(famOf))].sort();
    const box = $('#filters'); box.innerHTML = '';
    if (state.filter !== 'all' && !fams.includes(state.filter)) state.filter = 'all';
    for (const f of ['all', ...fams]) {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = f === 'all' ? t('all') : f;
      b.setAttribute('aria-pressed', String(state.filter === f));
      b.addEventListener('click', () => { state.filter = f; renderResult(true); });
      box.append(b);
    }
  }

  function countUp(el, to, fmt) {
    if (!el) return;
    const from = +(el.dataset.v || 0); el.dataset.v = to;
    if (reduced) { el.textContent = fmt(to); return; }
    const t1 = performance.now(), dur = 900;
    const step = now => { const k = Math.min(1, (now - t1) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function renderResult(animate) {
    const R = state.result; if (!R) return;
    if (state.mode === 'surplus') return renderSurplus(animate);
    renderFilters();
    const inF = d => state.filter === 'all' || famOf(d) === state.filter;
    const demand = R.demand.filter(inF);
    const matches = R.matches.filter(m => inF(m.d));
    const matchedValue = matches.reduce((a, m) => a + m.value, 0);
    const gapValue = demand.reduce((a, d) => a + d.gapValue, 0);
    const total = matchedValue + gapValue;
    const fmtV = R.hasPrice ? money : v => tons(v);
    countUp($('#k-cov'), total ? matchedValue / total * 100 : 0, v => `${nf(v)}\u202f%`);
    countUp($('#k-val'), matchedValue, fmtV);
    if (R.hasMargin) countUp($('#k-margin'), matches.reduce((a, m) => a + m.margin, 0), money); else { $('#k-margin').textContent = '-'; $('#k-margin').dataset.v = 0; }
    countUp($('#k-gap'), gapValue, fmtV);
    const bar = $('#k-cov-bar'); if (bar) requestAnimationFrame(() => { bar.style.transform = `scaleX(${total ? matchedValue / total : 0})`; });
    $('#empty').hidden = true;
    drawSankey(demand, matches, animate, fmtV);
    if ($('#calls-wrap')) renderCalls(matches, fmtV); // a page can leave the call cards out (version 2)
  }

  // granules travelling along ribbons (both views): one to five per ribbon by its width, fading in and out at the ends.
  // f = { ya, yb, h, key, dur }; reverse runs them right to left (supply to customer in the scarce view)
  const grDef = () => `<radialGradient id="gr-s" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${css('--ps-dot-mid')}"/><stop offset="1" stop-color="${css('--ps-dot-lo')}"/></radialGradient>`;
  function flowHtml(list, xa, xm, xR, reverse) {
    if (reduced) return '';
    const dir = reverse ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '';
    let html = '<g class="flow" aria-hidden="true">';
    list.forEach((f, i) => {
      const d = `M${xa} ${f.ya}C${xm} ${f.ya} ${xm} ${f.yb} ${xR} ${f.yb}`, n = Math.max(1, Math.min(5, Math.round(f.h / 7))), sz = Math.min(1.25, .8 + f.h / 60);
      html += `<g data-c="${esc(f.key)}">`;
      for (let j = 0; j < n; j++) {
        const at = `begin="${(-(j / n) * f.dur - rnd(i + j) * .6).toFixed(2)}s" dur="${f.dur}s" repeatCount="indefinite"`;
        html += `<ellipse class="gr" rx="${(5.2 * sz).toFixed(1)}" ry="${(3.5 * sz).toFixed(1)}" fill="url(#gr-s)"><animateMotion ${at}${dir} rotate="auto" path="${d}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.86;1" ${at}/></ellipse>`;
      }
      html += '</g>';
    });
    return html + '</g>';
  }

  function drawSankey(demand, matches, animate, fmtV) {
    const svg = $('#sankey');
    const W = svg.clientWidth || 900, narrow = W < 640;
    const labL = narrow ? 96 : 220, labR = narrow ? 100 : 240, nodeW = narrow ? 8 : 10;
    const xL = labL, xR = W - labR - nodeW;
    const cust = new Map();
    for (const d of demand) { const c = cust.get(d.customer) || { name: d.customer, matched: 0, gap: 0, links: [] }; c.gap += d.gapValue; cust.set(d.customer, c); }
    for (const m of matches) { const c = cust.get(m.d.customer); c.matched += m.value; c.links.push(m); }
    const left = [...cust.values()].filter(c => c.matched + c.gap > 0).sort((a, b) => b.matched - a.matched || b.gap - a.gap);
    const lotId = m => `${m.s.sku}|${m.s.grade}`;
    const nR = new Set(matches.map(lotId)).size;
    const gapL = 10, H = Math.max(320, Math.min(1000, Math.max(left.length * 40, nR * 22)));
    const sumL = left.reduce((a, c) => a + c.matched + c.gap, 0) || 1;
    const k = (H - gapL * Math.max(0, left.length - 1)) / sumL;
    let y = 0;
    for (const c of left) { c.y = y; c.hm = c.matched * k; c.hg = Math.max(c.matched ? 0 : 2, c.gap * k); c.h = Math.max(3, c.hm + c.hg); y += c.h + Math.max(gapL, 18 - c.h); }
    const totalH = Math.max(y - gapL, 0);

    // right: one node per grade (stock and inbound of the same grade share it)
    const lots = new Map(), lotOf = m => lots.get(lotId(m));
    for (const m of matches) {
      const l = lots.get(lotId(m)) || { s: m.s, value: 0, links: [], weeks: new Set() };
      l.value += m.value; l.links.push(m); if (m.s.week > 0) l.weeks.add(m.s.week); lots.set(lotId(m), l);
    }
    const right = [...lots.values()];
    for (const l of right) l.wy = l.links.reduce((a, m) => { const c = cust.get(m.d.customer); return a + m.value * (c.y + c.h / 2); }, 0) / (l.value || 1);
    right.sort((a, b) => a.wy - b.wy);
    const PITCH = 20;
    const sumR = right.reduce((a, l) => a + Math.max(2, l.value * k), 0);
    const gapR = right.length > 1 ? Math.min(30, Math.max(4, (totalH - sumR) / (right.length - 1))) : 0;
    let yr = 0;
    for (const l of right) { l.h = Math.max(2, l.value * k); l.y = yr; yr += l.h + Math.max(gapR, PITCH - l.h); }
    const shift = Math.max(0, (totalH - (yr - gapR)) / 2);
    if (shift) { right.forEach(l => { l.y += shift; }); yr += shift; }
    const extra = (yr - gapR) - totalH;
    if (extra > 0 && left.length > 1) left.forEach((c, i) => { c.y += extra * i / (left.length - 1); });
    const fullH = Math.max(totalH, yr - gapR, 200);
    svg.style.height = `${fullH + 8}px`;

    const lk = new Map();
    for (const c of left) { let o = c.y; c.links.sort((a, b) => lotOf(a).y - lotOf(b).y).forEach(m => { const h = m.value * k; lk.set(m, { y0: o, h }); o += h; }); }
    for (const l of right) { let o = l.y; const sc = l.h / (l.value * k || 1); l.links.sort((a, b) => cust.get(a.d.customer).y - cust.get(b.d.customer).y).forEach(m => { const e = lk.get(m); e.y1 = o; e.h1 = e.h * sc; o += e.h1; }); }

    const cD = css('--d'), cS = css('--s');
    const xa = xL + nodeW, xm = (xa + xR) / 2;
    const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
    let html = `<defs>
      <linearGradient id="rib-g" gradientUnits="userSpaceOnUse" x1="${xa}" x2="${xR}" y1="0" y2="0"><stop offset="0" stop-color="${cD}"/><stop offset="1" stop-color="${cS}"/></linearGradient>
      <pattern id="gap-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${css('--d-soft')}"/><line x1="0" y1="0" x2="0" y2="5" stroke="${cD}" stroke-width="1.4" opacity=".6"/></pattern>
      ${grDef()}</defs><g class="ribs">`;
    matches.forEach((m, i) => {
      const e = lk.get(m); if (!e) return;
      const a0 = e.y0, a1 = e.y0 + e.h, b0 = e.y1, b1 = e.y1 + Math.max(e.h1, .6);
      html += `<path class="rib${m.d.approved ? ' locked' : ''}" data-i="${i}" data-c="${esc(m.d.customer)}" fill="url(#rib-g)" d="M${xa} ${a0}C${xm} ${a0} ${xm} ${b0} ${xR} ${b0}L${xR} ${b1}C${xm} ${b1} ${xm} ${a1} ${xa} ${Math.max(a1, a0 + .6)}Z"/>`;
    });
    // the scarce supply on its way to the customers who get it
    html += '</g>' + flowHtml(matches.map(m => lk.get(m)).filter(Boolean).map((e, i) => ({ ya: e.y0 + e.h / 2, yb: e.y1 + Math.max(e.h1, .6) / 2, h: e.h, key: matches.find(m => lk.get(m) === e).d.customer, dur: 4.2 + rnd(i) * .8 })), xa, xm, xR, true);
    html += `<rect class="wipe" x="${xa}" y="-4" width="${Math.max(0, xR - xa)}" height="${fullH + 12}"/>`;
    for (const c of left) {
      html += `<rect class="node-d" x="${xL}" y="${c.y}" width="${nodeW}" height="${Math.max(c.hm, 0)}"/>`;
      if (c.hg > 0) html += `<rect class="gap" x="${xL}" y="${c.y + c.hm}" width="${nodeW}" height="${c.hg}"/>`;
      html += `<g class="lbl" data-c="${esc(c.name)}"><text x="${xL - 10}" y="${c.y + c.h / 2 + 4}" text-anchor="end">${esc(trunc(c.name.replace(/ GmbH.*| AG$/, ''), narrow ? 12 : 30))}</text></g>`;
    }
    for (const l of right) {
      const s = l.s, cy = l.y + l.h / 2, eta = l.weeks.size ? `${t('eta')} ${wkLabel(Math.min(...l.weeks))}` : '';
      html += `<rect class="node-s" x="${xR}" y="${l.y}" width="${nodeW}" height="${l.h}"/>`;
      html += `<text x="${xR + nodeW + 10}" y="${cy + 4}">${esc(trunc(s.grade, narrow ? 12 : 22))}${narrow ? '' : `<tspan class="sub" dx="8">${esc(E.parseMaterial(s.material).family)}${eta ? `  ${eta}` : ''}</tspan>`}</text>`;
    }
    svg.innerHTML = html;
    svg.classList.remove('drawn', 'focus');
    if (animate && !reduced) { void svg.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('drawn'))); }
    else svg.classList.add('drawn');

    const tip = $('#tip');
    const chk = (ok, label, warn) => `<span class="chk ${ok ? 'ok' : warn ? 'warn' : ''}">${ph(ok ? 'check' : 'warning')}${esc(label)}</span>`;
    svg.onmousemove = e => {
      const r = e.target.closest('.rib');
      if (!r) { tip.hidden = true; return; }
      const m = matches[+r.dataset.i];
      tip.innerHTML = `<div class="tip-h">${chIcon(m.d.channel)}<b>${esc(m.d.customer)}</b></div>
        <div class="tip-m">${esc(m.d.material)}${m.d.approved ? ` <span class="lock">${ph('lock-simple')}${t('approved')}</span>` : ''}</div>
        <div class="tip-arrow">${ph('arrow-down')}</div>
        <div class="tip-m"><b>${esc(m.s.producer)} ${esc(m.s.grade)}</b></div>
        <div class="tip-n">${tons(m.qty)} · ${m.s.week ? `${t('eta')} ${wkLabel(m.s.week)}` : t('stock')} · ${fmtV(m.value)}${m.margin ? ` · ${t('margin')} ${money(m.margin)}` : ''}</div>
        <div class="row">${chk(m.grade === 'exact' || m.grade === 'producer' || m.grade === 'any', t(m.grade), m.grade === 'alt')}${chk(m.colour === 2, m.colour === 2 ? t('colour') : t('masterbatch'), m.colour === 1)}${chk(m.onTime, m.onTime ? t('ontime') : t('late'), !m.onTime)}</div>`;
      tip.hidden = false;
      const x = Math.min(e.clientX + 18, innerWidth - tip.offsetWidth - 12), yy = Math.min(e.clientY + 18, innerHeight - tip.offsetHeight - 12);
      tip.style.left = `${x}px`; tip.style.top = `${yy}px`;
    };
    svg.onmouseleave = () => { tip.hidden = true; };
    $$('.lbl', svg).forEach(g => {
      const on = () => { svg.classList.add('focus'); $$('.rib, .flow > g', svg).forEach(r => r.classList.toggle('on', r.dataset.c === g.dataset.c)); };
      g.addEventListener('mouseenter', on); g.addEventListener('click', on);
      g.addEventListener('mouseleave', () => svg.classList.remove('focus'));
    });
  }

  function renderCalls(matches, fmtV) {
    const by = new Map();
    for (const m of matches) { const c = by.get(m.d.customer) || { name: m.d.customer, list: [], value: 0, margin: 0, week: 99, channels: new Set() }; c.list.push(m); c.value += m.value; c.margin += m.margin; c.week = Math.min(c.week, m.d.week); c.channels.add(m.d.channel); by.set(m.d.customer, c); }
    const top = [...by.values()].sort((a, b) => a.week - b.week || b.value - a.value).slice(0, window.CALLS_SHOWN || 6);
    $('#calls-wrap').hidden = !top.length;
    $('#calls-n').textContent = by.size ? nf(by.size) : '';
    const ol = $('#calls'); ol.innerHTML = '';
    top.forEach((c, i) => {
      // one row per grade: stock and inbound of the same grade are added together
      const byGrade = new Map();
      for (const m of c.list) { const g = byGrade.get(m.s.grade) || { grade: m.s.grade, qty: 0, value: 0, stock: false, weeks: [] }; g.qty += m.qty; g.value += m.value; if (m.s.week) g.weeks.push(m.s.week); else g.stock = true; byGrade.set(m.s.grade, g); }
      const lines = [...byGrade.values()].sort((a, b) => b.value - a.value);
      const when = g => [g.stock && t('stock'), g.weeks.length && `${t('eta')} ${wkLabel(Math.min(...g.weeks))}`].filter(Boolean).join(' + ');
      const ok = c.list.every(m => m.grade !== 'alt' && m.onTime && m.colour === 2);
      const li = document.createElement('li');
      li.className = 'call' + (state.done.has(c.name) ? ' done' : '');
      li.style.animationDelay = `${i * 70}ms`;
      li.innerHTML = `<div class="call-top"><span class="call-ch">${[...c.channels].map(chIcon).join('')}</span><span class="call-rank">${i + 1}</span></div>
        <h4>${esc(c.name)}</h4>
        <div class="what">${lines.slice(0, 2).map(g => `<span><b>${tons(g.qty)}</b> ${esc(g.grade)}<em>${when(g)}</em></span>`).join('')}</div>
        ${lines.length > 2 ? `<span class="more">+${lines.length - 2} ${t('more')}</span>` : ''}
        <div class="checks"><span class="chk ${ok ? 'ok' : 'warn'}">${ph(ok ? 'check' : 'warning')}${wkLabel(c.week)}</span></div>
        <div class="foot-row"><span class="val">${fmtV(c.value)}${c.margin ? `<small>${t('margin')} ${money(c.margin)}</small>` : ''}</span><button class="btn btn-call" type="button">${ph(state.done.has(c.name) ? 'check' : 'phone-call')}<span>${state.done.has(c.name) ? t('done') : t('call')}</span></button></div>`;
      li.querySelector('button').addEventListener('click', ev => {
        if (state.done.has(c.name)) state.done.delete(c.name); else state.done.add(c.name);
        const d = state.done.has(c.name);
        li.classList.toggle('done', d); ev.currentTarget.innerHTML = `${ph(d ? 'check' : 'phone-call')}<span>${d ? t('done') : t('call')}</span>`;
      });
      ol.append(li);
    });
  }

  // ------------------------------------------------------------------ the reverse: surplus stock to the customers who can take it
  const VERDICTS = ['offer', 'volume', 'hold', 'none'];
  const pct = m => `${nf(m * 100)} %`;
  const short = n => n.replace(/ GmbH.*| AG$/, '');
  function renderSurplus(animate) {
    const R = state.result;
    renderFilters();
    const lots = state.surplus.filter(l => state.filter === 'all' || famOf(l.s) === state.filter);
    const fmtV = R.hasPrice ? money : v => tons(v);
    const total = lots.reduce((a, l) => a + l.value, 0), placed = lots.reduce((a, l) => a + l.placedValue, 0);
    countUp($('#k-cov'), total ? placed / total * 100 : 0, v => `${nf(v)} %`);
    countUp($('#k-val'), total, fmtV);
    if (R.hasMargin) countUp($('#k-margin'), lots.filter(l => l.verdict !== 'hold').reduce((a, l) => a + l.marginValue, 0), money); else { $('#k-margin').textContent = '-'; $('#k-margin').dataset.v = 0; }
    countUp($('#k-gap'), lots.filter(l => l.verdict === 'hold').reduce((a, l) => a + l.value, 0), fmtV);
    const bar = $('#k-cov-bar'); if (bar) requestAnimationFrame(() => { bar.style.transform = `scaleX(${total ? placed / total : 0})`; });
    $('#empty').hidden = true;
    drawSurplus(lots, animate, fmtV);
    renderLots(lots, fmtV);
  }

  function drawSurplus(lots, animate, fmtV) {
    const svg = $('#sankey');
    const W = svg.clientWidth || 900, narrow = W < 640;
    const labL = narrow ? 104 : 250, labR = narrow ? 92 : 210, nodeW = narrow ? 8 : 10;
    const xL = labL, xR = W - labR - nodeW;
    const left = [...lots].sort((a, b) => VERDICTS.indexOf(a.verdict) - VERDICTS.indexOf(b.verdict) || b.value - a.value);
    const unit = l => (l.qty ? l.value / l.qty : 1);
    const ribs = [];
    left.forEach(l => l.buyers.filter(b => b.qty > 0).forEach(b => ribs.push({ l, b, value: b.qty * unit(l) })));
    const cust = new Map();
    for (const r of ribs) { const c = cust.get(r.b.name) || { name: r.b.name, value: 0, ribs: [] }; c.value += r.value; c.ribs.push(r); cust.set(r.b.name, c); }
    // left: one node per lot, the part with a buyer in the verdict colour, the rest hatched
    const gapL = 12, H = Math.max(300, Math.min(900, Math.max(left.length * 44, cust.size * 30)));
    const k = (H - gapL * Math.max(0, left.length - 1)) / (left.reduce((a, l) => a + l.value, 0) || 1);
    let y = 0;
    for (const l of left) { l.y = y; l.h = Math.max(4, l.value * k); l.hp = Math.min(l.h, l.placedValue * k); y += l.h + Math.max(gapL, 22 - l.h); }
    const totalH = Math.max(y - gapL, 0);
    // right: one node per customer, placed next to the lots it takes
    const right = [...cust.values()];
    for (const c of right) c.wy = c.ribs.reduce((a, r) => a + r.value * (r.l.y + r.l.h / 2), 0) / (c.value || 1);
    right.sort((a, b) => a.wy - b.wy);
    const sumR = right.reduce((a, c) => a + Math.max(2, c.value * k), 0);
    const gapR = right.length > 1 ? Math.min(40, Math.max(6, (totalH - sumR) / (right.length - 1))) : 0;
    let yr = 0;
    for (const c of right) { c.h = Math.max(2, c.value * k); c.y = yr; yr += c.h + Math.max(gapR, 22 - c.h); }
    const shift = Math.max(0, (totalH - (yr - gapR)) / 2);
    if (shift) right.forEach(c => { c.y += shift; });
    const fullH = Math.max(totalH, yr - gapR + shift, 200);
    svg.style.height = `${fullH + 8}px`;
    // ribbon ends: stacked inside each lot and each customer
    for (const l of left) { let o = l.y; ribs.filter(r => r.l === l).sort((a, b) => cust.get(a.b.name).y - cust.get(b.b.name).y).forEach(r => { r.y0 = o; r.h = r.value * k; o += r.h; }); }
    for (const c of right) { let o = c.y; c.ribs.sort((a, b) => a.l.y - b.l.y).forEach(r => { r.y1 = o; o += r.h; }); }

    const xa = xL + nodeW, xm = (xa + xR) / 2;
    const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
    const lotKey = l => `${l.s.sku}|${l.s.grade}`;
    const VC = { offer: css('--s'), volume: css('--s-deep'), hold: css('--ink-3'), none: css('--ink-3') };
    let html = `<defs><pattern id="rest-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="rgb(255 255 255 / .04)"/><line x1="0" y1="0" x2="0" y2="5" stroke="${css('--ink-3')}" stroke-width="1.4" opacity=".7"/></pattern>
      ${grDef()}
      ${VERDICTS.map(v => `<linearGradient id="sur-${v}" gradientUnits="userSpaceOnUse" x1="${xa}" x2="${xR}" y1="0" y2="0"><stop offset="0" stop-color="${VC[v]}"/><stop offset="1" stop-color="${css('--d')}"/></linearGradient>`).join('')}</defs><g class="ribs">`;
    ribs.forEach((r, i) => {
      const a0 = r.y0, a1 = r.y0 + Math.max(r.h, .6), b0 = r.y1, b1 = r.y1 + Math.max(r.h, .6);
      html += `<path class="rib v-${r.l.verdict}" data-i="${i}" data-c="${esc(lotKey(r.l))}" fill="url(#sur-${r.l.verdict})" d="M${xa} ${a0}C${xm} ${a0} ${xm} ${b0} ${xR} ${b0}L${xR} ${b1}C${xm} ${b1} ${xm} ${a1} ${xa} ${a1}Z"/>`;
    });
    html += '</g>';
    // granules on their way: from each lot to its customer, faster where the margin says offer now; lots on hold stay put
    html += flowHtml(ribs.filter(r => r.l.verdict === 'offer' || r.l.verdict === 'volume').map(r => ({ ya: r.y0 + r.h / 2, yb: r.y1 + r.h / 2, h: r.h, key: lotKey(r.l), dur: r.l.verdict === 'offer' ? 3.4 : 5.2 })), xa, xm, xR);
    html += `<rect class="wipe" x="${xa}" y="-4" width="${Math.max(0, xR - xa)}" height="${fullH + 12}"/>`;
    for (const l of left) {
      if (l.hp > 0) html += `<rect class="node-v v-${l.verdict}" x="${xL}" y="${l.y}" width="${nodeW}" height="${l.hp}"/>`;
      if (l.h - l.hp > .5) html += `<rect class="rest" x="${xL}" y="${l.y + l.hp}" width="${nodeW}" height="${l.h - l.hp}"/>`;
      const sub = narrow ? '' : `<tspan class="sub" dx="8">${tons(l.qty)}${l.margin ? ` · ${pct(l.margin)}` : ''}</tspan>`;
      html += `<g class="lbl" data-c="${esc(lotKey(l))}"><text x="${xL - 10}" y="${l.y + l.h / 2 + 4}" text-anchor="end">${esc(trunc(l.s.grade, narrow ? 12 : 20))}${sub}</text></g>`;
    }
    for (const c of right) {
      html += `<rect class="node-d" x="${xR}" y="${c.y}" width="${nodeW}" height="${c.h}"/>`;
      html += `<text x="${xR + nodeW + 10}" y="${c.y + c.h / 2 + 4}">${esc(trunc(short(c.name), narrow ? 11 : 26))}</text>`;
    }
    svg.innerHTML = html;
    svg.classList.remove('drawn', 'focus');
    if (animate && !reduced) { void svg.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('drawn'))); }
    else svg.classList.add('drawn');

    const tip = $('#tip');
    svg.onmousemove = e => {
      const p = e.target.closest('.rib');
      if (!p) { tip.hidden = true; return; }
      const r = ribs[+p.dataset.i], l = r.l;
      tip.innerHTML = `<div class="tip-m"><b>${esc(l.s.producer)} ${esc(l.s.grade)}</b></div>
        <div class="tip-m">${esc(E.describe(E.parseMaterial(`${l.s.material} ${l.s.grade}`)))} · ${t('surplus_lot')} ${tons(l.qty)}</div>
        <div class="tip-arrow">${ph('arrow-down')}</div>
        <div class="tip-h">${chIcon(r.b.channel)}<b>${esc(r.b.name)}</b></div>
        <div class="tip-n">${tons(r.b.qty)} · ${fmtV(r.value)}${l.margin ? ` · ${t('margin')} ${pct(l.margin)}` : ''}</div>
        <div class="row"><span class="chk ${r.b.kind === 'fit' ? 'ok' : 'warn'}">${ph(r.b.kind === 'fit' ? 'check' : 'warning')}${t(`b_${r.b.kind}`)}</span><span class="verdict v-${l.verdict}">${t(`c_${l.verdict}`)}</span></div>`;
      tip.hidden = false;
      const x = Math.min(e.clientX + 18, innerWidth - tip.offsetWidth - 12), yy = Math.min(e.clientY + 18, innerHeight - tip.offsetHeight - 12);
      tip.style.left = `${x}px`; tip.style.top = `${yy}px`;
    };
    svg.onmouseleave = () => { tip.hidden = true; };
    $$('.lbl', svg).forEach(g => {
      const on = () => { svg.classList.add('focus'); $$('.rib, .flow > g', svg).forEach(r => r.classList.toggle('on', r.dataset.c === g.dataset.c)); };
      g.addEventListener('mouseenter', on); g.addEventListener('click', on);
      g.addEventListener('mouseleave', () => svg.classList.remove('focus'));
    });
  }

  // the lots to move first: good margin before thin, thin before hold; each with its verdict and the customers to offer it to
  function renderLots(lots, fmtV) {
    if (!$('#calls-wrap')) return; // a page can leave the cards out (version 2)
    const top = [...lots].sort((a, b) => VERDICTS.indexOf(a.verdict) - VERDICTS.indexOf(b.verdict) || b.value - a.value).slice(0, window.CALLS_SHOWN || 6);
    $('#calls-wrap').hidden = !top.length;
    $('#calls-n').textContent = lots.length ? nf(lots.length) : '';
    const ol = $('#calls'); ol.innerHTML = '';
    top.forEach((l, i) => {
      const key = `lot:${l.s.sku}|${l.s.grade}`, sell = l.verdict === 'offer' || l.verdict === 'volume';
      const label = d => d ? t(sell ? 'prepared' : 'asked') : t(sell ? 'prepare' : 'ask_producer');
      const fam = E.describe(E.parseMaterial(`${l.s.material} ${l.s.grade}`));
      const li = document.createElement('li');
      li.className = `call lot v-${l.verdict}` + (state.done.has(key) ? ' done' : '');
      li.style.animationDelay = `${i * 70}ms`;
      li.innerHTML = `<div class="call-top"><span class="verdict v-${l.verdict}">${t(`c_${l.verdict}`)}</span><span class="call-rank">${i + 1}</span></div>
        <h4>${esc(l.s.grade)}</h4>
        <div class="what"><span><b>${tons(l.qty)}</b> ${esc(fam)}<em>${t('stock')}</em></span></div>
        <p class="why">${t(`v_${l.verdict}`)}</p>
        <div class="checks">${l.buyers.slice(0, 3).map(b => `<span class="chk ${b.kind === 'fit' ? 'ok' : 'warn'}" title="${esc(t(`b_${b.kind}`))}">${ph(b.kind === 'fit' ? 'check' : 'warning')}${esc(short(b.name))}</span>`).join('')}</div>
        <div class="foot-row"><span class="val">${fmtV(l.value)}${l.margin ? `<small>${t('margin')} ${pct(l.margin)}</small>` : ''}</span><button class="btn btn-call" type="button">${ph(state.done.has(key) ? 'check' : sell ? 'file-text' : 'factory')}<span>${label(state.done.has(key))}</span></button></div>`;
      li.querySelector('button').addEventListener('click', ev => {
        if (state.done.has(key)) state.done.delete(key); else state.done.add(key);
        const d = state.done.has(key);
        li.classList.toggle('done', d); ev.currentTarget.innerHTML = `${ph(d ? 'check' : sell ? 'file-text' : 'factory')}<span>${label(d)}</span>`;
      });
      ol.append(li);
    });
  }

  // the switch above the chart: scarce supply (who gets it) or surplus stock (who takes it); words follow the mode
  const SWAP = [['h2_result', 'h2_surplus'], ['k_cov', 's_cov'], ['k_val', 's_val'], ['k_margin', 's_margin'], ['k_gap', 's_hold'], ['call_first', 'surplus_first'], ['approve', 's_approve']];
  const resultSec = $('#result');
  function setMode() {
    if (!resultSec) return;
    const sur = state.mode === 'surplus';
    resultSec.classList.toggle('is-surplus', sur);
    $$('.mode-sw button', resultSec).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    $$('[data-t]', resultSec).forEach(el => { if (el.closest('.legend')) return; const p = SWAP.find(x => x.includes(el.dataset.t)); if (p) { el.dataset.t = p[sur ? 1 : 0]; el.textContent = t(el.dataset.t); } });
    const lg = $('.legend', resultSec);
    if (lg) {
      lg.innerHTML = (sur ? [['lg-offer', 'c_offer'], ['lg-volume', 'c_volume'], ['lg-hold', 'c_hold'], ['lg-rest', 'lg_rest'], ['lg-d', 'customers_lg']] : [['lg-d', 'demand'], ['lg-gap', 'k_gap'], ['lg-s', 'supply']])
        .map(([c, k]) => `<span class="lg ${c}" data-t="${k}">${esc(t(k))}</span>`).join('');
    }
  }
  if (resultSec && $('#sankey')) {
    resultSec.querySelector('.h2')?.insertAdjacentHTML('beforebegin', `<div class="mode-sw reveal" role="group"><button type="button" data-mode="surplus"><span data-t="mode_surplus"></span></button><button type="button" data-mode="scarce"><span data-t="mode_scarce"></span></button></div>`);
    $$('.mode-sw button', resultSec).forEach(b => b.addEventListener('click', () => {
      if (state.mode === b.dataset.mode) return;
      state.mode = b.dataset.mode; state.filter = 'all'; setMode();
      if (state.result) renderResult(true);
    }));
    setMode();
  }

  // in-page links: the page can grow while it scrolls past (the Result loads the sample on the way), so land again once it stops
  let landing = null;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'), el = a && a.getAttribute('href').length > 1 && document.querySelector(a.getAttribute('href')); if (!el) return;
    if (landing) { removeEventListener('scrollend', landing); clearTimeout(landing.t); } // only the latest click lands
    landing = () => { landing = null; if (Math.abs(el.getBoundingClientRect().top) > 8) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };
    if ('onscrollend' in window) addEventListener('scrollend', landing, { once: true }); else landing.t = setTimeout(landing, 1200);
  });

  function drawGhost() {
    const svg = $('#sankey'); if (!svg) return;
    const W = svg.clientWidth || 900, xL = W < 640 ? 96 : 220, xR = W - (W < 640 ? 100 : 240) - 10;
    let html = '', y = 0;
    [70, 44, 58, 30, 52, 36, 40].forEach(h => { html += `<rect class="ghost" x="${xL}" y="${y}" width="10" height="${h}"/>`; y += h + 10; });
    let yr = 20; [52, 64, 38, 70, 46].forEach(h => { html += `<rect class="ghost" x="${xR}" y="${yr}" width="10" height="${h}"/>`; yr += h + 24; });
    svg.style.height = `${y}px`; svg.innerHTML = html;
  }

  // ------------------------------------------------------------------ start
  const integ = $('#integrations');
  if (integ) integ.innerHTML = C.integrations.map(s => `<li title="${esc(s.name)}">${logo(s)}<span class="sr">${esc(s.name)}</span></li>`).join('');
  $('#start-cta')?.addEventListener('click', async () => {
    if (!$('#how')) return document.dispatchEvent(new CustomEvent('bf:start')); // pages without How hand over to the in-page app
    $('#how').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    await wait(700);
    $$('.drop').forEach(d => { d.classList.remove('nudge'); void d.offsetWidth; d.classList.add('nudge'); });
  });

  // ------------------------------------------------------------------ public surface for the live call and the hero
  window.UI = {
    t, get lang() { return lang; }, onLang: fn => listeners.push(fn), ph, logo, chIcon, tons, wkLabel, esc, reduced, wait,
    // the demo's state, for pages that guide the visitor through it (version 2)
    demo: {
      get loaded() { return state.demand.length > 0 && state.supply.length > 0; },
      get matched() { return !!state.result; },
      get own() { return [...state.demand, ...state.supply].some(r => /^(file:|call:|api$)/.test(r.origin || '')); }, // uploads, live calls, API rows
      loadSample, run: () => runMatch(false),
    },
    customers: () => [...new Set([...S.demand.map(d => d.customer), ...state.demand.map(d => d.customer)])].sort(),
    addDemand(rows, origin) {
      state.demand = state.demand.filter(r => r.origin !== origin).concat(rows.map(r => ({ ...r, origin, channel: 'call' })));
      renderSources('demand'); changed('demand');
      document.dispatchEvent(new CustomEvent('bf:demand', { detail: { rows, origin } }));
    },
  };

  // ------------------------------------------------------------------ boot
  applyLang(); updateEngine();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));
  const top = $('.top'), sentinel = $('#top-sentinel');
  if (top && sentinel) new IntersectionObserver(([e]) => top.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => state.result ? renderResult(false) : drawGhost(), 150); });
})();
