/* Live call: record, transcribe in real time, extract demand lines while people talk.
   Speech-to-text: the browser's own recogniser by default, Deepgram when the local server has a key.
   Extraction: instant rules in the browser, refined by Claude when the local server can reach it. */
(() => {
  const E = window.Engine, S = window.SAMPLE, U = window.UI;
  const $ = (s, r = document) => r.querySelector(s);
  const ph = U.ph, esc = U.esc;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const W = {
    en: { title: 'Live call', who: 'Customer', demo: 'Play demo call', rec: 'Record', stop: 'Stop', add: n => `Add ${n} to demand`,
      empty: 'Start talking. Materials, quantities and dates appear here as they are said.', listening: 'Listening', stt: 'Speech', ext: 'Extraction',
      browser: 'Browser', rules: 'Rules', nomic: 'Speech recognition needs Chrome or the local server with a Deepgram key.', thinking: 'Claude is reading', need: 'needed', qtyq: 'quantity?',
      eq: 'Equivalent OK', approved: 'Approved grade', weeks: w => w === 0 ? 'now' : `in ${w} wk`, rep: 'Biesterfeld', you: 'Customer' },
    de: { title: 'Live-Anruf', who: 'Kunde', demo: 'Demo-Anruf abspielen', rec: 'Aufnehmen', stop: 'Stopp', add: n => `${n} zur Nachfrage hinzufügen`,
      empty: 'Einfach sprechen. Werkstoffe, Mengen und Termine erscheinen hier, sobald sie fallen.', listening: 'Hört zu', stt: 'Sprache', ext: 'Extraktion',
      browser: 'Browser', rules: 'Regeln', nomic: 'Spracherkennung braucht Chrome oder den lokalen Server mit Deepgram-Schlüssel.', thinking: 'Claude liest mit', need: 'Bedarf', qtyq: 'Menge?',
      eq: 'Gleichwertig OK', approved: 'Freigegebene Type', weeks: w => w === 0 ? 'sofort' : `in ${w} Wo.`, rep: 'Biesterfeld', you: 'Kunde' },
  };
  const w = k => (W[U.lang] || W.en)[k];

  const SCRIPT = {
    de: [
      ['rep', 'Biesterfeld, Brandt, guten Tag.'],
      ['cust', 'Hallo Herr Brandt, Kessler von Rheinform. Wir haben einen neuen Abruf von unserem OEM bekommen.'],
      ['cust', 'Wir brauchen 22 Tonnen PA66 GF30, wärmestabilisiert, schwarz, in vier Wochen.'],
      ['cust', 'Freigegeben ist das Zytel 70G30HSL, ein gleichwertiges Material würden wir uns aber anschauen.'],
      ['rep', 'Verstanden. Brauchen Sie sonst noch etwas?'],
      ['cust', 'Ja, noch 6 Tonnen PBT GF30 schwarz, gerne Crastin, Ende November.'],
      ['rep', 'Ich prüfe Bestand und Zulauf und melde mich heute noch.'],
    ],
    en: [
      ['rep', 'Biesterfeld, Brandt speaking.'],
      ['cust', 'Hi, Kessler from Rheinform here. We just got a new call-off from our OEM.'],
      ['cust', 'We need 22 tons of PA66 GF30, heat stabilized, black, in four weeks.'],
      ['cust', 'The approved grade is Zytel 70G30HSL, but we would look at an equivalent material.'],
      ['rep', 'Understood. Anything else?'],
      ['cust', 'Yes, another 6 tons of PBT GF30 black, preferably Crastin, end of November.'],
      ['rep', 'I will check stock and inbound and get back to you today.'],
    ],
  };

  // ------------------------------------------------------------------ dialog
  const dlg = document.createElement('dialog');
  dlg.className = 'call-dlg';
  dlg.innerHTML = `
    <div class="cd-head">
      <span class="cd-mic">${ph('microphone')}</span>
      <h3 class="cd-title"></h3>
      <span class="cd-engines"><span class="cd-eng" data-k="stt"></span><span class="cd-eng" data-k="ext"></span></span>
      <button class="cd-x" type="button" aria-label="Close">${ph('x')}</button>
    </div>
    <div class="cd-bar">
      <label class="cd-who"><span class="cd-who-l"></span><select></select></label>
      <button class="btn btn-ghost cd-demo" type="button">${ph('play')}<span></span></button>
      <button class="cd-rec" type="button" aria-pressed="false">${ph('microphone')}<span></span></button>
    </div>
    <div class="cd-body">
      <div class="cd-transcript" aria-live="polite"><p class="cd-empty"></p></div>
      <div class="cd-lines"><div class="cd-wave" aria-hidden="true">${'<i></i>'.repeat(28)}</div><ol></ol></div>
    </div>
    <div class="cd-foot"><p class="cd-note"></p><button class="btn btn-primary cd-add" type="button" disabled></button></div>`;
  document.body.append(dlg);

  const state = { finals: [], interim: '', lines: [], recording: false, source: 'rules', status: null, timer: 0, playing: false, seq: 0 };

  function labels() {
    $('.cd-title', dlg).textContent = w('title');
    $('.cd-who-l', dlg).textContent = w('who');
    $('.cd-demo span', dlg).textContent = w('demo');
    $('.cd-rec span', dlg).textContent = state.recording ? w('stop') : w('rec');
    $('.cd-empty', dlg).textContent = w('empty');
    const sel = $('select', dlg), cur = sel.value;
    sel.innerHTML = U.customers().map(c => `<option>${esc(c)}</option>`).join('');
    sel.value = cur || 'Rheinform Kunststofftechnik GmbH';
    engines();
    renderLines();
  }
  function engines() {
    const st = state.status || {};
    $('[data-k="stt"]', dlg).innerHTML = `${ph('waveform')}${w('stt')}: <b>${st.stt === 'deepgram' ? 'Deepgram' : w('browser')}</b>`;
    $('[data-k="ext"]', dlg).innerHTML = `${ph('sparkle')}${w('ext')}: <b>${st.claude ? esc(st.model_label || 'Claude') : w('rules')}</b>`;
  }

  async function open() {
    if (!state.status) {
      // the public page has no server (window.STATIC_SITE, set by publish-pages.sh): browser speech and rules, no request
      if (window.STATIC_SITE) state.status = { claude: false, stt: 'browser' };
      else try { state.status = await (await fetch('/api/status')).json(); } catch (e) { state.status = { claude: false, stt: 'browser' }; }
    }
    labels();
    dlg.showModal();
  }
  function close() { stopAll(); dlg.close(); }
  $('.cd-x', dlg).addEventListener('click', close);
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  U.onLang(() => { if (dlg.open) labels(); });

  // ------------------------------------------------------------------ transcript
  const GRADES = [...new Map(S.supply.map(s => [s.grade, s])).values()];
  const BRANDWORDS = [...new Set(GRADES.map(g => g.grade.split(' ')[0]))];
  const PRODUCERS = [...new Set(GRADES.map(g => g.producer))];
  const hl = text => esc(text)
    .replace(/\b(PC\/ABS|PA ?66|PA ?6|PA ?12|PBT|PET|POM|PPS|PC|ABS|HDPE|LLDPE|LDPE|PE|PP|TPE|TPU)\b/g, '<mark class="e-mat">$1</mark>')
    .replace(/\b(GF ?\d{2}|V-?0|HS|wärmestabilisiert|heat stabili[sz]ed|schwarz|black|natur(al)?)\b/gi, '<mark class="e-spec">$1</mark>')
    .replace(/(\d+(?:[.,]\d+)?\s?(?:Tonnen|Tonne|tons?|tonnes|t\b|kg)|\b(?:zwei|drei|vier|fünf|two|three|four|five)\s(?:Lkw|trucks?))/gi, '<mark class="e-qty">$1</mark>')
    .replace(/\b(KW ?\d{1,2}|calendar week \d{1,2}|in (?:\d+|zwei|drei|vier|fünf|sechs|two|three|four|five|six) (?:Wochen|weeks)|n(ä|a)chste(n)? Woche|next week|(?:Anfang|Mitte|Ende|end of|early|mid) [A-ZÄ][a-zä]+)\b/gi, '<mark class="e-date">$1</mark>')
    .replace(new RegExp(`\\b(${BRANDWORDS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b(\\s?[A-Z0-9-]{2,}\\w*)?`, 'g'), '<mark class="e-grade">$1$2</mark>');

  function renderTranscript() {
    const box = $('.cd-transcript', dlg);
    if (!state.finals.length && !state.interim) { box.innerHTML = `<p class="cd-empty">${esc(w('empty'))}</p>`; return; }
    box.innerHTML = state.finals.map(f => `<p class="cd-say ${f.who}"><span class="cd-who-tag">${f.who === 'rep' ? w('rep') : f.who === 'cust' ? w('you') : ''}</span>${hl(f.text)}</p>`).join('')
      + (state.interim ? `<p class="cd-say interim">${esc(state.interim)}</p>` : '');
    box.scrollTop = box.scrollHeight;
  }

  // ------------------------------------------------------------------ extraction (rules, instant)
  function extractRules(sentences) {
    const lines = []; let cur = null;
    for (const raw of sentences) {
      const s = raw.text ?? raw;
      const p = E.parseMaterial(s), qty = E.qtyFromText(s), wk = E.weekFromText(s);
      const brand = BRANDWORDS.find(b => new RegExp(`\\b${b}\\b`, 'i').test(s));
      const grades = brand ? GRADES.filter(g => g.grade.startsWith(brand)) : [];
      const eq = /gleichwertig|alternativ|equivalent|alternative|auch andere/i.test(s);
      const appr = /freigegeben|freigabe|approved|released/i.test(s);
      const fresh = p.family && (!cur || qty || cur._p.family !== p.family);
      if (fresh) {
        cur = { _p: p, qty: 0, week: null, grade: '', producer: '', alternatives: true, approved: false, evidence: s };
        lines.push(cur);
      }
      if (!cur) continue;
      if (qty && !cur.qty) cur.qty = qty;
      if (wk != null && cur.week == null) cur.week = wk;
      if (grades.length) {
        const g = grades.find(x => x.material && E.parseMaterial(x.material).family === cur._p.family && (!cur._p.color || E.parseMaterial(x.material).color === cur._p.color)) || grades[0];
        cur.grade = g.grade; cur.producer = g.producer;
      }
      const prod = PRODUCERS.find(x => new RegExp(`\\b${x}\\b`, 'i').test(s)); if (prod && !cur.producer) cur.producer = prod;
      if (appr) { cur.approved = !eq; cur.alternatives = eq; }
      else if (eq) cur.alternatives = true;
    }
    return lines.map(l => ({ material: materialText(l._p), grade: l.grade, producer: l.producer, qty: l.qty, week: l.week ?? 4, weekKnown: l.week != null, alternatives: l.alternatives, approved: l.approved, evidence: l.evidence }));
  }
  const materialText = p => [p.family, p.filler, p.hard && `${p.hard}D`, p.props.includes('FR') && 'V-0', p.props.includes('HS') && 'HS', p.props.includes('food') && 'food', p.color].filter(Boolean).join(' ');

  // ------------------------------------------------------------------ extraction (Claude, via the local server)
  function scheduleClaude() {
    if (!state.status?.claude) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(askClaude, 900);
  }
  async function askClaude() {
    const seq = ++state.seq;
    dlg.classList.add('thinking');
    try {
      const res = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: state.finals.map(f => `${f.who === 'rep' ? 'Biesterfeld' : f.who === 'cust' ? 'Customer' : ''}: ${f.text}`).join('\n'), customer: $('select', dlg).value, lang: U.lang, week: E.NOW_WK, today: E.TODAY.toISOString().slice(0, 10) }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (seq !== state.seq) return;
      state.lines = data.lines.map(l => ({ material: l.material, grade: l.grade, producer: l.producer, qty: l.quantity_kg, week: l.needed_in_weeks >= 0 ? l.needed_in_weeks : 4, weekKnown: l.needed_in_weeks >= 0, alternatives: l.equivalent_ok, approved: l.approved_grade_only, evidence: l.evidence }));
      state.source = 'claude';
      renderLines();
    } catch (e) {
      console.warn('[call] Claude extraction unavailable, staying on rules', e);
      state.status.claude = false; engines();
    } finally { if (seq === state.seq) dlg.classList.remove('thinking'); }
  }

  function onFinal(text, who = '') {
    state.finals.push({ text: text.trim(), who });
    state.interim = '';
    renderTranscript();
    // rules give an instant answer; Claude refines it a moment later
    state.lines = extractRules(state.finals.filter(f => f.who !== 'rep'));
    state.source = 'rules';
    renderLines();
    scheduleClaude();
  }

  function renderLines() {
    const ol = $('.cd-lines ol', dlg);
    ol.innerHTML = state.lines.map((l, i) => {
      const p = E.parseMaterial(l.material);
      return `<li class="cd-line" style="animation-delay:${i * 60}ms">
        <div class="cd-l-top"><b class="cd-fam">${esc(p.family || l.material)}</b>${[p.filler, p.hard && `${p.hard}D`, ...p.props.map(x => x === 'FR' ? 'V-0' : x), p.color].filter(Boolean).map(x => `<span class="cd-chip">${esc(x)}</span>`).join('')}</div>
        <div class="cd-l-mid"><span class="cd-qty${l.qty ? '' : ' miss'}">${l.qty ? U.tons(l.qty) : esc(w('qtyq'))}</span><span class="cd-wk${l.weekKnown ? '' : ' miss'}">${ph('calendar-blank')}${esc(w('weeks')(l.week))}</span></div>
        ${l.grade || l.producer ? `<div class="cd-l-grade">${ph(l.approved ? 'lock-simple' : 'tag')}${esc([l.producer, l.grade].filter(Boolean).join(' '))}<em>${esc(l.approved ? w('approved') : l.alternatives ? w('eq') : '')}</em></div>` : ''}
      </li>`;
    }).join('');
    const ok = state.lines.filter(l => l.qty > 0);
    const add = $('.cd-add', dlg);
    add.disabled = !ok.length;
    add.textContent = w('add')(ok.length);
    $('.cd-note', dlg).innerHTML = state.lines.length ? `${ph(state.source === 'claude' ? 'sparkle' : 'list-checks')}${state.source === 'claude' ? esc(state.status?.model_label || 'Claude') : w('rules')}` : '';
    dlg.classList.toggle('has-lines', state.lines.length > 0);
  }

  $('.cd-add', dlg).addEventListener('click', () => {
    const customer = $('select', dlg).value;
    const rows = state.lines.filter(l => l.qty > 0).map(l => ({ customer, material: l.material, grade: l.grade, producer: l.producer, qty: l.qty, week: l.week, alternatives: l.alternatives, approved: l.approved, never: '' }));
    U.addDemand(rows, `call:${customer.replace(/ GmbH.*| AG$/, '')}`);
    close();
  });

  // ------------------------------------------------------------------ demo playback (types the script out like live speech)
  $('.cd-demo', dlg).addEventListener('click', async () => {
    if (state.playing) return;
    stopAll(); reset();
    $('select', dlg).value = 'Rheinform Kunststofftechnik GmbH';
    state.playing = true; dlg.classList.add('live');
    for (const [who, text] of SCRIPT[U.lang] || SCRIPT.en) {
      if (!state.playing) break;
      const words = text.split(' ');
      for (let i = 1; i <= words.length && state.playing; i++) { state.interim = words.slice(0, i).join(' '); renderTranscript(); await U.wait(85 + Math.random() * 70); }
      if (!state.playing) break;
      onFinal(text, who);
      await U.wait(450);
    }
    state.playing = false; dlg.classList.remove('live');
  });

  function reset() { state.finals = []; state.interim = ''; state.lines = []; state.seq++; renderTranscript(); renderLines(); }

  // ------------------------------------------------------------------ microphone
  let rec = null, ws = null, media = null, stream = null;
  $('.cd-rec', dlg).addEventListener('click', () => state.recording ? stopAll() : startRec());

  async function startRec() {
    stopAll(); reset();
    try {
      if (state.status?.stt === 'deepgram') await startDeepgram();
      else startBrowser();
      state.recording = true; dlg.classList.add('live');
      $('.cd-rec', dlg).setAttribute('aria-pressed', 'true');
      labels();
    } catch (e) {
      console.warn('[call] could not start recording', e);
      $('.cd-note', dlg).textContent = w('nomic');
    }
  }

  function startBrowser() {
    if (!SR) throw new Error('no SpeechRecognition');
    rec = new SR();
    rec.lang = U.lang === 'de' ? 'de-DE' : 'en-GB';
    rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinal(r[0].transcript); else interim += r[0].transcript;
      }
      state.interim = interim; renderTranscript();
    };
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { $('.cd-note', dlg).textContent = w('nomic'); stopAll(); } };
    rec.onend = () => { if (state.recording && rec) try { rec.start(); } catch (err) { /* already running */ } }; // Chrome stops after silence
    rec.start();
  }

  async function startDeepgram() {
    const tok = await (await fetch('/api/stt-token')).json();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const q = new URLSearchParams({ model: tok.model || 'nova-2', language: U.lang === 'de' ? 'de' : 'en', interim_results: 'true', smart_format: 'true', punctuate: 'true', endpointing: '300' });
    ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${q}`, [tok.scheme, tok.token]);
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.type !== 'Results') return;
      const text = m.channel?.alternatives?.[0]?.transcript || '';
      if (!text) return;
      if (m.is_final) onFinal(text); else { state.interim = text; renderTranscript(); }
    };
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    media = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    media.ondataavailable = e => { if (ws?.readyState === 1 && e.data.size) ws.send(e.data); };
    media.start(250);
  }

  function stopAll() {
    state.playing = false;
    state.recording = false;
    dlg.classList.remove('live');
    $('.cd-rec', dlg).setAttribute('aria-pressed', 'false');
    $('.cd-rec span', dlg).textContent = w('rec');
    if (rec) { const r = rec; rec = null; try { r.stop(); } catch (e) { /* not started */ } }
    if (media && media.state !== 'inactive') media.stop();
    if (ws) { try { ws.send(JSON.stringify({ type: 'CloseStream' })); ws.close(); } catch (e) { /* closed */ } }
    stream?.getTracks().forEach(tr => tr.stop());
    media = ws = stream = null;
    if (state.interim) onFinal(state.interim);
  }

  window.LiveCall = { open };
})();
