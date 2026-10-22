/* "The whole job" section, filled into #workday (version 1 and 2):
   1. Not every message is an offer: 100 incoming messages split by intent and outcome (illustrative numbers).
   2. One guide, three stages: the full path of a quote next to the short path of a document request.
   3. A day with Lena: seven moments from the account manager's day, today vs. with the product, each opening the app on that screen. */
(() => {
  const host = document.getElementById('workday'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const loc = () => (lang() === 'de' ? 'de-DE' : 'en-GB');
  const nf = (n, d = 0) => Number(n).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: d });
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // facts from the same synthetic data the app uses
  const R = window.Engine && window.SAMPLE ? window.Engine.match(window.SAMPLE.demand, window.SAMPLE.supply) : { matches: [] };
  const novaValue = R.matches.filter(m => m.d.customer.startsWith('Novaform')).reduce((a, m) => a + m.value, 0);
  const delayed = new Set(R.matches.filter(m => m.s.grade === 'PP 7032E3' && m.s.week > 0).map(m => m.d.customer)).size;

  // ------------------------------------------------------------------ intent split
  // [key, label, count, outcome, description]
  const INTENTS = () => [
    ['quote', L('Quote request', 'Angebotsanfrage'), 31, 'offer', L('Qualified, matched against stock and inbound, drafted with checks. Then followed up until won or lost.', 'Qualifiziert, mit Lager und Zulauf abgeglichen, mit Prüfungen entworfen. Dann nachgefasst, bis gewonnen oder verloren.')],
    ['calloff', L('Call-off', 'Abruf'), 14, 'offer', L('Framework call-off on an approved grade: matched and turned into an SAP order with one approval.', 'Rahmenabruf auf eine freigegebene Type: abgeglichen und mit einer Freigabe zum SAP-Auftrag.')],
    ['docs', L('Documents', 'Dokumente'), 17, 'answer', L('CoA, SDS, REACH, PPWR. Found in the library and sent in one click. No offer, no opportunity.', 'CoA, SDB, REACH, PPWR. In der Bibliothek gefunden und mit einem Klick gesendet. Kein Angebot, keine Opportunity.')],
    ['price', L('Price check', 'Preisinfo'), 12, 'answer', L('Current price or tiers for 1, 3 or 5 t. Answered as information; an opportunity only once a real need shows.', 'Aktueller Preis oder Staffel für 1, 3 oder 5 t. Als Information beantwortet; eine Opportunity erst bei echtem Bedarf.')],
    ['delivery', L('Delivery status', 'Lieferstatus'), 11, 'answer', L('"When does it arrive?" Answered from SAP. ETA changes trigger an update before the customer asks.', '„Wann kommt es?“ Aus SAP beantwortet. ETA-Änderungen lösen eine Info aus, bevor der Kunde fragt.')],
    ['tech', L('Technical question', 'Technische Frage'), 7, 'expert', L('Checked against the data sheet. A missing value goes to product management with the full thread, never guessed.', 'Gegen das Datenblatt geprüft. Ein fehlender Wert geht mit dem ganzen Verlauf ans Produktmanagement, nie geraten.')],
    ['future', L('Projects and future demand', 'Projekte und künftiger Bedarf'), 8, 'future', L('A new line, a new range. Logged as future demand with a check-in date, without forcing a quote.', 'Eine neue Linie, eine neue Serie. Als künftiger Bedarf mit Kontakttermin erfasst, ohne ein Angebot zu erzwingen.')],
  ];
  const OUT = () => ({ offer: [L('Offer or order', 'Angebot oder Auftrag'), 'd'], answer: [L('Answered, no offer', 'Beantwortet, ohne Angebot'), 's'], expert: [L('Expert involved', 'Experte eingebunden'), 'x'], future: [L('Future pipeline', 'Künftige Pipeline'), 'f'] });

  // the intent split as granules: one pellet per message, poured into four trays by outcome and grouped by intent.
  // Pellets use the hero's shading (--pd-*, --ps-*), so the chart is on brand without repeating the Result chart.
  const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }; // the same tilt on every render
  function board() {
    const I = INTENTS(), O = OUT();
    let k = 0;
    const bins = Object.keys(O).map(o => {
      const groups = I.map((x, i) => ({ x, i })).filter(g => g.x[3] === o), n = groups.reduce((a, g) => a + g.x[2], 0); // tray width follows the share
      const body = groups.map(({ x, i }) => `<div class="wd-grp" data-i="${i}" tabindex="0" aria-label="${esc(`${x[1]}. ${x[4]}`)}">
          <div class="wd-pile" style="--c:${Math.ceil(Math.sqrt(x[2] * 1.3))}">${Array.from({ length: x[2] }, () => { const j = k++; return `<i style="--t:${(rnd(j) * 50 - 25).toFixed(0)}deg;--z:${(.86 + rnd(j + 99) * .28).toFixed(2)};--w:${j * 14}ms"></i>`; }).join('')}</div>
          <span>${esc(x[1])}</span></div>`).join('');
      return `<div class="wd-bin b-${O[o][1]}" style="--n:${n}"><div class="wd-bin-h"><b>${esc(O[o][0])}</b></div><div class="wd-bin-b">${body}</div></div>`;
    }).join('');
    return `<div class="wd-gr reveal">
        <div class="wd-gr-h"><b>${L('Not every message is an offer', 'Nicht jede Nachricht ist ein Angebot')}</b><span>${L('Messages, calls and call-offs by what they need. One pellet per message; the split is illustrative.', 'Nachrichten, Anrufe und Abrufe nach dem, was sie brauchen. Ein Granulat je Nachricht; die Verteilung ist beispielhaft.')}</span></div>
        <div class="wd-bins">${bins}</div>
      </div>`;
  }
  let shown = false;
  function wireBoard() {
    const gr = host.querySelector('.wd-gr'); if (!gr) return;
    const tip = document.getElementById('tip'), I = INTENTS(), O = OUT();
    const focus = g => { gr.classList.toggle('focus', !!g); gr.querySelectorAll('.wd-grp').forEach(x => x.classList.toggle('on', x === g)); };
    const show = (g, e) => {
      focus(g); if (!tip) return;
      const x = I[+g.dataset.i];
      tip.innerHTML = `<div class="tip-h"><b>${esc(x[1])}</b></div><div class="tip-m">${esc(x[4])}</div><div class="tip-n">→ ${esc(O[x[3]][0])}</div>`;
      tip.hidden = false;
      const r = e && e.clientX != null ? { x: e.clientX, y: e.clientY } : (() => { const b = g.getBoundingClientRect(); return { x: b.left, y: b.bottom }; })();
      tip.style.left = `${Math.min(r.x + 18, innerWidth - tip.offsetWidth - 12)}px`; tip.style.top = `${Math.min(r.y + 18, innerHeight - tip.offsetHeight - 12)}px`;
    };
    const hide = () => { if (tip) tip.hidden = true; focus(null); };
    gr.querySelectorAll('.wd-grp').forEach(g => {
      g.addEventListener('mousemove', e => show(g, e)); g.addEventListener('click', e => show(g, e));
      g.addEventListener('focus', () => show(g)); g.addEventListener('blur', hide);
    });
    gr.addEventListener('mouseleave', hide);
    if (shown || reduced) { gr.classList.add('poured'); return; }
    new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect(); shown = true; gr.classList.add('poured'); }, { rootMargin: '0px 0px -15% 0px' }).observe(gr);
  }

  // ------------------------------------------------------------------ the guide, two paths
  const PATHS = () => [
    [L('A quote request', 'Eine Angebotsanfrage'), L('full path', 'voller Weg'), [[L('Request in', 'Anfrage da'), L('Qualify', 'Qualifizieren'), L('Match', 'Matchen')], [L('Offer drafted', 'Angebot entworfen'), L('Sent', 'Gesendet')], [L('Follow up on day 4', 'Nachfassen an Tag 4'), L('Decision', 'Entscheidung'), L('Won or lost, with reason', 'Gewonnen oder verloren, mit Grund')]]],
    [L('A CoA request', 'Eine CoA-Anfrage'), L('short path', 'kurzer Weg'), [[L('Request in', 'Anfrage da'), L('Intent: document', 'Absicht: Dokument')], [L('CoA found', 'CoA gefunden'), L('Sent', 'Gesendet')], [L('Done', 'Erledigt')]]],
  ];
  const STG = () => [L('Understand & qualify', 'Verstehen & qualifizieren'), L('Respond or offer', 'Antworten oder anbieten'), L('Follow up & resolve', 'Nachfassen & abschließen')];

  // ------------------------------------------------------------------ the day
  const eurK = v => `€ ${nf(v / 1000)}k`;
  const DAY = () => [
    ['07:45', L('Plan the day', 'Den Tag planen'), L('Lena', 'Lena'), L('Inbox, an Excel list and memory decide what comes first.', 'Postfach, eine Excel-Liste und das Gedächtnis entscheiden, was zuerst kommt.'), L('14 tasks ranked by value and urgency, each with the reason it is there.', '14 Aufgaben nach Wert und Dringlichkeit sortiert, jede mit dem Grund, warum sie auf der Liste steht.'), '20 min', L('saved on planning', 'Planung gespart'), { page: 'today' }, 'sun-horizon'],
    ['08:30', L('A CoA for lot 26-0412', 'Ein CoA für die Charge 26-0412'), 'Medplast', L('Search SAP QM and SharePoint, write the reply: about 15 minutes.', 'SAP QM und SharePoint durchsuchen, Antwort schreiben: etwa 15 Minuten.'), L('Certificate found and attached, reply drafted. One click, no fake opportunity.', 'Zertifikat gefunden und angehängt, Antwort entworfen. Ein Klick, keine Schein-Opportunity.'), '1 min', L('instead of 15', 'statt 15'), { case: 'C-102' }, 'certificate'],
    ['09:15', L('Follow up a 4-day-old offer', 'Ein 4 Tage altes Angebot nachfassen'), 'Novaform', L('No reminder. Some offers never get a second call.', 'Keine Erinnerung. Manche Angebote bekommen nie einen zweiten Anruf.'), L('Due today, with the reason and how to open the call. "Two more weeks" in the chat moves everything.', 'Heute fällig, mit Grund und Gesprächseinstieg. „Noch zwei Wochen“ im Chat verschiebt alles.'), novaValue ? eurK(novaValue) : '€', L('offer value kept alive', 'Angebotswert im Spiel'), { case: 'C-101' }, 'phone-call'],
    ['10:30', L('A container slips three days', 'Ein Container verspätet sich um drei Tage'), 'Hanse Closures', L('The customer notices first and calls.', 'Der Kunde merkt es zuerst und ruft an.'), L('ETA change spotted, affected orders found, WhatsApp update drafted.', 'ETA-Änderung erkannt, betroffene Aufträge gefunden, WhatsApp-Info entworfen.'), String(delayed || 3), L('customers told before they ask', 'Kunden informiert, bevor sie fragen'), { case: 'C-104' }, 'boat'],
    ['13:00', L('Product management has HDPE to move', 'Das Produktmanagement will HDPE platzieren'), L('Outbound', 'Outbound'), L('A mass email to every PE customer.', 'Eine Rundmail an alle PE-Kunden.'), L('A ranked list: two customers that fit, three that do not, and why.', 'Eine sortierte Liste: zwei Kunden, die passen, drei, die nicht passen, und warum.'), L('2 of 5', '2 von 5'), L('customers that actually fit', 'Kunden, die wirklich passen'), { page: 'push', push: 'hdpe' }, 'package'],
    ['15:00', L('A glow-wire question', 'Eine Glühdraht-Frage'), 'Elbtal', L('Forward the thread, explain it again, wait.', 'Verlauf weiterleiten, alles noch mal erklären, warten.'), L('Data sheet checked, the one gap named, product management asked with the full thread.', 'Datenblatt geprüft, die eine Lücke benannt, Produktmanagement mit ganzem Verlauf gefragt.'), '0', L('answers made up', 'erfundene Antworten'), { case: 'C-106' }, 'flask'],
    ['16:30', L('"They bought elsewhere."', '„Sie haben woanders gekauft.“'), 'Folienwerk', L('CRM update tonight, if at all.', 'CRM-Pflege heute Abend, wenn überhaupt.'), L('One sentence in the chat: lost, reason, follow-ups cancelled, call in six weeks.', 'Ein Satz im Chat: verloren, Grund, Nachfassen storniert, Anruf in sechs Wochen.'), '4', L('records updated with one confirm', 'Datensätze mit einer Bestätigung aktualisiert'), { case: 'C-105', chat: true }, 'chats-circle'],
  ];
  let cur = 0;

  function render() {
    const I = INTENTS(), d = DAY(), compact = !!window.PAGE?.compactWorkday; // a page can keep the guide and the day one click away
    host.innerHTML = `<div class="wrap">
      <div class="wd-head reveal"><h2 class="h2">${window.UI_TEXT?.[lang()]?.h2_workday || L('The whole job, not just the offer.', 'Der ganze Job, nicht nur das Angebot.')}</h2>
        <p>${L('An account manager\'s day is calls, documents, delivery questions, follow-ups and relationships. Offers are one part of it. The product guides all of it, and knows which is which.', 'Der Vertriebsalltag besteht aus Anrufen, Dokumenten, Lieferfragen, Nachfassen und Kundenpflege. Angebote sind nur ein Teil davon. Das Produkt führt durch alles und weiß, was was ist.')}</p></div>

      ${board()}
      <p class="wd-fn">${L('Illustrative split. The pilot measures Biesterfeld\'s real one.', 'Beispielhafte Verteilung. Der Pilot misst die tatsächliche bei Biesterfeld.')}</p>

      ${compact ? `<button class="pg-more-btn" data-key="workday" aria-expanded="false" data-closed="${L('Show the guide and a day with Lena', 'Leitfaden und einen Tag mit Lena zeigen')}" data-opened="${L('Hide the guide and the day', 'Leitfaden und Tag ausblenden')}"><span>${L('Show the guide and a day with Lena', 'Leitfaden und einen Tag mit Lena zeigen')}</span>${ph('caret-down')}</button>
      <div class="pg-more"><div>` : ''}
      <div class="wd-card wd-guide reveal">
        <div class="wd-card-h"><b>${L('One guide, three stages', 'Ein Leitfaden, drei Stufen')}</b><span>${L('The path adapts to the request', 'Der Weg passt sich der Anfrage an')}</span></div>
        <div class="wd-stg-h">${STG().map((s, i) => `<span><em>${i + 1}</em>${s}</span>`).join('')}</div>
        ${PATHS().map(([t, k, stages], pi) => `<div class="wd-path ${pi ? 'short' : ''}"><div class="wd-path-l"><b>${t}</b><small>${k}</small></div>${stages.map(st => `<div class="wd-seg">${st.map(x => `<span>${x}</span>`).join('')}</div>`).join('')}</div>`).join('')}
        <div class="wd-guide-f">${[['list-checks', L('Qualification', 'Qualifizierung'), L('Product, quantity, price, delivery and intent. Missing points come with the question to ask.', 'Produkt, Menge, Preis, Lieferung und Absicht. Zu jeder fehlenden Angabe gibt es die passende Frage.')],
          ['lightbulb', L('Coaching', 'Coaching'), L('Buying signal, exploring or hesitating: how to approach it, and when not to push.', 'Kaufsignal, Sondieren oder Zögern: wie man vorgeht und wann man besser nicht drängt.')],
          ['chats-circle', L('Context chat', 'Kontext-Chat'), L('"They need two more weeks." The chat proposes the record changes; you confirm.', '„Sie brauchen noch zwei Wochen.“ Der Chat schlägt die Änderungen vor; Sie bestätigen.')]].map(([ic, b, s]) => `<div>${ph(ic)}<b>${b}</b><span>${s}</span></div>`).join('')}</div>
      </div>

      <div class="wd-card wd-day reveal">
        <div class="wd-card-h"><b>${L('A day with Lena', 'Ein Tag mit Lena')}</b><span>${L('Inside sales, engineering plastics', 'Innendienst, technische Kunststoffe')}</span></div>
        <div class="wd-line" role="tablist">${d.map((m, i) => `<button role="tab" aria-selected="${i === cur}" class="${i === cur ? 'on' : ''}" data-i="${i}" style="--x:${(i / (d.length - 1)) * 100}%"><i>${ph(m[8])}</i><time>${m[0]}</time></button>`).join('')}</div>
        <div class="wd-mo" data-mo></div>
      </div>
      ${compact ? '</div></div>' : ''}
    </div>`;
    moment(false);
    wireBoard();
  }
  function moment(anim = true) {
    const m = DAY()[cur], box = host.querySelector('[data-mo]');
    box.innerHTML = `<div class="wd-mo-in ${anim ? 'anim' : ''}">
      <div class="wd-mo-t"><time>${m[0]}</time><b>${esc(m[1])}</b><small>${esc(m[2])}</small></div>
      <div class="wd-cmp"><div class="was"><small>${ph('x')}${L('Today, without it', 'Heute, ohne')}</small><p>${esc(m[3])}</p></div><div class="now"><small>${ph('check')}${L('With the product', 'Mit dem Produkt')}</small><p>${esc(m[4])}</p></div></div>
      <div class="wd-mo-k"><b>${esc(m[5])}</b><span>${esc(m[6])}</span><button class="btn btn-primary" data-open><span>${L('Show me', 'Zeigen')}</span><span class="btn-ic">${ph('arrow-down')}</span></button></div>
    </div><div class="wd-mo-nav"><button data-step="-1" aria-label="${esc(L('Previous', 'Zurück'))}" ${cur ? '' : 'disabled'}>${ph('arrow-left')}</button><span>${cur + 1} / ${DAY().length}</span><button data-step="1" aria-label="${esc(L('Next', 'Weiter'))}" ${cur < DAY().length - 1 ? '' : 'disabled'}>${ph('arrow-right')}</button></div>`;
    host.querySelectorAll('.wd-line button').forEach((b, i) => { b.classList.toggle('on', i === cur); b.setAttribute('aria-selected', i === cur); });
  }
  host.addEventListener('click', e => {
    const t = e.target.closest('.wd-line button'); if (t) { cur = +t.dataset.i; moment(); return; }
    const s = e.target.closest('[data-step]'); if (s) { cur = Math.max(0, Math.min(DAY().length - 1, cur + +s.dataset.step)); moment(); return; }
    if (e.target.closest('[data-open]')) document.dispatchEvent(new CustomEvent('bf:open', { detail: DAY()[cur][7] }));
  });

  render();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  host.querySelectorAll('.reveal').forEach(el => io.observe(el));
  window.UI?.onLang(() => { render(); host.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); });
  if (reduced) host.classList.add('still');
})();
