/* Two page sections for the beauty variants, filled into #ingest and #play:
   1. Ingestion: three groups of source apps (communication, work, record) wired into a laptop that shows the live app.
   2. Play: the full interactive app in a frame, with "click to interact" and fullscreen, like a product playground. */
(() => {
  const BASE = window.SHARED_BASE || '../shared/';
  const lang = () => window.UI?.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  // [name, simple-icons slug or null, phosphor glyph, brand colour]
  const GROUPS = [
    { id: 'comm', t: () => L('System of Communication', 'Kommunikation'),
      main: [['Outlook', null, 'microsoft-outlook-logo', '#0F6CBD'], ['WhatsApp', 'whatsapp', null, '#25D366'], ['Teams', null, 'microsoft-teams-logo', '#5B5FC7']],
      more: [['Gmail', 'gmail', null, '#EA4335'], ['Slack', 'slack', null, '#E01E5A'], ['WeChat', 'wechat', null, '#07C160'], ['Telegram', 'telegram', null, '#26A5E4'], ['Signal', 'signal', null, '#3B45FD'], ['Zoom', 'zoom', null, '#0B5CFF'], ['Google Meet', 'googlemeet', null, '#00897B'], [L('Live calls', 'Live-Anrufe'), null, 'phone-call', 'var(--d)'], ['SMS', null, 'chat-circle-dots', '#7fd1a3']] },
    { id: 'work', t: () => L('System of Work', 'Arbeitsdokumente'),
      main: [['Word', null, 'microsoft-word-logo', '#185ABD'], ['Excel', null, 'microsoft-excel-logo', '#107C41'], ['PDF', null, 'file-pdf', '#E2231A']],
      more: [['Google Sheets', 'googlesheets', null, '#34A853'], ['Google Docs', 'googledocs', null, '#4285F4'], ['Google Drive', 'googledrive', null, '#4285F4'], ['Notion', 'notion', null, '#e9e9e9'], ['Dropbox', 'dropbox', null, '#0061FF'], ['Box', 'box', null, '#0061D5'], ['Confluence', 'confluence', null, '#2684FF'], ['CSV', null, 'file-csv', '#9be0b8'], ['Scans', null, 'scan', '#c6c9cf']] },
    { id: 'record', t: () => L('System of Record', 'ERP & CRM'),
      main: [['SAP', 'sap', null, '#0FAAFF'], ['Oracle', 'oracle', null, '#C74634'], ['Dynamics 365', null, 'squares-four', '#0B53CE']],
      more: [['Biesterfeld CRM', 'biesterfeld', null, '#cb3f1d'], ['HubSpot', 'hubspot', null, '#FF7A59'], ['Odoo', 'odoo', null, '#A0629A'], ['Sage', 'sage', null, '#00D639'], ['Zoho', 'zoho', null, '#E42527'], ['DATEV', 'datev', null, '#9BD547'], ['EDI', null, 'swap', '#c6c9cf'], [L('Producer portals', 'Herstellerportale'), null, 'factory', '#cfe0ee'], ['API', null, 'plugs-connected', 'var(--d)']] },
  ];
  const glyph = ([name, slug, icon, color], white) => slug
    ? `<span class="ig-logo" style="--c:${white ? '#fff' : color};-webkit-mask-image:url(${BASE}logos/${slug}.svg);mask-image:url(${BASE}logos/${slug}.svg)" role="img" aria-label="${name}"></span>`
    : `<span class="ig-ph" style="--c:${white ? '#fff' : color}" role="img" aria-label="${name}">${ph(icon)}</span>`;

  // ------------------------------------------------------------------ ingestion
  function ingest(host) {
    host.innerHTML = `<div class="wrap">
      <h2 class="h2 reveal ig-h" data-l="h"></h2>
      <div class="ig-stage reveal">
        <div class="ig-groups">${GROUPS.map(g => `<div class="ig-grp" data-g="${g.id}"><span class="ig-label" data-l="${g.id}"></span><div class="ig-tiles">
            ${g.main.map((s, i) => `<div class="ig-tile" style="--c:${s[3]};--i:${i}" title="${s[0]}">${glyph(s, true)}<em>${s[0]}</em></div>`).join('')}
            <div class="ig-more" style="--i:3">${g.more.map(s => `<span title="${s[0]}">${glyph(s)}</span>`).join('')}</div></div></div>`).join('')}</div>
        <svg class="ig-wires" aria-hidden="true"></svg>
        <button class="ig-laptop" type="button" aria-label="Open the product">
          <span class="ig-screen"><span class="ig-cam"></span><span class="ig-app"></span></span><span class="ig-base"><i></i></span>
          <span class="ig-cta" data-l="cta"></span>
        </button>
      </div></div>`;
    const texts = () => {
      host.querySelector('[data-l="h"]').textContent = L('Everything that comes in. One place.', 'Alles, was reinkommt. An einem Ort.');
      host.querySelector('[data-l="cta"]').innerHTML = `${L('Try it below', 'Unten ausprobieren')} ${ph('arrow-down')}`;
      GROUPS.forEach(g => { host.querySelector(`[data-l="${g.id}"]`).textContent = g.t(); });
    };
    texts(); window.UI?.onLang(texts);

    // the laptop shows the real app, scaled down and read-only
    const screen = host.querySelector('.ig-app');
    const mini = document.createElement('div'); mini.className = 'ig-app-in'; screen.append(mini);
    window.BFApp.mount(mini, { mini: true });
    const fit = () => { const w = screen.clientWidth; mini.style.transform = `scale(${w / 1280})`; };
    new ResizeObserver(fit).observe(screen); fit();
    host.querySelector('.ig-laptop').addEventListener('click', () => document.getElementById('play')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

    // wires: each group curves into one trunk that enters the laptop
    const svg = host.querySelector('.ig-wires'), stage = host.querySelector('.ig-stage');
    function wire() {
      const s = stage.getBoundingClientRect(), lap = host.querySelector('.ig-screen').getBoundingClientRect();
      if (getComputedStyle(svg).display === 'none') return;
      svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
      const ex = lap.left - s.left - 6, ey = lap.top - s.top + lap.height / 2, r = 26;
      const gx = Math.max(...[...host.querySelectorAll('.ig-grp')].map(g => g.getBoundingClientRect().right - s.left)), mid = (gx + ex) / 2;
      let html = `<defs><linearGradient id="ig-g" x1="0" x2="1"><stop offset="0" stop-color="rgb(255 255 255 / .16)"/><stop offset="1" style="stop-color:var(--d);stop-opacity:.7"/></linearGradient></defs>`;
      [...host.querySelectorAll('.ig-tiles')].forEach((t, i) => {
        const b = t.getBoundingClientRect(), sx = gx, sy = b.top - s.top + b.height / 2;
        const dir = Math.abs(ey - sy) < r * 2 ? 0 : Math.sign(ey - sy);
        const d = dir === 0 ? `M${sx} ${sy}L${mid} ${sy}L${mid + r} ${ey}H${ex}` : `M${sx} ${sy}H${mid - r}Q${mid} ${sy} ${mid} ${sy + dir * r}V${ey - dir * r}Q${mid} ${ey} ${mid + r} ${ey}H${ex}`;
        html += `<path class="w-base" d="${d}"/><path class="w-flow" d="${d}" style="animation-delay:${-i * .4}s"/>`;
        if (!reduced) for (let k = 0; k < 2; k++) html += `<circle r="3.2" class="w-pel ${k ? 's' : 'd'}"><animateMotion dur="${3.2 + i * .35}s" begin="${-(k * 1.6 + i * .5)}s" repeatCount="indefinite" path="${d}"/></circle>`;
      });
      svg.innerHTML = html;
    }
    new ResizeObserver(wire).observe(stage); wire(); setTimeout(wire, 600);
  }

  // ------------------------------------------------------------------ play
  function play(host) {
    host.innerHTML = `<div class="wrap"><h2 class="h2 reveal play-h" data-l="h"></h2></div>
      <div class="play-wrap reveal"><div class="play-frame">
        <div class="play-app"></div>
        <button class="play-overlay" type="button"><span>${ph('cursor-click')}<b data-l="click"></b></span></button>
        <button class="play-expand" type="button" aria-label="Fullscreen">${ph('corners-out')}</button>
      </div></div>`;
    const texts = () => { host.querySelector('[data-l="h"]').textContent = window.UI_TEXT?.[lang()]?.h2_play || L('Play with the product.', 'Probieren Sie das Produkt aus.'); host.querySelector('[data-l="click"]').textContent = L('Click to interact', 'Zum Ausprobieren klicken'); };
    texts(); window.UI?.onLang(texts);
    const frame = host.querySelector('.play-frame'), app = window.BFApp.mount(host.querySelector('.play-app'));
    let toured = false;
    host.querySelector('.play-overlay').addEventListener('click', e => {
      frame.classList.add('live');
      // a first click on a control goes straight to it; a click anywhere else starts the tour
      const under = e.clientX || e.clientY ? document.elementFromPoint(e.clientX, e.clientY) : null;
      const ctl = under?.closest('.play-app button, .play-app [data-act], .play-app input, .play-app select');
      if (ctl) { if (ctl.matches('input, select')) ctl.focus(); else ctl.click(); return; }
      if (!toured) { toured = true; setTimeout(() => app.startTour(), reduced ? 0 : 350); }
    });
    host.querySelector('.play-expand').addEventListener('click', async () => {
      frame.classList.add('live');
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await frame.requestFullscreen(); } catch (e) { /* not allowed in this context */ }
    });
    // "Drop your export" on pages without the How section opens the app's upload
    document.addEventListener('bf:start', () => {
      host.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(() => { frame.classList.add('live'); toured = true; app.openNew(); }, reduced ? 0 : 650);
    });
    // "Show me" in the workday section opens the app on that screen
    document.addEventListener('bf:open', e => {
      host.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      frame.classList.add('live'); toured = true;
      setTimeout(() => app.open(e.detail), reduced ? 0 : 450);
    });
    document.addEventListener('fullscreenchange', () => { host.querySelector('.play-expand').innerHTML = ph(document.fullscreenElement ? 'corners-in' : 'corners-out'); });
  }

  const i = document.getElementById('ingest'); if (i) ingest(i);
  const p = document.getElementById('play'); if (p) play(p);
  // fade in on their own, so a failing page script can never leave these sections invisible
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  [i, p].filter(Boolean).forEach(h => h.querySelectorAll('.reveal').forEach(el => io.observe(el)));
})();
