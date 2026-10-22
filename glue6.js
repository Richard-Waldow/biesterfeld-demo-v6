/* Version 6: the middle of #problem, one sentence between demand and supply, the key words weighted. */
(() => {
  const host = document.getElementById('glue6'); if (!host) return;
  const lang = () => window.UI?.lang || document.documentElement.lang || 'de';
  const L = (en, de) => (lang() === 'de' ? de : en);
  const render = () => { host.innerHTML = `<p class="gl6-txt">${L('Today scarce supply is shared out <b>by&nbsp;email</b> and <em>by&nbsp;gut&nbsp;feel</em>.', 'Heute wird knappes Inventar <b>per&nbsp;E&#8209;Mail</b> und <em>nach&nbsp;Bauchgefühl</em> verteilt.')}</p>`; };
  render();
  window.UI?.onLang(render);
})();
