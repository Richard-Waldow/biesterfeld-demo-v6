/* Shared engine: polymer parsing, spreadsheet/JSON normalising and the deterministic match.
   No DOM in here; both site versions use it through window.Engine. */
(() => {
  // ------------------------------------------------------------------ materials
  // order matters: longer names first (PA66 before PA6, PC/ABS before PC and ABS)
  const FAMILIES = [
    ['PC/ABS', /\bPC\s*\/\s*ABS\b/i], ['PA66', /\bPA\s?66\b|\bPA\s?6\.6\b/i], ['PA12', /\bPA\s?12\b/i], ['PA6', /\bPA\s?6\b/i],
    ['PBT', /\bPBT\b/i], ['PET', /\bPET\b/i], ['POM', /\bPOM\b/i], ['PPS', /\bPPS\b/i], ['PC', /\bPC\b|polycarbonat/i],
    ['ABS', /\bABS\b/i], ['ASA', /\bASA\b/i], ['SAN', /\bSAN\b/i], ['PMMA', /\bPMMA\b/i], ['PS', /\bPS\b/i],
    ['LLDPE', /\b(m?LLDPE)\b/i], ['LDPE', /\bLDPE\b/i], ['HDPE', /\bHDPE\b|\bPE-?HD\b/i], ['PE', /\bPE\b|polyethylen/i],
    ['PP', /\bPP\b|polypropylen/i], ['TPE', /\bTP[ECUV]\b|\bTPC(-ET)?\b|\bTPU\b/i],
  ];
  // trade names imply the family when the text does not say it
  const TRADE = [
    [/ultramid\s*b/i, 'PA6'], [/ultramid\s*a/i, 'PA66'], [/tarnamid/i, 'PA6'], [/zytel/i, 'PA66'], [/hostaform|ultraform/i, 'POM'],
    [/celanex|ultradur|crastin/i, 'PBT'], [/wonderlite|lupoy\s*1/i, 'PC'], [/lupoy\s*gn/i, 'PC/ABS'], [/polylac|hi121/i, 'ABS'],
    [/exceed/i, 'LLDPE'], [/marlex|hma\s?0/i, 'HDPE'], [/7032/i, 'PP'], [/ramapet/i, 'PET'], [/hytrel|skypel/i, 'TPE'], [/ryton/i, 'PPS'],
  ];
  const NUMWORDS = { ein: 1, eine: 1, einen: 1, one: 1, a: 1, zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, fünf: 5, five: 5, sechs: 6, six: 6,
    sieben: 7, seven: 7, acht: 8, eight: 8, neun: 9, nine: 9, zehn: 10, ten: 10, zwölf: 12, twelve: 12, fünfzehn: 15, fifteen: 15, zwanzig: 20, twenty: 20,
    dreißig: 30, thirty: 30, vierzig: 40, forty: 40, fünfzig: 50, fifty: 50 };

  function parseMaterial(text) {
    const s = String(text ?? '');
    let family = '';
    for (const [f, re] of FAMILIES) if (re.test(s)) { family = f; break; }
    if (!family) for (const [re, f] of TRADE) if (re.test(s)) { family = f; break; }
    // filler: GF30, GF 30, "30% Glasfaser", "glass fibre 30", Zytel-style "G30"
    let filler = '';
    let m = s.match(/\b(GF|GB|CF|MD|T)\s?-?\s?(\d{2})\b/i) || s.match(/\b(\d{2})\s?%?\s?(?:glas(?:s)?\s?fa(?:ser|ser)|glass\s?fib(?:re|er))/i);
    if (m) filler = m[2] ? `${m[1].toUpperCase()}${m[2]}` : `GF${m[1]}`;
    else if ((m = s.match(/\d{2}G(\d{2})/))) filler = `GF${m[1]}`;
    else if (/glas(s)?\s?fa(s)?er|glass\s?fib/i.test(s)) filler = 'GF30';
    const props = [];
    if (/\bV-?0\b|\bFR\b|flamm|flame/i.test(s)) props.push('FR');
    if (/\bHS\b|\bHSL\b|G\d{2}HSL?|wärmestab|heat[- ]?stab/i.test(s)) props.push('HS');
    if (/\bfood\b|lebensmittel|\bFDA\b|10\/2011/i.test(s)) props.push('food');
    if (/\bUV\b/i.test(s)) props.push('UV');
    const hard = (s.match(/\b(\d{2})\s?D\b/) || [])[1] || '';
    let color = '';
    if (/\bblack\b|schwarz|\bBK\d*\b/i.test(s)) color = 'black';
    else if (/natural|natur\b|\bNC\d*\b/i.test(s)) color = 'natural';
    return { family, filler, props, color, hard };
  }
  const describe = p => [p.family, p.filler, p.hard && `${p.hard}D`, ...p.props.filter(x => x !== 'food'), p.props.includes('food') ? 'food' : ''].filter(Boolean).join(' ');

  // ------------------------------------------------------------------ uploads (Excel, CSV, JSON APIs)
  const key = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
  const SYN = {
    customer: ['customer', 'kunde', 'client', 'account', 'company', 'firma', 'abnehmer', 'buyer', 'kundenname', 'accountname'],
    material: ['material', 'werkstoff', 'polymer', 'kunststoff', 'product', 'produkt', 'spec', 'specification', 'spezifikation', 'description', 'beschreibung', 'artikelbezeichnung', 'bezeichnung', 'type', 'typ'],
    grade: ['grade', 'type', 'handelsname', 'tradename', 'marke', 'brand', 'modell', 'model', 'artikel', 'item'],
    producer: ['producer', 'hersteller', 'manufacturer', 'supplier', 'lieferant', 'vendor', 'make'],
    qty: ['qty', 'quantity', 'menge', 'mengekg', 'qtykg', 'kg', 'tonnen', 'tons', 'tonnes', 't', 'amount', 'volume', 'bestand', 'stock', 'available', 'verfugbar', 'verfuegbar'],
    week: ['week', 'kw', 'needed', 'neededby', 'bedarf', 'bedarfab', 'date', 'datum', 'eta', 'due', 'liefertermin', 'deliverydate', 'availablefrom', 'verfugbarab', 'verfuegbarab', 'lieferwoche'],
    alternatives: ['alternatives', 'alternativen', 'alternativesok', 'equivalent', 'gleichwertig', 'equivalentok'],
    approved: ['approved', 'approvedonly', 'freigegeben', 'freigabe', 'gradelocked', 'nurfreigabe'],
    never: ['never', 'neverpitch', 'nie', 'exclude', 'ausschluss', 'notfrom', 'nichtvon'],
    price: ['price', 'preis', 'pricekg', 'preiskg', 'eurkg', 'priceeurkg', 'preiseurkg', 'listprice', 'listenpreis', 'unitprice', 'eur'],
    margin: ['margin', 'marge', 'marginpct', 'margepct', 'db', 'deckungsbeitrag'],
    sku: ['sku', 'artikelnr', 'artikelnummer', 'materialnr', 'materialnummer', 'partnumber', 'itemno', 'id'],
  };
  function mapHeaders(headers) {
    const map = {}, used = new Set();
    for (const pass of ['exact', 'prefix']) {
      for (const h of headers) {
        if (used.has(h)) continue;
        const k = key(h); let best = null, len = 0;
        for (const [field, syns] of Object.entries(SYN)) {
          if (map[field]) continue;
          for (const s of syns) {
            const hit = pass === 'exact' ? k === s : (s.length >= 3 && k.startsWith(s));
            if (hit && s.length > len) { best = field; len = s.length; }
          }
        }
        if (best) { map[best] = h; used.add(h); }
      }
    }
    return map;
  }
  const num = v => {
    if (typeof v === 'number') return v;
    let s = String(v ?? '').trim().replace(/[^\d.,-]/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
    const n = parseFloat(s); return Number.isFinite(n) ? n : 0;
  };
  const TODAY = new Date();
  const isoWeek = d => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y0) / 864e5 + 1) / 7); };
  const NOW_WK = isoWeek(TODAY);
  const MONTHS = ['jan', 'feb', 'm(a|ä)r', 'apr', 'ma[iy]', 'jun', 'jul', 'aug', 'sep', 'o[ck]t', 'nov', 'de[cz]'];
  function weekOf(v, fallback) {
    if (v === '' || v == null) return fallback;
    let d = null;
    if (v instanceof Date) d = v;
    else if (typeof v === 'number') { if (v > 20000) d = new Date(Math.round((v - 25569) * 864e5)); else if (v >= 1 && v <= 53) return (Math.round(v) - NOW_WK + 52) % 52; }
    else {
      const s = String(v).trim(); let m;
      if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) d = new Date(+m[1], m[2] - 1, +m[3]);
      else if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/))) d = new Date(m[3].length === 2 ? 2000 + +m[3] : +m[3], m[2] - 1, +m[1]);
      else if ((m = s.match(/(\d{1,2})/)) && /kw|w|week/i.test(s)) return (+m[1] - NOW_WK + 52) % 52;
      else if (/sofort|now|stock|lager|asap/i.test(s)) return 0;
    }
    if (!d || isNaN(d)) return fallback;
    return Math.max(0, Math.round((d - TODAY) / (7 * 864e5)));
  }
  // spoken or written timing: "KW 46", "calendar week 46", "in drei Wochen", "next week", "Ende November"
  function weekFromText(s) {
    let m;
    if ((m = s.match(/\b(?:KW|kalenderwoche|calendar week|week|woche)\s?(\d{1,2})\b/i))) return (+m[1] - NOW_WK + 52) % 52;
    if ((m = s.match(/\bin\s(\d{1,2}|\w+)\s(?:wochen|weeks)\b/i))) { const n = /^\d+$/.test(m[1]) ? +m[1] : NUMWORDS[m[1].toLowerCase()]; if (n) return n; }
    if (/nächste(n)? woche|next week/i.test(s)) return 1;
    if (/sofort|asap|diese woche|this week|so schnell/i.test(s)) return 0;
    if (/nächsten monat|next month/i.test(s)) return 4;
    for (let i = 0; i < 12; i++) {
      const re = new RegExp(`(anfang|mitte|ende|early|mid|end of|end)?\\s?(${MONTHS[i]})[a-zä]*\\b`, 'i');
      if ((m = s.match(re)) && /\b(jan|feb|m(a|ä)r|apr|mai|may|jun|jul|aug|sep|o[ck]t|nov|de[cz])/i.test(m[0])) {
        const pos = /anfang|early/i.test(m[1] || '') ? 3 : /ende|end/i.test(m[1] || '') ? 25 : 15;
        let d = new Date(TODAY.getFullYear(), i, pos); if (d < TODAY) d = new Date(TODAY.getFullYear() + 1, i, pos);
        return Math.max(0, Math.round((d - TODAY) / (7 * 864e5)));
      }
    }
    return null;
  }
  // "22 Tonnen", "22 t", "5.000 kg", "zwei Lkw" (a silo truck is 24 t)
  function qtyFromText(s) {
    let m = s.match(/(\d+(?:[.,]\d+)?)\s?(t\b|tonnen|tonne|tons?|tonnes)/i);
    if (m) return Math.round(num(m[1].replace(',', '.')) * 1000);
    m = s.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s?(kg|kilo)/i);
    if (m) return Math.round(num(m[1]));
    m = s.match(/\b(\w+)\s(tonnen|tonne|tons|tonnes)\b/i);
    if (m && NUMWORDS[m[1].toLowerCase()]) return NUMWORDS[m[1].toLowerCase()] * 1000;
    m = s.match(/\b(\d+|\w+)\s(lkw|trucks?|silo\w*|züge)\b/i);
    if (m) { const n = /^\d+$/.test(m[1]) ? +m[1] : NUMWORDS[m[1].toLowerCase()]; if (n) return n * 24000; }
    return 0;
  }

  function normalise(side, list, origin) {
    if (!list.length) return [];
    const m = mapHeaders(Object.keys(Object.assign({}, ...list.slice(0, 20))));
    const g = (r, f) => m[f] ? r[m[f]] : '';
    const yes = v => /^(y|yes|ja|j|true|1|x)$/i.test(String(v).trim());
    return list.map(r => {
      const material = String(g(r, 'material') ?? '').trim(), grade = String(g(r, 'grade') ?? '').trim();
      const qRaw = g(r, 'qty'), qKey = key(m.qty || '');
      // a cell with its own unit ("22 t", "2 Lkw", "5.000 kg") wins over the column's unit
      const spoken = typeof qRaw === 'string' ? qtyFromText(qRaw) : 0;
      let qty = spoken || num(qRaw);
      if (!spoken && ['t', 'tonnen', 'tons', 'tonnes'].includes(qKey)) qty *= 1000;
      const base = { material: material || grade, grade, producer: String(g(r, 'producer') ?? '').trim(), qty: Math.round(qty), origin };
      if (side === 'demand') return { ...base, customer: String(g(r, 'customer') ?? '').trim() || '-', week: weekOf(g(r, 'week'), 4), alternatives: m.alternatives ? yes(g(r, 'alternatives')) : true, approved: yes(g(r, 'approved')), never: String(g(r, 'never') ?? ''), channel: 'file' };
      const mg = num(g(r, 'margin'));
      return { ...base, sku: String(g(r, 'sku') ?? ''), week: weekOf(g(r, 'week'), 0), price: num(g(r, 'price')), margin: mg > 1 ? mg / 100 : mg, channel: 'file' };
    }).filter(r => r.qty > 0);
  }

  // ------------------------------------------------------------------ matching (deterministic, explainable)
  const same = (a, b) => key(a) && key(a) === key(b);
  const peFamily = f => ['PE', 'HDPE', 'LDPE', 'LLDPE'].includes(f);
  function fit(d, s) {
    const dp = d._p || (d._p = parseMaterial(`${d.material} ${d.grade}`)), sp = s._p || (s._p = parseMaterial(`${s.material} ${s.grade}`));
    if (!dp.family || !sp.family) return null;
    if (dp.family !== sp.family && !(dp.family === 'PE' && peFamily(sp.family))) return null;
    if (dp.filler !== sp.filler) return null;                                       // GF30 is not GF25 is not unfilled
    if (dp.hard && sp.hard && dp.hard !== sp.hard) return null;                     // TPE shore hardness
    for (const p of ['FR', 'HS', 'food']) if (dp.props.includes(p) && !sp.props.includes(p)) return null;
    if (d.never && String(d.never).split(/[,;/]/).some(n => same(n, s.producer))) return null;
    // grade: an approved (released) grade cannot be swapped; otherwise prefer grade, then producer
    let grade;
    if (d.grade && same(d.grade, s.grade)) grade = 'exact';
    else if (d.approved) return null;
    else if (d.producer && same(d.producer, s.producer)) grade = 'producer';
    else if (!d.grade && !d.producer) grade = 'any';
    else if (d.alternatives) grade = 'alt';
    else return null;
    // colour: natural can be coloured with masterbatch, black stays black
    let colour = 2;
    if (dp.color === 'black' && sp.color === 'natural') colour = 1;
    else if (dp.color && sp.color && dp.color !== sp.color) return null;
    if (s.week > d.week + 2) return null;
    const onTime = s.week <= d.week;
    const score = { exact: 12, producer: 7, any: 5, alt: 3 }[grade] + colour * 2 + (onTime ? 3 : 0);
    return { grade, colour, onTime, score };
  }

  function match(demandRows, supplyRows) {
    const supply = supplyRows.map(s => ({ ...s, left: s.qty }));
    const hasPrice = supply.some(s => s.price > 0);
    const avg = {};
    for (const s of supply) { const f = (s._p || (s._p = parseMaterial(`${s.material} ${s.grade}`))).family; avg[f] = avg[f] || [0, 0]; avg[f][0] += s.price || 0; avg[f][1]++; }
    const avgPrice = d => { const f = parseMaterial(`${d.material} ${d.grade}`).family; return hasPrice ? (avg[f] ? avg[f][0] / avg[f][1] : 2) : 1; };
    // approved-grade needs first (no substitute exists), then by date, then by value
    const demand = demandRows.map((d, i) => ({ ...d, id: i, matched: 0 }))
      .sort((a, b) => (b.approved ? 1 : 0) - (a.approved ? 1 : 0) || a.week - b.week || b.qty * avgPrice(b) - a.qty * avgPrice(a));
    const matches = [];
    for (const d of demand) {
      const cands = supply.map(s => ({ s, f: fit(d, s) })).filter(c => c.f)
        .sort((a, b) => b.f.score - a.f.score || a.s.week - b.s.week || b.s.left - a.s.left);
      let need = d.qty, used = 0;
      for (const { s, f } of cands) {
        if (need <= 0 || used >= 3) break;
        if (s.left <= 0) continue;
        const q = Math.min(need, s.left);
        s.left -= q; need -= q; used++;
        matches.push({ d, s, qty: q, value: q * (hasPrice ? s.price : 1), margin: q * (s.price || 0) * (s.margin || 0), ...f });
      }
      d.matched = d.qty - need;
      d.gapValue = need * avgPrice(d);
    }
    const idle = supply.filter(s => s.left > 0 && s.week === 0).map(s => ({ s, qty: s.left, value: s.left * (s.price || 1) }));
    return { demand, supply, matches, idle, hasPrice, hasMargin: hasPrice && supply.some(s => s.margin > 0) };
  }

  // ------------------------------------------------------------------ the reverse: surplus stock
  // stock on hand that no demand claimed, the customers whose specs it fits, and whether moving it keeps the margin
  const FLOOR = .05, GOOD = .08; // margin floor (as in the app) and what counts as a good margin
  function surplus(result) {
    return result.supply.filter(s => s.left > 0 && s.week === 0).map(s => {
      const sp = s._p || (s._p = parseMaterial(`${s.material} ${s.grade}`));
      const by = new Map();
      for (const d of result.demand) {
        const dp = d._p || (d._p = parseMaterial(`${d.material} ${d.grade}`));
        if (d.never && String(d.never).split(/[,;/]/).some(n => same(n, s.producer))) continue;
        // timing does not matter here: the lot is already in stock. Same family and filler but another released grade: the customer has to approve it
        const kind = fit({ ...d, week: 99 }, s) ? 'fit' : (dp.family === sp.family && dp.filler === sp.filler) ? 'approval' : null;
        if (!kind) continue;
        const c = by.get(d.customer) || { name: d.customer, kind, volume: 0, channel: d.channel };
        if (kind === 'fit') c.kind = 'fit';
        c.volume += d.qty; by.set(d.customer, c);
      }
      const buyers = [...by.values()].sort((a, b) => (a.kind === 'fit' ? 0 : 1) - (b.kind === 'fit' ? 0 : 1) || b.volume - a.volume).slice(0, 4);
      // what each buyer could take: about what they order of this kind, until the lot is gone
      let left = s.left;
      for (const b of buyers) { b.qty = Math.min(left, Math.max(1000, Math.round(b.volume / 1000) * 1000)); left -= b.qty; }
      const placed = s.left - left, m = s.margin || 0, price = result.hasPrice ? s.price : 1;
      const verdict = !buyers.length ? 'none' : !result.hasMargin || m >= GOOD ? 'offer' : m >= FLOOR ? 'volume' : 'hold';
      return { s, qty: s.left, value: s.left * price, placed, placedValue: placed * price, margin: m, marginValue: placed * (s.price || 0) * m, buyers, verdict }; // buyers with qty 0 are further options once the first ones say no
    });
  }

  window.Engine = { parseMaterial, describe, normalise, match, fit, surplus, FLOOR, weekOf, weekFromText, qtyFromText, isoWeek, NOW_WK, TODAY, key, num };
})();
