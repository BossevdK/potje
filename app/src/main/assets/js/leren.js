// Scherm: Leren (lessen, trucs, rekenhulpen, tips).
(function () {
  const P = window.P, h = P.h;

  P.schermen.leren = function () {
    const root = h('div', { class: 'scherm' });
    root.append(h('h1', { style: 'margin-top:12px' }, 'Leren'));
    const tabs = [['lessen', 'Lessen'], ['trucs', 'Trucs'], ['rekenen', 'Rekenen'], ['tips', 'Tips']];
    root.append(h('div', { class: 'segment', role: 'tablist' }, tabs.map(([k, l]) =>
      h('button', { class: 'chip', role: 'tab', 'aria-selected': String(P.lerenTab === k), onclick: () => { P.lerenTab = k; P.render(); } }, l))));
    root.append(P['leren_' + P.lerenTab]());
    return root;
  };

  P.leren_lessen = function () {
    const n = P.lessen.length, klaar = P.lessen.filter((l) => P.d.geleerd[l.id]).length;
    return h('div', {},
      h('p', { class: 'gedempt', style: 'margin:10px 0 0' }, klaar + ' van ' + n + ' lessen gelezen. Begin bovenaan, elke les duurt een paar minuten.'),
      P.balk(klaar / n, klaar === n ? 'goed' : ''),
      h('ul', { class: 'regels', style: 'margin-top:8px' }, P.lessen.map((l, i) => h('li', {}, h('button', { class: 'regel', onclick: () => P.lesBlad(l) },
        h('div', { class: 'l' }, h('b', {}, l.titel), h('small', {}, l.duur + ' min lezen')),
        h('span', { class: 'r ' + (P.d.geleerd[l.id] ? 'plus' : 'gedempt') }, P.d.geleerd[l.id] ? P.svgIcoon('M5 13l4 4L19 7') : P.svgIcoon('M9 6l6 6-6 6')))))));
  };

  P.lesBlad = function (l) {
    P.blad(l.titel, (sluit) => {
      const knop = h('button', { class: 'knop vol' });
      const zet = () => { knop.textContent = P.d.geleerd[l.id] ? 'Gelezen · tik om te wissen' : 'Markeer als gelezen'; knop.className = 'knop vol' + (P.d.geleerd[l.id] ? ' rand' : ''); };
      knop.addEventListener('click', () => { if (P.d.geleerd[l.id]) delete P.d.geleerd[l.id]; else P.d.geleerd[l.id] = true; P.bewaar(); zet(); P.render(true); if (P.d.geleerd[l.id]) sluit(); });
      zet();
      return h('div', { class: 'les' },
        h('p', { class: 'gedempt klein' }, l.duur + ' min lezen'),
        l.basis.map((t) => h('p', {}, t)),
        h('details', {}, h('summary', {}, 'Voor gevorderden'), l.gevorderd.map((t) => h('p', {}, t))),
        h('div', { class: 'opdracht' }, h('b', {}, 'Doe dit vandaag'), l.actie),
        knop);
    });
  };

  P.leren_trucs = function () {
    const n = P.trucs.length, ja = P.trucs.filter((t) => P.d.trucs[t.id]).length;
    return h('div', {},
      h('p', { class: 'gedempt', style: 'margin:10px 0 0' }, 'Je doet ' + ja + ' van de ' + n + ' trucs. Tik een truc aan als je hem toepast.'),
      P.balk(ja / n, ja === n ? 'goed' : ''),
      P.trucs.map((t) => h('button', { class: 'vink', 'aria-pressed': String(!!P.d.trucs[t.id]), onclick: () => { if (P.d.trucs[t.id]) delete P.d.trucs[t.id]; else P.d.trucs[t.id] = true; P.bewaar(); P.render(true); } },
        h('span', { class: 'doos' }), h('span', {}, h('b', {}, t.titel), h('span', { class: 't' }, t.t)))));
  };

  P.leren_tips = function () {
    return h('div', {},
      h('div', { class: 'tipdag' }, h('small', {}, 'Tip van vandaag'), h('p', {}, P.tipVanDeDag())),
      h('h2', {}, 'Alle tips'),
      h('ul', { class: 'regels' }, P.tips.map((t) => h('li', { class: 'regel', style: 'align-items:flex-start' }, h('div', { class: 'l', style: 'white-space:normal' }, t)))));
  };

  // ------- Rekenhulpen -------
  const st = () => P.set();
  const HULPEN = [
    { id: 'rente', titel: 'Sparen en beleggen met rente', sub: 'Wat wordt mijn geld over een aantal jaar?',
      velden: () => [['start', 'Startbedrag', 1000], ['maand', 'Per maand', 100], ['pct', 'Rendement per jaar (%)', st().rendement], ['jaren', 'Aantal jaren', 10]],
      uit: (v) => { const n = Math.round(v.jaren * 12), r = P.reeks(v.start, v.maand, v.pct, n), eind = r[n], inleg = v.start + v.maand * n;
        return [groot(P.eur(eind)), 'Daarvan zelf ingelegd: ' + P.eur(inleg) + ', rendement: ' + P.eur(eind - inleg) + '. In euro\'s van vandaag ongeveer ' + P.eur(P.inflatie(eind, st().inflatie, v.jaren)) + '.']; } },
    { id: 'doel', titel: 'Hoeveel moet ik per maand sparen?', sub: 'Voor een doel met een einddatum',
      velden: () => [['doel', 'Doelbedrag', 3000], ['nu', 'Al gespaard', 0], ['jaren', 'Aantal jaren', 2], ['pct', 'Rente per jaar (%)', st().rente]],
      uit: (v) => { const n = Math.round(v.jaren * 12); return [groot(P.eur(P.nodigPerMaand(v.nu, v.doel, n, v.pct), true)), 'per maand, ' + n + ' maanden lang.']; } },
    { id: 'nood', titel: 'Noodfonds', sub: 'Hoeveel buffer heb ik nodig?',
      velden: () => [['uit', 'Uitgaven per maand', Math.round(P.gemUitgaven()) || 1800], ['mnd', 'Aantal maanden buffer', 3]],
      uit: (v) => [groot(P.eur(v.uit * v.mnd)), 'voor ' + v.mnd + ' maanden aan uitgaven. Begin met één maand en bouw op.'] },
    { id: 'schuld', titel: 'Schuld aflossen', sub: 'Hoe lang duurt het en wat kost de rente?',
      velden: () => [['schuld', 'Openstaande schuld', 3000], ['pct', 'Rente per jaar (%)', 12], ['af', 'Aflossing per maand', 150]],
      uit: (v) => { const r = P.afbetaling(v.schuld, v.pct, v.af); if (r.maanden === Infinity) return [groot('Lukt niet'), 'Je aflossing is lager dan de maandrente. Verhoog het bedrag.'];
        const j = Math.floor(r.maanden / 12), m = r.maanden % 12; return [groot((j ? j + ' jaar ' : '') + (m ? m + ' mnd' : '')), 'Je betaalt in totaal ' + P.eur(r.rente) + ' rente. Totaal terugbetaald: ' + P.eur(v.schuld + r.rente) + '.']; } },
    { id: 'uren', titel: 'Wat kost het in werkuren?', sub: 'Maak een prijs voelbaar',
      velden: () => [['prijs', 'Prijs', 120], ['uur', 'Netto uurloon', st().uurloon || 15]],
      uit: (v) => { const u = v.prijs / v.uur; return [groot(u.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' uur'), 'werken, dat is ' + (u / 8).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' dag(en) van 8 uur. Als je dit bedrag belegt, is het over 10 jaar ongeveer ' + P.eur(v.prijs * Math.pow(1 + st().rendement / 100, 10)) + ' waard.']; } },
    { id: 'inflatie', titel: 'Inflatie', sub: 'Wat is mijn geld later nog waard?',
      velden: () => [['bedrag', 'Bedrag', 10000], ['pct', 'Inflatie per jaar (%)', st().inflatie], ['jaren', 'Aantal jaren', 10]],
      uit: (v) => [groot(P.eur(P.inflatie(v.bedrag, v.pct, v.jaren))), 'is de koopkracht van ' + P.eur(v.bedrag) + ' over ' + v.jaren + ' jaar. Om dan hetzelfde te kunnen kopen als nu, heb je ' + P.eur(v.bedrag * Math.pow(1 + v.pct / 100, v.jaren)) + ' nodig.'] },
  ];
  const groot = (t) => h('span', { class: 'getal groot' }, t);

  P.leren_rekenen = function () {
    return h('ul', { class: 'regels', style: 'margin-top:8px' }, HULPEN.map((x) => h('li', {}, h('button', { class: 'regel', onclick: () => P.rekenBlad(x) },
      h('div', { class: 'l' }, h('b', {}, x.titel), h('small', {}, x.sub)), h('span', { class: 'r gedempt' }, P.svgIcoon('M9 6l6 6-6 6'))))));
  };

  P.rekenBlad = function (x) {
    P.blad(x.titel, () => {
      const veldDefs = x.velden(), velden = veldDefs.map(([k, l, w]) => [k, P.veld(l, { inputmode: 'decimal', value: P.inv(w) })]);
      const uit = h('div', { class: 'uitkomst', 'aria-live': 'polite' });
      const bereken = () => {
        const v = {}; let ok = true;
        velden.forEach(([k, f]) => { v[k] = P.getal(f.el.value); if (isNaN(v[k])) ok = false; });
        const inhoud = ok ? x.uit(v) : ['Vul alle velden in.'];
        uit.replaceChildren(...inhoud.map((i) => (typeof i === 'string' ? h('small', {}, i) : i)));
      };
      velden.forEach(([, f]) => f.el.addEventListener('input', bereken));
      bereken();
      return h('div', {}, velden.map(([, f]) => f), uit, h('p', { class: 'gedempt klein' }, 'Een rekenvoorbeeld op basis van jouw invoer. Rendement is nooit gegarandeerd.'));
    });
  };
})();
