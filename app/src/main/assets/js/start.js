// Opstarten: navigatie, vergrendeling, terugknop en foutafhandeling.
(function () {
  const P = window.P, h = P.h;
  const TABS = [
    ['overzicht', 'Overzicht', 'M4 20V10M10 20V4M16 20v-8M22 20H2'],
    ['sparen', 'Sparen', 'M15.5 8.5A5 5 0 1 0 15.5 15.5M6 10.5h7M6 13.5h7'],
    ['uitgaven', 'Uitgaven', 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'],
    ['beleggen', 'Beleggen', 'M3 17l6-6 4 4 8-8M15 7h6v6'],
    ['leren', 'Leren', 'M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z'],
  ];
  const kop = document.getElementById('kop'), main = document.getElementById('main'), nav = document.getElementById('tabs');

  nav.append(...TABS.map(([k, l, pad]) => h('button', { 'data-tab': k, onclick: () => P.ga(k) }, P.svgIcoon(pad), h('span', {}, l))));

  P.ga = function (tab) {
    if (tab !== 'instellingen') P.vorige = tab; else if (P.tab !== 'instellingen') P.vorige = P.tab;
    P.tab = tab; P.sheets.slice().forEach((s) => s.sluit(true)); P.render();
  };

  P.render = function (houScroll) {
    const y = main.scrollTop;
    kop.replaceChildren(P.tab === 'instellingen'
      ? h('button', { class: 'icoon', 'aria-label': 'Terug', onclick: () => P.ga(P.vorige || 'overzicht') }, P.svgIcoon('M15 6l-6 6 6 6'))
      : h('div', { class: 'merk' }, h('i', {}, h('b'), h('b'), h('b')), 'Potje'),
      P.tab === 'instellingen' ? h('span') : h('button', { class: 'icoon', 'aria-label': 'Instellingen', onclick: () => P.ga('instellingen') }, P.svgIcoon('M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6')));
    try {
      main.replaceChildren(P.schermen[P.tab]());
    } catch (e) {
      main.replaceChildren(h('div', { class: 'fout scherm' }, h('h3', {}, 'Dit scherm kon niet worden getoond'), h('p', { class: 'gedempt' }, String(e && e.message || e)),
        h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => P.ga('overzicht') }, 'Naar overzicht'), P.N ? h('button', { class: 'knop', onclick: () => P.N.crash(String(e && e.stack || e)) }, 'Toon crashpagina') : null)));
    }
    nav.querySelectorAll('button').forEach((b) => (b.dataset.tab === P.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    main.scrollTop = houScroll ? y : 0;
  };

  // Terugknop van Android
  window.onNativeBack = function () {
    if (document.querySelector('.slot')) return true;
    if (P.sheets.length) { P.sheets[P.sheets.length - 1].sluit(); return true; }
    if (P.tab === 'instellingen') { P.ga(P.vorige || 'overzicht'); return true; }
    if (P.tab !== 'overzicht') { P.ga('overzicht'); return true; }
    return false;
  };

  // Vergrendeling
  P.vergrendel = function () {
    if (!P.N || !P.set().vergrendeling || document.querySelector('.slot')) return;
    P.sheets.slice().forEach((s) => s.sluit(true));
    document.body.append(h('div', { class: 'slot' }, h('div', { class: 'merk' }, h('i', {}, h('b'), h('b'), h('b')), 'Potje'),
      h('p', { class: 'gedempt' }, 'Potje is vergrendeld.'), h('button', { class: 'knop', onclick: () => P.N.ontgrendel() }, 'Ontgrendel')));
    setTimeout(() => P.N.ontgrendel(), 250);
  };
  window.onOntgrendeld = (ok) => { if (ok) document.querySelectorAll('.slot').forEach((n) => n.remove()); };
  window.onAppTerug = (ms) => { if (ms > 30000) P.vergrendel(); P.stilleCheck(); };

  // Fouten: tijdens het opstarten is de crashpagina het veiligst, daarna alleen een melding
  window.addEventListener('error', (e) => {
    const tekst = (e.message || 'Onbekende fout') + '\n' + (e.filename || '') + ':' + (e.lineno || '') + '\n' + (e.error && e.error.stack || '');
    if (!P.klaar && P.N) P.N.crash(tekst); else P.toast('Er ging iets mis: ' + (e.message || 'onbekende fout'));
  });
  window.addEventListener('unhandledrejection', (e) => P.toast('Er ging iets mis: ' + (e.reason && e.reason.message || 'onbekende fout')));

  // Starten
  P.thema();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (P.set().thema === 'auto') P.thema(); });
  if (P.N) P.N.beschermScherm(!!P.set().vergrendeling);
  P.render();
  P.klaar = true;
  P.vergrendel();
  if (P.beschadigd) P.toast('Je opgeslagen gegevens waren beschadigd; er is een nieuwe start gemaakt');
  setTimeout(P.stilleCheck, 3000);
  P.plantMelding();
})();
