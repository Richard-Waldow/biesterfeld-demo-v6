/* A Gantt chart for opportunities, shared by the product app (Opportunities) and the page section #plan.
   BFGantt.html({ rows, from, weeks, lang, sum, click }) returns the markup; hovering any bar or marker shows its details.
   A row: { label, sub, value, prob, group, late, open: [act, id], line: true (a running account),
            phases: [{ k, from, to, t }], marks: [{ k, at, t }] }
   Phase kinds: qual, sample, offer, wait, deliv, serial. Marker kinds: close, check, esc, order.
   Phase colours stay solid up to today and turn light after it, so done and planned read apart at a glance. */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 864e5;
  const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const kw = d => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - n); const y = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y) / DAY + 1) / 7); };

  const TXT = {
    de: { qual: 'Bedarf klären', sample: 'Bemusterung & Freigabe', offer: 'Angebot', wait: 'Beim Kunden', deliv: 'Lieferung', serial: 'Serienbedarf',
      close: 'Entscheidung', check: 'Check-in', esc: 'Eskalation', order: 'Erwartete Bestellung', today: 'Heute', week: 'KW', sum: 'Erwarteter Abschluss, gewichtet', prob: 'Wahrsch.', value: 'Wert' },
    en: { qual: 'Clarify demand', sample: 'Sampling & approval', offer: 'Offer', wait: 'With the customer', deliv: 'Delivery', serial: 'Series demand',
      close: 'Decision', check: 'Check-in', esc: 'Escalation', order: 'Expected order', today: 'Today', week: 'W', sum: 'Expected to close, weighted', prob: 'Prob.', value: 'Value' },
  };
  const MON = { de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
  const MARK_IC = { close: 'flag-checkered', check: 'phone', esc: 'warning', order: 'package' };

  function html({ rows, from = new Date(), weeks = 18, lang = 'de', sum = false, click = true, now = new Date(), money = v => `€ ${Math.round(v / 1000)}k`, legend = true }) {
    const t = TXT[lang] || TXT.de, start = monday(from), end = new Date(+start + weeks * 7 * DAY), span = end - start;
    const pct = d => Math.max(0, Math.min(100, (d - start) / span * 100));
    const nowP = pct(now), date = d => d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    // month bands over the week columns
    const months = [];
    for (let i = 0; i < weeks; i++) { const d = new Date(+start + i * 7 * DAY + 3 * DAY), k = `${d.getFullYear()}-${d.getMonth()}`; const m = months[months.length - 1]; if (m?.k === k) m.n++; else months.push({ k, n: 1, d }); }
    const head = `<div class="gx-head"><div class="gx-lab"></div><div class="gx-cal">
        <div class="gx-months" style="grid-template-columns:${months.map(m => `${m.n}fr`).join(' ')}">${months.map(m => `<span>${MON[lang][m.d.getMonth()]}${m.d.getMonth() === 0 || m === months[0] ? ` ${String(m.d.getFullYear()).slice(2)}` : ''}</span>`).join('')}</div>
        <div class="gx-weeks" style="grid-template-columns:repeat(${weeks},1fr)">${Array.from({ length: weeks }, (_, i) => { const d = new Date(+start + i * 7 * DAY); return `<span class="${now >= d && now < new Date(+d + 7 * DAY) ? 'on' : ''}">${kw(d)}</span>`; }).join('')}</div></div></div>`;
    const tipAttr = (title, lines) => `data-gtip="${esc([title, ...lines.filter(Boolean)].join('\n'))}"`;
    const bar = (r, p) => {
      const a = pct(p.from), b = pct(p.to); if (b <= 0 || a >= 100 || b - a < .2) return '';
      const cut = p.to <= now ? 100 : p.from >= now ? 0 : (now - p.from) / (p.to - p.from) * 100;
      const open = p.to > end ? ' open' : '';
      const room = (Math.min(b, 100) - Math.max(a, 0)) / 100 * weeks >= 1.5; // a label needs about a week and a half
      return `<span class="gx-ph k-${p.k}${open}" style="left:${a}%;width:${b - a}%;--cut:${cut}%" ${tipAttr(p.t || t[p.k], [`${t[p.k]} · ${date(p.from)} – ${date(p.to)}`, r.label])}>${room ? `<em>${esc(p.t || t[p.k])}</em>` : ''}</span>`;
    };
    const mark = (r, m) => { const x = pct(m.at); if (m.at < start || m.at > end) return ''; return `<span class="gx-mk k-${m.k}" style="left:${x}%" ${tipAttr(m.t || t[m.k], [`${t[m.k]} · ${date(m.at)}`, r.label])}>${m.k === 'order' && m.q ? `<em>${esc(m.q)}</em>` : `<i class="ph-light ph-${MARK_IC[m.k]}"></i>`}</span>`; };
    let group = null;
    const body = rows.map((r, i) => {
      const g = r.group && r.group !== group ? `<div class="gx-group"><span>${esc(r.group)}</span></div>` : ''; group = r.group || group;
      const act = click && r.open ? ` data-act="${esc(r.open[0])}" data-id="${esc(r.open[1])}"` : '';
      return `${g}<div class="gx-row${r.late ? ' late' : ''}" style="--i:${i}">
        <${act ? 'button' : 'div'} class="gx-lab"${act}><b>${esc(r.label)}</b><small>${esc(r.sub || '')}</small>${r.value ? `<span class="gx-val">${esc(money(r.value))}${r.prob != null ? `<u>${r.prob} %</u>` : ''}</span>` : ''}</${act ? 'button' : 'div'}>
        <div class="gx-track">${r.line ? `<span class="gx-line"></span>` : ''}${(r.phases || []).map(p => bar(r, p)).join('')}${(r.marks || []).map(m => mark(r, m)).join('')}</div></div>`;
    }).join('');
    // weighted value by the month it is expected to close
    let foot = '';
    if (sum) {
      const per = months.map(() => 0);
      for (const r of rows) {
        const c = r.close || (r.marks || []).find(m => m.k === 'close' || m.k === 'order')?.at; if (!c || !r.value) continue;
        const i = months.findIndex(m => +m.d.getFullYear() === c.getFullYear() && m.d.getMonth() === c.getMonth()); if (i >= 0) per[i] += r.value * (r.prob ?? 100) / 100;
      }
      const max = Math.max(...per, 1);
      foot = `<div class="gx-sum"><div class="gx-lab"><b>${t.sum}</b></div><div class="gx-sumcols" style="grid-template-columns:${months.map(m => `${m.n}fr`).join(' ')}">${per.map(v => `<span>${v ? `<i style="height:${Math.max(4, Math.round(v / max * 100))}%"></i>` : ''}<b>${v ? esc(money(v)) : '–'}</b></span>`).join('')}</div></div>`;
    }
    const leg = legend ? `<div class="gx-legend">${['qual', 'sample', 'offer', 'wait', 'deliv'].map(k => `<span><i class="sw k-${k}"></i>${t[k]}</span>`).join('')}${['check', 'esc', 'close', 'order'].map(k => `<span><i class="gx-mk k-${k} in"><i class="ph-light ph-${MARK_IC[k]}"></i></i>${t[k]}</span>`).join('')}</div>` : '';
    return `<div class="gx">${leg}<div class="gx-scroll"><div class="gx-in">${head}<div class="gx-body" style="--now:${nowP}">
      <span class="gx-today" style="left:calc(var(--lab) + (100% - var(--lab)) * ${nowP / 100})"><em>${t.today}</em></span>
      ${(() => { let s = ''; for (let i = 1; i < weeks; i++) s += `<span class="gx-grid" style="left:calc(var(--lab) + (100% - var(--lab)) * ${i / weeks})"></span>`; return s; })()}
      ${body}</div>${foot}</div></div></div>`;
  }

  // one tooltip for every chart on the page
  let tip;
  const show = (el, x, y) => {
    if (!tip) { tip = document.createElement('div'); tip.className = 'gx-tip'; tip.setAttribute('role', 'tooltip'); }
    const parent = document.fullscreenElement || document.body; // the product can run full screen
    if (tip.parentNode !== parent) parent.append(tip);
    const [h, ...rest] = el.dataset.gtip.split('\n');
    tip.innerHTML = `<b>${esc(h)}</b>${rest.map(l => `<span>${esc(l)}</span>`).join('')}`;
    tip.classList.add('on');
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    tip.style.left = `${Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2))}px`;
    tip.style.top = `${y - hh - 14 < 8 ? y + 18 : y - hh - 14}px`;
  };
  document.addEventListener('pointerover', e => { const el = e.target.closest?.('[data-gtip]'); if (el) { const r = el.getBoundingClientRect(); show(el, e.clientX || r.left + r.width / 2, r.top); } });
  document.addEventListener('pointerout', e => { if (e.target.closest?.('[data-gtip]') && !e.relatedTarget?.closest?.('[data-gtip]')) tip?.classList.remove('on'); });
  document.addEventListener('scroll', () => tip?.classList.remove('on'), true);

  window.BFGantt = { html, monday, DAY };
})();
