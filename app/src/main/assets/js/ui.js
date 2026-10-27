// Gedeelde bouwstenen: blad onderin, formulieren en de grafiek.
(function () {
  const P = window.P, h = P.h;
  P.sheets = [];

  // Blad dat omhoog schuift. bouw(sluit) geeft de inhoud terug.
  P.blad = function (titel, bouw) {
    const achter = h('div', { class: 'achter' });
    const inhoud = h('div', { class: 'inhoud' });
    const blad = h('section', { class: 'blad', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel },
      h('div', { class: 'greep' }),
      h('header', {}, h('h2', {}, titel), h('button', { class: 'icoon', 'aria-label': 'Sluiten', onclick: () => sluit() }, P.svgIcoon('M6 6l12 12M18 6L6 18'))),
      inhoud);
    const entry = { sluit };
    function sluit(snel) {
      const i = P.sheets.indexOf(entry); if (i < 0) return; P.sheets.splice(i, 1);
      blad.classList.remove('aan'); achter.classList.remove('aan');
      setTimeout(() => { blad.remove(); achter.remove(); }, snel ? 0 : 250);
    }
    achter.addEventListener('click', () => sluit());
    P.sheets.push(entry);
    document.body.append(achter, blad);
    inhoud.append(bouw(sluit, inhoud));
    requestAnimationFrame(() => requestAnimationFrame(() => { blad.classList.add('aan'); achter.classList.add('aan'); }));
    return sluit;
  };

  P.veld = function (label, opties) {
    const o = opties || {};
    const el = o.opties
      ? h('select', { id: o.id }, o.opties.map((x) => h('option', { value: x, selected: x === o.value }, x)))
      : h('input', { id: o.id, type: o.type || 'text', inputmode: o.inputmode, value: o.value == null ? '' : o.value, placeholder: o.placeholder, autocomplete: 'off', min: o.min, max: o.max, maxlength: o.maxlength });
    const w = h('label', { class: 'veld' }, h('span', {}, label), el, o.hint && h('small', {}, o.hint));
    w.el = el;
    return w;
  };
  P.bedragVeld = (label, waarde, hint) => P.veld(label, { inputmode: 'decimal', value: waarde ? P.inv(waarde) : '', placeholder: '0,00', hint });

  // Bevestigen
  P.vraag = function (titel, tekst, knop, gevaar, actie) {
    P.blad(titel, (sluit) => h('div', {}, h('p', { class: 'gedempt' }, tekst),
      h('div', { class: 'knoppen' },
        h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
        h('button', { class: 'knop ' + (gevaar ? 'gevaar' : ''), onclick: () => { sluit(); actie(); } }, knop))));
  };

  // Lijngrafiek: wat je inlegt versus wat het wordt.
  P.grafiek = function (totaal, inleg, jaren) {
    const W = 360, H = 190, L = 6, R = 6, T = 14, B = 24, n = totaal.length - 1;
    const max = Math.max(...totaal, 1), top = nice(max);
    const x = (i) => L + (W - L - R) * i / n, y = (v) => T + (H - T - B) * (1 - v / top);
    const pad = (a) => a.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const gebied = pad(totaal) + ' ' + inleg.map((v, i) => 'L' + x(n - i).toFixed(1) + ' ' + y(inleg[n - i]).toFixed(1)).join(' ') + ' Z';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'grafiek'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Verwachting over ${jaren} jaar: ${P.eur(totaal[n])}, waarvan ${P.eur(inleg[n])} zelf ingelegd.`);
    let g = '';
    for (let k = 0; k <= 2; k++) {
      const v = top * k / 2, yy = y(v);
      g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--lijn)" stroke-width="1" ${k ? 'stroke-dasharray="2 4"' : ''}/>`;
      if (k) g += `<text x="${L}" y="${yy - 4}">${kort(v)}</text>`;
    }
    const stap = jaren <= 5 ? 1 : jaren <= 10 ? 2 : jaren <= 20 ? 5 : 10;
    for (let j = 0; j <= jaren; j += stap) g += `<text x="${x(j * 12)}" y="${H - 7}" text-anchor="${j === 0 ? 'start' : j === jaren ? 'end' : 'middle'}">${j === 0 ? 'nu' : j + ' jr'}</text>`;
    g += `<path d="${gebied}" fill="var(--messing)" opacity=".16"/>`;
    g += `<path d="${pad(inleg)}" fill="none" stroke="var(--gedempt)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    g += `<path d="${pad(totaal)}" fill="none" stroke="var(--messing)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    g += `<circle cx="${x(n)}" cy="${y(totaal[n])}" r="4" fill="var(--messing)"/>`;
    svg.innerHTML = g;
    return svg;
  };
  function nice(v) { const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => f <= s)) * e; }
  function kort(v) { return v >= 1e6 ? (v / 1e6).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' mln' : v >= 1000 ? Math.round(v / 1000).toLocaleString('nl-NL') + 'k' : Math.round(v) + ''; }

  P.balk = (frac, klasse) => h('div', { class: 'balk ' + (klasse || '') }, h('i', { style: 'width:' + Math.max(0, Math.min(100, frac * 100)).toFixed(1) + '%' }));
})();
