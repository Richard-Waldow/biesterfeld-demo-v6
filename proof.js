/* Version 4: #proof, before the pilot. Already in daily use with 11 account executives at a B2B distributor, and
   what an account executive says it changes: less mental load for organising, more for the customer.
   The quotes are an account executive's own words from a feedback call on 2026-10-20, translated and shortened.
   Each quote links to the place in the product that does it. The quotes run in one line that scrolls by itself
   (the set is there twice, so the loop has no seam) and stops while pointed at. */
(() => {
  const host = document.getElementById('proof'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const ph = n => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [theme, icon, quote, where it lives in the product, the product page it opens]
  const QUOTES = () => [
    [L('Prioritising', 'Priorisieren'), 'list-checks',
      L('Too many tasks, hard to prioritise. Now everything is ranked and sorted by type.', 'Zu viele Aufgaben, kaum zu priorisieren. Jetzt ist alles gerankt und nach Art sortiert.'),
      L('My workday', 'Mein Arbeitstag'), { page: 'today' }],
    [L('Less overhead', 'Weniger Overhead'), 'brain',
      L('Done tasks just disappear. My head is free for the next customer.', 'Erledigtes verschwindet einfach. Der Kopf ist frei für den nächsten Kunden.'),
      L('Done tasks leave the list', 'Erledigtes verschwindet'), { page: 'today' }],
    [L('Buying rhythm', 'Kaufrhythmus'), 'chart-line',
      L('The tool tells me when to call. I know how.', 'Das Tool sagt mir, wann ich anrufen soll. Wie, weiß ich selbst.'),
      'Demand Match', { page: 'outbound' }],
    [L('Data sheets', 'Datenblätter'), 'file-pdf',
      L('The right data sheet is already attached. Dozens of times a day.', 'Das richtige Datenblatt hängt schon dran. Dutzende Male am Tag.'),
      L('Offers', 'Angebote'), { page: 'pq-create' }],
  ];

  function render() {
    host.innerHTML = `<div class="wrap">
      <div class="pf-head">
        <div class="pf-stat reveal"><b>11</b><span>${L('account executives use it every day', 'Account Executives arbeiten täglich damit')}</span><small>${L('at a B2B distributor', 'bei einem B2B-Großhändler')}</small></div>
        <div class="pf-txt reveal">
          <p class="ly-eyebrow">${ph('quotes')}${L('Already in use', 'Bereits im Einsatz')}</p>
          <h2 class="h2 pf-h">${L('Less mental load for organising. <em>More for the customer.</em>', 'Weniger Kopf für Organisation. <em>Mehr für den Kunden.</em>')}</h2>
          
        </div>
      </div>
      <div class="pf-car reveal" aria-label="${L('Quotes from account executives', 'Stimmen von Account Executives')}"><div class="pf-track">${[false, true].map(dup => QUOTES().map(([t, ic, q, where, open]) => `<figure class="pf-q"${dup ? ' aria-hidden="true"' : ''}>
        <span class="pf-tag">${ph(ic)}${t}</span>
        <blockquote>${q}</blockquote>
        <figcaption><span class="pf-who"><i>${ph('user')}</i><span><b>Account Executive</b><small>${L('B2B distributor', 'B2B-Großhändler')}</small></span></span>
          <button class="pf-open"${dup ? ' tabindex="-1"' : ''} data-open='${JSON.stringify(open)}'>${L('In the product', 'Im Produkt')}: ${where}${ph('arrow-up-right')}</button></figcaption>
      </figure>`).join('')).join('')}</div></div>
    </div>`;
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) document.dispatchEvent(new CustomEvent('bf:open', { detail: JSON.parse(b.dataset.open) })); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
  render(); host.querySelectorAll('.reveal').forEach(el => (reduced ? el.classList.add('in') : io.observe(el)));
  window.UI?.onLang(() => { render(); host.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); });
})();
