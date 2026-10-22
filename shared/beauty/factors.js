/* Hero factor cards: hover, focus or tap opens a short brief per factor
   (the figure, what is happening, what it means for Biesterfeld, our answer, the source).
   Demand cards open to the right, supply cards to the left. Figures are from public sources, October 2026. */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;

  // [figure, figure label, what is happening (2 lines), for Biesterfeld, our answer, source]
  const BRIEF = () => ({
    calloff: [L('3rd year', '3. Jahr'), L('of falling converter revenue in Germany', 'sinkender Umsatz der Kunststoffverarbeiter'),
      [L('Converters order smaller lots at shorter notice and keep little stock.', 'Verarbeiter bestellen kleinere Mengen, kurzfristiger und mit wenig eigenem Lager.'),
        L('Only about 1 in 10 can fully pass on higher prices.', 'Nur etwa jeder Zehnte kann höhere Preise vollständig weitergeben.')],
      L('More orders for the same volume, more emails per order.', 'Mehr Aufträge für dieselbe Menge, mehr E-Mails pro Auftrag.'),
      L('Orders and call-offs go from the inbox into SAP, ready to approve.', 'Bestellungen und Abrufe gehen aus dem Postfach direkt in SAP, bereit zur Freigabe.'),
      L('GKV survey, March 2026; K-Zeitung', 'GKV-Umfrage, März 2026; K-Zeitung')],
    subst: ['37 %', L('of converters weigh other suppliers or materials', 'der Verarbeiter prüfen andere Lieferanten oder Werkstoffe'),
      [L('When prices jump, customers look for equivalent grades and recyclates.', 'Bei Preissprüngen suchen Kunden nach gleichwertigen Typen und Rezyklaten.'),
        L('Approved grades in automotive and medical stay locked.', 'Freigegebene Typen in Automotive und Medizin bleiben gesperrt.')],
      L('A multi-producer portfolio wins these requests, if the equivalent arrives first.', 'Ein Portfolio mit vielen Herstellern gewinnt diese Anfragen, wenn die Alternative zuerst da ist.'),
      L('Suggest equivalents and recyclates in seconds; never swap an approved grade.', 'Gleichwertige Typen und Rezyklate in Sekunden vorschlagen; freigegebene Typen nie tauschen.'),
      L('GKV survey, March 2026', 'GKV-Umfrage, März 2026')],
    ppwr: [L('12 Aug 2026', '12. Aug. 2026'), L('EU packaging regulation applies', 'gilt die EU-Verpackungsverordnung'),
      [L('Packaging customers need declarations of conformity, recyclability and PFAS statements.', 'Verpackungskunden brauchen Konformitätserklärungen, Nachweise zur Recyclingfähigkeit und PFAS-Erklärungen.'),
        L('Recycled-content quotas follow from 2030.', 'Ab 2030 kommen Rezyklatquoten.')],
      L('More document requests on top of CoA, SDS, REACH and carbon footprints, across 15,000 products.', 'Mehr Dokumentanfragen zusätzlich zu CoA, SDB, REACH und CO₂-Fußabdruck, für 15.000 Produkte.'),
      L('Answers prepared from the document library, one click to send.', 'Antworten aus der Dokumentenbibliothek vorbereitet, Versand mit einem Klick.'),
      L('Regulation (EU) 2025/40; Biesterfeld report 2025', 'Verordnung (EU) 2025/40; Biesterfeld-Bericht 2025')],
    price: ['+40–60 %', L('PE and PP in spring 2026', 'PE und PP im Frühjahr 2026'),
      [L('PE rose again in October; Celanese raised POM prices from 8 October.', 'PE stieg im Oktober erneut; Celanese erhöhte die POM-Preise ab 8. Oktober.'),
        L('Price rounds now come within weeks, not quarters.', 'Preisrunden kommen jetzt im Wochen-, nicht im Quartalstakt.')],
      L('Every price round that reaches open offers late costs margin.', 'Jede Preisrunde, die zu spät in offenen Angeboten ankommt, kostet Marge.'),
      L('Read producer notices, reprice open offers, draft the customer notice.', 'Herstellerschreiben lesen, offene Angebote neu bepreisen, Kundeninfo entwerfen.'),
      L('GKV, March 2026; Kunststoff Information, Oct 2026', 'GKV, März 2026; Kunststoff Information, Okt. 2026')],
    hormuz: [L('14 Mt/yr', '14 Mio. t/Jahr'), L('of PE exports disrupted', 'PE-Exporte gestört'),
      [L('Force majeure and allocations since late February 2026.', 'Force Majeure und Allokationen seit Ende Februar 2026.'),
        L('Producers ration: customers get part of what they ordered.', 'Hersteller rationieren: Kunden bekommen einen Teil ihrer Bestellung.')],
      L('Standard polymers also source from the Middle East and Asia. Scarce supply must be shared out.', 'Standard Polymers bezieht auch aus Nahost und Asien. Nicht ausreichendes Inventar muss verteilt werden.'),
      L('Share scarce supply by clear rules: approved grades first, credit in view, you approve.', 'Knappes Inventar nach klaren Regeln verteilen: freigegebene Typen zuerst, Kredit im Blick, Sie geben frei.'),
      L('Argus, 2026; ICIS', 'Argus, 2026; ICIS')],
    recovery: [L('12–18 mo', '12–18 Mon.'), L('for Gulf exports to recover after reopening', 'bis sich die Exporte aus der Golfregion nach der Öffnung erholen'),
      [L('Chemical output in Germany is expected to fall again in 2026 (VCI: -1.5 %).', 'Die Chemieproduktion in Deutschland dürfte 2026 erneut sinken (VCI: -1,5 %).'),
        L('Volatility carries into 2027.', 'Die Volatilität reicht bis ins Jahr 2027.')],
      L('Plan by the quarter, not the year; who to call first changes weekly.', 'Planen Sie quartalsweise, nicht jährlich; wen man zuerst anruft, ändert sich wöchentlich.'),
      L('Stock and inbound ETAs re-matched every day, with a fresh call list.', 'Bestand und Zulauf-ETAs täglich neu abgeglichen, mit frischer Anrufliste.'),
      L('ICIS; VCI quarterly report 2/2026', 'ICIS; VCI-Quartalsbericht 2/2026')],
  });
  const KEYS = { 'side-d': ['calloff', 'subst', 'ppwr'], 'side-s': ['price', 'hormuz', 'recovery'] };

  function render() {
    const B = BRIEF();
    for (const [side, keys] of Object.entries(KEYS)) {
      document.querySelectorAll(`.hero .${side} .factors li`).forEach((li, i) => {
        const k = keys[i]; if (!k) return;
        const [fig, figL, what, so, ours, src] = B[k];
        li.classList.add('fx'); li.tabIndex = 0; li.setAttribute('aria-describedby', `fx-${k}`);
        li.querySelector('.fx-pop')?.remove(); li.querySelector('.fx-more')?.remove();
        li.insertAdjacentHTML('beforeend', `<span class="fx-more" aria-hidden="true">${ph('plus')}</span>
          <div class="fx-pop" role="tooltip" id="fx-${k}">
            <div class="fx-fig"><b>${fig}</b><span>${figL}</span></div>
            <ul class="fx-what">${what.map(w => `<li>${w}</li>`).join('')}</ul>
            <div class="fx-row"><em>${L('For Biesterfeld', 'Für Biesterfeld')}</em><p>${so}</p></div>
            <div class="fx-row ours">${ph('sparkle')}<p>${ours}</p></div>
            <small class="fx-src">${L('Source', 'Quelle')}: ${src}</small>
          </div>`);
      });
    }
  }
  render();
  window.UI?.onLang(render);

  // touch: tap opens one card at a time; tap elsewhere closes
  document.addEventListener('click', e => {
    const li = e.target.closest('.hero li.fx');
    document.querySelectorAll('.hero li.fx.open').forEach(x => { if (x !== li) x.classList.remove('open'); });
    if (li && !e.target.closest('.fx-pop')) li.classList.toggle('open');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.hero li.fx.open').forEach(x => x.classList.remove('open')); });
})();
