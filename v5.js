/* Version 5: small page changes that need script. The product section keeps its demo untouched; it only gets a
   short line under the new heading "Probieren Sie unser Produkt aus". */
(() => {
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const sub = () => {
    const h = document.querySelector('#play .play-h'); if (!h) return;
    let p = h.parentElement.querySelector('.v5-play-sub');
    if (!p) { p = document.createElement('p'); p.className = 'v5-play-sub reveal in'; h.after(p); }
    p.textContent = window.UI_TEXT?.[lang()]?.v5_play_sub || '';
  };
  sub();
  window.UI?.onLang(() => requestAnimationFrame(sub));
})();
