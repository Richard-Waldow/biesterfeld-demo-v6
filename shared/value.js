/* Two sections for every version, filled into #value and #roadmap:
   1. Value: an editable calculator for hours (requests handled by hand) and margin (price rises passed on sooner).
      Every number is a slider and an assumption, not Biesterfeld data. Three scenarios (careful, middle, optimistic) set
      all sliders at once; "middle" is the pressure-tested default, and the basis of every assumption is one click away.
   2. Roadmap: Q4 2026 pilot into 2027 (order intake, prices and allocations, new subsidiaries, one cockpit).
   A page can set window.PAGE = { compactValue: true } to lead with the three results and keep the sliders one click away. */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const loc = () => (lang() === 'de' ? 'de-DE' : 'en-GB');
  const nf = (n, d = 0) => Number(n).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: d });
  const eur = v => v >= 1e6 ? `€ ${nf(v / 1e6, 2)} M` : v >= 1e4 ? `€ ${nf(v / 1e3)}k` : `€ ${nf(v)}`;
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;

  // ------------------------------------------------------------------ value calculator
  // the scenarios; "mid" is the default after the pressure test of 2026-10-20 (the earlier defaults are close to "high")
  const SC = {
    low: { n: 250, min: 10, chk: 4, share: 35, rate: 55, t: 1500, up: 80, days: 3, o: 50, nf: 20, lift: 3, m: 1000, re: 3, rm: 8000 },
    mid: { n: 300, min: 12, chk: 3, share: 50, rate: 60, t: 3000, up: 120, days: 5, o: 60, nf: 30, lift: 5, m: 1500, re: 6, rm: 10000 },
    high: { n: 300, min: 12, chk: 2, share: 60, rate: 65, t: 8000, up: 120, days: 7, o: 60, nf: 30, lift: 8, m: 2500, re: 10, rm: 12000 },
  };
  // a page can ask for the classic view (window.PAGE.classicValue): the original defaults, no scenarios, no pressure test
  const classic = !!window.PAGE?.classicValue;
  const V = classic ? { ...SC.high, chk: 0 } : { ...SC.mid };
  let scen = 'mid', ptOpen = false;
  const SL = () => ({
    n: [L('Requests, call-offs and document asks per day', 'Anfragen, Abrufe und Dokumentenanfragen pro Tag'), 50, 1500, 10, v => nf(v)],
    min: [L('Minutes per item by hand today', 'Minuten pro Vorgang, heute von Hand'), 3, 30, 1, v => `${nf(v)} min`],
    chk: [L('Minutes left to check and approve', 'Minuten, die für Prüfen und Freigeben bleiben'), 0, 10, 1, v => `${nf(v)} min`],
    share: [L('Share the AI prepares for approval', 'Anteil, den die KI zur Freigabe vorbereitet'), 20, 90, 5, v => `${nf(v)} %`],
    rate: [L('Full cost per hour', 'Vollkosten pro Stunde'), 40, 120, 5, v => `€ ${nf(v)}`],
    t: [L('Monthly volume in volatile grades', 'Monatliche Menge in volatilen Typen'), 1000, 40000, 500, v => `${nf(v)} t`],
    up: [L('Producer increase per price round', 'Herstelleraufschlag je Preisrunde'), 20, 400, 10, v => `€ ${nf(v)}/t`],
    days: [L('Days sooner it reaches open offers', 'Tage früher in offenen Angeboten'), 1, 21, 1, v => `${nf(v)} ${L('days', 'Tage')}`],
    o: [L('Offers sent per week', 'Gesendete Angebote pro Woche'), 10, 300, 5, v => nf(v)],
    nf: [L('Share without a follow-up today', 'Anteil heute ohne Nachfassen'), 0, 70, 5, v => `${nf(v)} %`],
    lift: [L('Win rate gained when followed up', 'Höhere Abschlussquote durch Nachfassen'), 1, 25, 1, v => `+${nf(v)} ${L('pts', 'Pkt.')}`],
    m: [L('Margin per won offer', 'Marge je gewonnenem Angebot'), 500, 15000, 250, v => `€ ${nf(v)}`],
    re: [L('Quiet customers won back per year', 'Zurückgewonnene inaktive Kunden pro Jahr'), 0, 60, 1, v => nf(v)],
    rm: [L('Margin per won-back customer per year', 'Marge je zurückgewonnenem Kunden pro Jahr'), 2000, 60000, 1000, v => `€ ${nf(v)}`],
  });
  const PT = () => [
    [L('Items per day: 300', 'Vorgänge pro Tag: 300'), L('Assumption', 'Annahme'), L('About 20 people in inside sales for plastics in Germany with about 15 requests, call-offs and document asks each. The pilot counts the real inbox.', 'Rund 20 Personen im Innendienst Kunststoffe Deutschland mit je etwa 15 Anfragen, Abrufen und Dokumentenanfragen. Der Pilot zählt das echte Postfach aus.')],
    [L('12 minutes by hand, 3 left to check', '12 Minuten von Hand, 3 bleiben zum Prüfen'), L('Assumption', 'Annahme'), L('Read, check stock and inbound in SAP, price, write back. Checking and approving stays work, so it is taken off the saving; the earlier version counted the full 12 minutes.', 'Lesen, Bestand und Zulauf in SAP prüfen, Preis rechnen, antworten. Prüfen und Freigeben bleibt Arbeit und wird von der Ersparnis abgezogen; die frühere Fassung rechnete die vollen 12 Minuten.')],
    [L('Half is prepared', 'Die Hälfte wird vorbereitet'), L('Assumption', 'Annahme'), L('Special cases, complaints and technical questions stay manual. 50 % is the middle; the pilot measures the real share.', 'Sonderfälle, Reklamationen und technische Fragen bleiben Handarbeit. 50 % ist die Mitte; der Pilot misst den echten Anteil.')],
    [L('€ 60 per hour', '60 € pro Stunde'), L('Derived', 'Abgeleitet'), L('Personnel expense 2025 of € 103 m for 1,221 employees is about € 84k a head, about € 51 an hour at 1,650 hours, plus workplace costs.', 'Personalaufwand 2025 von 103 Mio. € bei 1.221 Mitarbeitenden sind rund 84.000 € je Kopf, rund 51 € pro Stunde bei 1.650 Stunden, dazu Arbeitsplatzkosten.')],
    [L('Hours are capacity, not cash', 'Stunden sind Kapazität, kein Cash'), L('Caveat', 'Vorbehalt'), L('Hours saved turn into money only when they go into more customer contact or replace a hire. With revenue falling, the realistic use is more selling time, not fewer people.', 'Gesparte Stunden werden erst zu Geld, wenn sie in mehr Kundenkontakt fließen oder eine Neueinstellung ersetzen. Bei sinkendem Umsatz ist das realistisch mehr Verkaufszeit, nicht weniger Personal.')],
    [L('3,000 t a month in open offers', '3.000 t pro Monat in offenen Angeboten'), L('Assumption', 'Annahme'), L('Only volume on open offers or spot prices reacts to a price round; framework contracts with a price formula do not. Lowered from 8,000 t in the earlier version.', 'Nur Menge in offenen Angeboten oder zu Spotpreisen reagiert auf eine Preisrunde; Rahmenverträge mit Preisformel nicht. Gegenüber der früheren Fassung von 8.000 t gesenkt.')],
    [L('€ 120/t per round, 5 days sooner', '120 €/t je Runde, 5 Tage früher'), L('Assumption', 'Annahme'), L('A small round: in spring 2026 PE and PP rose by 40 to 60 % (GKV), several hundred euros a tonne. 5 days is the time a list review takes today.', 'Eine kleine Runde: Im Frühjahr 2026 stiegen PE und PP um 40 bis 60 % (GKV), mehrere hundert Euro pro Tonne. 5 Tage ist die Zeit, die das Durchgehen der Liste heute braucht.')],
    [L('€ 1,500 margin per won offer', '1.500 € Marge je gewonnenem Angebot'), L('Derived', 'Abgeleitet'), L('A typical offer of 10 t at about € 1.90/kg is € 19,000; at 8 % margin that is about € 1,500. Lowered from € 2,500.', 'Ein typisches Angebot über 10 t zu rund 1,90 €/kg sind 19.000 €; bei 8 % Marge rund 1.500 €. Gegenüber 2.500 € gesenkt.')],
    [L('+5 points win rate when followed up', '+5 Punkte Abschlussquote durch Nachfassen'), L('Assumption', 'Annahme'), L('The weakest number on the page. The pilot compares offers with and without a follow-up.', 'Die schwächste Zahl auf der Seite. Der Pilot vergleicht Angebote mit und ohne Nachfassen.')],
    [L('6 customers back, € 10k margin each', '6 Kunden zurück, je 10.000 € Marge'), L('Assumption', 'Annahme'), L('A mid-size converter buying about 60 t a year at about € 170 margin per tonne.', 'Ein mittelgroßer Verarbeiter mit rund 60 t im Jahr bei etwa 170 € Marge pro Tonne.')],
  ];
  function calc(v = V) {
    const hours = v.n * Math.max(0, v.min - v.chk) / 60 * (v.share / 100) * 220; // what is prepared still has to be checked
    const fu = v.o * 52 * (v.nf / 100) * (v.lift / 100) * v.m, rea = v.re * v.rm;
    return { hours, fte: hours / 1650, cost: hours * v.rate, margin: v.t * v.up * v.days / 30, fu, rea, guide: fu + rea };
  }
  function value(host) {
    const guide = !!document.getElementById('workday'); // the third card belongs to the page that shows the workday section
    const compact = !!window.PAGE?.compactValue;
    const slider = k => { const [label, min, max, step, fmt] = SL()[k]; return `<label class="vl-sl"><span class="vl-sl-h"><b>${label}</b><em data-o="${k}">${fmt(V[k])}</em></span><input type="range" min="${min}" max="${max}" step="${step}" value="${V[k]}" data-k="${k}" aria-label="${label}"></label>`; };
    const SCN = [['low', L('Careful', 'Vorsichtig')], ['mid', L('Middle', 'Mittel')], ['high', L('Optimistic', 'Optimistisch')]];
    host.innerHTML = `<div class="wrap">
      <h2 class="h2 reveal vl-h">${window.UI_TEXT?.[lang()]?.h2_value || L('What it is worth in the next quarters.', 'Was das in den nächsten Quartalen bringt.')}</h2>
      ${classic ? '' : `<div class="vl-assume reveal">${ph('warning-circle')}<p>${L('<b>Every number here is an assumption</b>, not Biesterfeld data and not a promise. They are set on purpose to the middle of a careful range; the pilot measures the real values.', '<b>Alle Zahlen hier sind Annahmen</b>, keine Biesterfeld-Daten und kein Versprechen. Sie sind bewusst auf die Mitte einer vorsichtigen Spanne gesetzt; der Pilot misst die echten Werte.')}</p>
        <div class="vl-scen" role="group" aria-label="${L('Scenario', 'Szenario')}"><small>${L('Scenario', 'Szenario')}</small>${SCN.map(([k, l]) => `<button data-scen="${k}" aria-pressed="${scen === k}">${l}</button>`).join('')}</div></div>`}
      ${compact ? `<div class="vl-sum reveal">
        <div><b data-r="cost"></b><span>${L('a year in hours saved', 'pro Jahr an gesparten Stunden')}</span></div>
        ${guide ? `<div><b data-r="guide"></b><span>${L('a year from follow-ups and won-back customers', 'pro Jahr aus Nachfassen und reaktivierten Kunden')}</span></div>` : ''}
        <div><b data-r="margin"></b><span>${L('margin kept per producer price round', 'Marge gesichert je Preisrunde der Hersteller')}</span></div></div>
      <button class="pg-more-btn reveal" data-key="value" aria-expanded="false" data-closed="${L('Adjust the assumptions', 'Annahmen anpassen')}" data-opened="${L('Hide the assumptions', 'Annahmen ausblenden')}"><span>${L('Adjust the assumptions', 'Annahmen anpassen')}</span>${ph('caret-down')}</button>
      <div class="pg-more"><div>` : ''}
      <div class="vl-grid reveal">
        <div class="vl-card"><div class="vl-top">${ph('clock')}<b>${L('Hours', 'Stunden')}</b><span>${L('Inbox, orders, quotes, documents', 'Postfach, Aufträge, Angebote, Dokumente')}</span></div>
          ${(classic ? ['n', 'min', 'share', 'rate'] : ['n', 'min', 'chk', 'share', 'rate']).map(slider).join('')}
          <div class="vl-out"><div><b data-r="hours"></b><span>${L('hours per year', 'Stunden pro Jahr')}</span></div><div><b data-r="fte"></b><span>${L('full-time roles freed', 'Vollzeitstellen frei')}</span></div><div><b data-r="cost"></b><span>${L('per year', 'pro Jahr')}</span></div></div></div>
        <div class="vl-card vl-acc"><div class="vl-top">${ph('trend-up')}<b>${L('Margin', 'Marge')}</b><span>${L('Price rises reach open offers sooner', 'Preiserhöhungen erreichen offene Angebote schneller')}</span></div>
          ${['t', 'up', 'days'].map(slider).join('')}
          <div class="vl-out one"><div><b data-r="margin"></b><span>${L('margin kept per price round', 'Marge gesichert je Preisrunde')}</span></div></div>
          <p class="vl-note">${L('2026 has already had several price rounds (spring spike, October PE). Each one that reaches open offers a week late costs margin.', '2026 gab es bereits mehrere Preisrunden (Frühjahrsspitze, PE im Oktober). Jede, die eine Woche zu spät in offenen Angeboten ankommt, kostet Marge.')}</p></div>
        ${guide ? `<div class="vl-card vl-wide"><div class="vl-top">${ph('path')}<b>${L('Follow-ups and won-back customers', 'Nachfassen und reaktivierte Kunden')}</b><span>${L('What the workday guide adds on top', 'Was der Arbeitstag-Leitfaden zusätzlich bringt')}</span></div>
          <div class="vl-wide-in"><div class="vl-cols">${['o', 'nf', 'lift', 'm', 're', 'rm'].map(slider).join('')}</div>
            <div class="vl-out vl-out-g"><div><b data-r="guide"></b><span>${L('extra margin per year', 'zusätzliche Marge pro Jahr')}</span></div><div class="sub"><b data-r="fu"></b><span>${L('from offers that get their follow-up', 'aus Angeboten, die nachgefasst werden')}</span></div><div class="sub"><b data-r="rea"></b><span>${L('from customers who come back', 'von Kunden, die zurückkommen')}</span></div></div></div></div>` : ''}
      </div>
      ${compact ? '</div></div>' : ''}
      ${classic ? '' : `<details class="vl-ptd reveal"${ptOpen ? ' open' : ''}><summary>${ph('magnifying-glass')}<span>${L('How solid are these numbers? The pressure test', 'Wie belastbar sind diese Zahlen? Die Prüfung')}</span>${ph('caret-down')}</summary>
        <div class="vl-pt">${PT().map(([k, a, why]) => `<div class="vl-pti"><b>${k}</b><em class="${a === L('Caveat', 'Vorbehalt') ? 'w' : ''}">${a}</em><p>${why}</p></div>`).join('')}</div></details>`}
      <p class="vl-foot reveal">${L('Your numbers, not ours: every value is adjustable and none of it is Biesterfeld data. Hours use 220 working days and 1,650 hours per full-time role.', 'Ihre Zahlen, nicht unsere: Jeder Wert ist anpassbar, und nichts davon sind Biesterfeld-Daten. Gerechnet mit 220 Arbeitstagen und 1.650 Stunden je Vollzeitstelle.')}${classic ? '' : L(' Hours saved become money only when they go into selling or replace a hire.', ' Gesparte Stunden werden erst zu Geld, wenn sie in den Verkauf fließen oder eine Neueinstellung ersetzen.')}</p>
    </div>`;
    const out = () => {
      const r = calc(), f = { hours: nf(r.hours), fte: nf(r.fte, 1) };
      host.querySelectorAll('[data-r]').forEach(el => { const k = el.dataset.r; el.textContent = f[k] ?? eur(r[k]); });
      host.querySelectorAll('input[type=range]').forEach(i => { const p = (i.value - i.min) / (i.max - i.min) * 100; i.style.setProperty('--p', `${p}%`); });
      document.dispatchEvent(new CustomEvent('bf:value', { detail: r }));
    };
    host.addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; V[k] = +e.target.value; host.querySelector(`[data-o="${k}"]`).textContent = SL()[k][4](V[k]); scen = null; host.querySelectorAll('[data-scen]').forEach(b => b.setAttribute('aria-pressed', 'false')); out(); });
    host.querySelector('.vl-ptd')?.addEventListener('toggle', e => { ptOpen = e.target.open; });
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-scen]'); if (!b) return;
      scen = b.dataset.scen; Object.assign(V, SC[scen]);
      host.querySelectorAll('[data-scen]').forEach(x => x.setAttribute('aria-pressed', x === b));
      host.querySelectorAll('input[data-k]').forEach(i => { i.value = V[i.dataset.k]; host.querySelector(`[data-o="${i.dataset.k}"]`).textContent = SL()[i.dataset.k][4](V[i.dataset.k]); });
      out();
    });
    out();
  }

  // ------------------------------------------------------------------ roadmap
  const STEPS = () => [
    ['Q4 2026', L('Pilot', 'Pilot'), 'flag', L('One tight grade, one inbox, 30 days. Allocation and offers, measured in hours and margin.', 'Ein knapper Werkstoff, ein Postfach, 30 Tage. Allokation und Angebote, gemessen in Stunden und Marge.'), true],
    ['Q1 2027', L('Order intake and documents', 'Auftragseingang und Dokumente'), 'tray-arrow-down', L('Orders, call-offs, CoA, SDS and PPWR declarations from the inbox into SAP S/4HANA, each with an approval click.', 'Bestellungen, Abrufe, CoA, SDB und PPWR-Erklärungen aus dem Postfach in SAP S/4HANA, jeweils mit einem Freigabeklick.')],
    ['Q2 2027', L('Prices and allocations', 'Preise und Allokationen'), 'scales', L('Read producer notices, reprice open offers, share scarce supply by clear rules.', 'Herstellerschreiben lesen, offene Angebote neu bepreisen, knappes Inventar nach klaren Regeln verteilen.')],
    ['H2 2027', L('New subsidiaries', 'Neue Gesellschaften'), 'globe-hemisphere-east', L('Italy, Türkiye, Singapore, Korea: one AI layer over inbox and ERP, before any SAP migration.', 'Italien, Türkei, Singapur, Korea: eine KI-Ebene über Postfach und ERP, noch vor jeder SAP-Migration.')],
    ['2027+', L('One Biesterfeld', 'Ein Biesterfeld'), 'users-three', L('One sales cockpit connected to Biesterfeld CRM across divisions. Every approval teaches the system.', 'Ein Vertriebscockpit mit Anbindung an das Biesterfeld CRM für alle Geschäftsbereiche. Jede Freigabe macht das System besser.')],
  ];
  function roadmap(host) {
    host.innerHTML = `<div class="wrap">
      <h2 class="h2 reveal rm-h">${window.UI_TEXT?.[lang()]?.h2_roadmap || L('From Q4 2026 into 2027.', 'Von Q4 2026 ins Jahr 2027.')}</h2>
      <ol class="rm reveal">${STEPS().map(([q, t, icon, d, now], i) => `<li class="${now ? 'now' : ''}" style="--i:${i}"><span class="rm-q">${q}${now ? `<em>${L('Now', 'Jetzt')}</em>` : ''}</span><span class="rm-dot">${ph(icon)}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
    </div>`;
  }

  // ------------------------------------------------------------------ boot (fades in on its own, re-renders on language change)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  const mount = () => {
    const v = document.getElementById('value'), r = document.getElementById('roadmap');
    if (v) value(v); if (r && !window.PAGE?.ownRoadmap) roadmap(r); // a page can draw #roadmap itself
    [v, window.PAGE?.ownRoadmap ? null : r].filter(Boolean).forEach(h => h.querySelectorAll('.reveal').forEach(el => { if (h.dataset.seen) el.classList.add('in'); else io.observe(el); }));
    [v, r].filter(Boolean).forEach(h => { h.dataset.seen = h.dataset.seen || ''; });
  };
  window.BFValue = { calc, eur, scenario: () => scen, range: () => [calc(SC.low), calc(SC.high)] };
  mount();
  window.UI?.onLang(() => { document.querySelectorAll('#value, #roadmap').forEach(h => { h.dataset.seen = '1'; }); mount(); });
})();
