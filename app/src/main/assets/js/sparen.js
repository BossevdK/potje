// Schermen: Overzicht en Sparen (spaardoelen met voortgang en prognose).
(function () {
  const P = window.P, h = P.h;
  P.schermen = P.schermen || {};

  // Regels onder een spaardoel: wat nog nodig is en wanneer je er bent.
  P.doelRegels = function (doel) {
    const g = P.gespaard(doel), rest = Math.max(0, doel.doel - g), r = P.doelRente(doel), uit = [];
    if (rest <= 0) return [h('span', { class: 'plus' }, 'Doel bereikt')];
    uit.push(h('span', {}, 'Nog ', h('b', {}, P.eur(rest)), ' te gaan'));
    if (doel.maandinleg > 0) {
      const m = P.maandenTotDoel(g, doel.doel, doel.maandinleg, r);
      uit.push(m === Infinity ? 'Met dit maandbedrag lukt het niet' : h('span', {}, 'Bij ', P.eur(doel.maandinleg), ' per maand klaar in ', h('b', {}, P.maandenVanaf(m))));
    } else uit.push('Vul een maandbedrag in om te zien wanneer je er bent');
    if (doel.datum) {
      const mnd = P.maandenTot(doel.datum);
      if (mnd <= 0) uit.push(h('span', { class: 'min' }, 'De einddatum is verstreken'));
      else {
        const nodig = P.nodigPerMaand(g, doel.doel, mnd, r);
        const op = (doel.maandinleg || 0) + 0.005 >= nodig;
        uit.push(h('span', {}, 'Voor ', P.korteDatum(doel.datum), ' heb je ', h('b', {}, P.eur(nodig)), ' per maand nodig · ', h('span', { class: op ? 'plus' : 'min' }, op ? 'op schema' : 'je loopt achter')));
      }
    }
    return uit;
  };

  P.doelKaart = function (doel, klik) {
    const g = P.gespaard(doel), frac = doel.doel ? g / doel.doel : 0;
    return h('button', { class: 'doel', onclick: klik },
      h('div', { class: 'top' }, h('h3', {}, doel.naam), h('span', { class: 'getal bedrag' }, P.eur(g), h('small', { class: 'gedempt' }, ' / ' + P.eur(doel.doel)))),
      P.balk(frac, frac >= 1 ? 'goed' : ''),
      h('div', { class: 'sub' }, P.doelRegels(doel).map((x, i) => h('div', {}, x))));
  };

  P.schermen.overzicht = function () {
    const st = P.set(), jaren = st.horizon, root = h('div', { class: 'scherm' });
    if (P.update && P.update.status === 'nieuw')
      root.append(h('div', { class: 'banner' }, h('span', {}, 'Nieuwe versie ' + P.update.name + ' beschikbaar'), h('button', { class: 'link', onclick: () => P.ga('instellingen') }, 'Bekijk')));

    const heeft = P.d.doelen.length || P.d.beleggingen.length;
    if (!heeft) {
      root.append(h('div', { class: 'hoofd' }, h('h1', {}, 'Begin met je eerste potje'),
        h('p', { class: 'gedempt' }, 'Potje houdt bij wat je spaart, wat je uitgeeft en wat het later waard is. Alles blijft op je telefoon.')),
        h('ul', { class: 'regels' },
          stap('Maak een spaardoel', 'Een bedrag, een datum en een maandbedrag', () => P.nieuwDoel()),
          stap('Importeer je Rabobank-afschrift', 'CSV of PDF uit je bank-app, Potje deelt het zelf in', () => { P.ga('uitgaven'); setTimeout(P.importeer, 50); }),
          stap('Lees de eerste les', 'Betaal jezelf eerst, drie minuten', () => P.ga('leren'))));
    } else {
      const pr = P.prognose(jaren), n = pr.n, eind = pr.totaal[n], nu = pr.totaal[0], inleg = pr.inleg[n];
      root.append(h('div', { class: 'hoofd' },
        h('span', { class: 'gedempt' }, 'Verwacht over ' + jaren + ' jaar'),
        h('span', { class: 'getal groot' }, P.eur(eind)),
        h('div', { class: 'naast' },
          h('span', {}, 'Nu ', h('b', { class: 'getal' }, P.eur(nu))),
          h('span', {}, 'Zelf ingelegd ', h('b', { class: 'getal' }, P.eur(inleg))),
          h('span', {}, 'Rendement ', h('b', { class: 'getal plus' }, P.eur(Math.max(0, eind - inleg))))),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Looptijd' }, [1, 5, 10, 20, 30].map((j) =>
          h('button', { class: 'chip', 'aria-pressed': String(j === jaren), onclick: () => { st.horizon = j; P.bewaar(); P.render(true); } }, j + ' jr'))),
        P.grafiek(pr.totaal, pr.inleg, jaren),
        h('div', { class: 'legenda' }, h('span', {}, 'Verwacht'), h('span', { class: 'inleg' }, 'Wat je zelf inlegt')),
        h('p', { class: 'gedempt klein', style: 'margin-top:10px' },
          'Bij ' + P.pct(st.rente) + ' spaarrente en ' + P.pct(st.rendement) + ' rendement, en ' + P.eur(P.maandInleg()) + ' per maand. In euro\'s van vandaag ongeveer ',
          h('b', { class: 'getal' }, P.eur(P.inflatie(eind, st.inflatie, jaren))), '.')));

      // Deze maand
      const k = P.huidigeMaand(), mo = P.maandOverzicht(k);
      root.append(h('div', { class: 'titelrij' }, h('h2', {}, 'Deze maand'), h('button', { class: 'link', onclick: () => P.ga('uitgaven') }, 'Uitgaven')));
      if (!mo.t.length) root.append(h('p', { class: 'gedempt' }, 'Nog niets genoteerd deze maand. Importeer je afschrift of voeg een uitgave toe.'));
      else {
        root.append(h('div', { class: 'cijfers' },
          cijfer('Inkomen', mo.inkomen), cijfer('Uitgegeven', mo.uit), cijfer('Over', mo.inkomen - mo.uit - mo.gespaard, mo.inkomen - mo.uit - mo.gespaard < 0)));
        const budget = Object.values(P.d.budgetten).reduce((s, x) => s + x, 0);
        if (budget > 0) {
          const besteed = Object.keys(P.d.budgetten).reduce((s, c) => s + (mo.perCat[c] || 0), 0);
          root.append(P.balk(besteed / budget, besteed > budget ? 'over' : ''),
            h('p', { class: 'gedempt klein', style: 'margin-top:6px' }, P.eur(besteed) + ' van je budget van ' + P.eur(budget) + (besteed > budget ? ': over' : '')));
        }
      }

      if (P.d.doelen.length) {
        root.append(h('div', { class: 'titelrij' }, h('h2', {}, 'Je potjes'), h('button', { class: 'link', onclick: () => P.ga('sparen') }, 'Alle potjes')));
        P.d.doelen.slice(0, 3).forEach((d) => root.append(P.doelKaart(d, () => P.doelBlad(d.id))));
      }
    }

    root.append(h('div', { class: 'tipdag' }, h('small', {}, 'Tip van vandaag'), h('p', {}, P.tipVanDeDag())));
    return root;
  };
  function stap(titel, sub, klik) {
    return h('li', {}, h('button', { class: 'regel', onclick: klik }, h('div', { class: 'l' }, h('b', {}, titel), h('small', {}, sub)), h('span', { class: 'r messing' }, P.svgIcoon('M9 6l6 6-6 6'))));
  }
  function cijfer(label, v, neg) { return h('div', {}, h('small', {}, label), h('b', { class: 'getal' + (neg ? ' min' : '') }, P.eur(v))); }

  P.schermen.sparen = function () {
    const root = h('div', { class: 'scherm' });
    root.append(h('div', { class: 'titelrij', style: 'margin-top:12px' }, h('h1', {}, 'Sparen'), P.d.doelen.length ? h('button', { class: 'knop', style: 'min-height:40px;padding:0 14px;font-size:15px', onclick: () => P.nieuwDoel() }, 'Nieuw doel') : null));
    if (!P.d.doelen.length) {
      const gem = P.gemUitgaven();
      root.append(h('div', { class: 'leeg' }, h('p', {}, 'Een spaardoel heeft een naam, een bedrag en liefst een datum. Potje rekent uit wat je per maand nodig hebt.'),
        h('div', { class: 'chips' },
          h('button', { class: 'chip', onclick: () => P.nieuwDoel(null, { naam: 'Noodfonds', doel: Math.round(gem * 3) || '' }) }, 'Noodfonds'),
          ['Vakantie', 'Auto', 'Aanbetaling woning', 'Eigen doel'].map((x) => h('button', { class: 'chip', onclick: () => P.nieuwDoel(null, x === 'Eigen doel' ? {} : { naam: x }) }, x)))));
    } else {
      const tot = P.totaalGespaard(), maand = P.d.doelen.reduce((s, x) => s + (x.maandinleg || 0), 0);
      root.append(h('div', { class: 'cijfers', style: 'grid-template-columns:1fr 1fr' }, cijfer('Totaal gespaard', tot), cijfer('Per maand ingelegd', maand)));
      P.d.doelen.forEach((d) => root.append(P.doelKaart(d, () => P.doelBlad(d.id))));
    }
    return root;
  };

  // Nieuw of bestaand doel aanmaken of aanpassen
  P.nieuwDoel = function (doel, voorbeeld) {
    const nieuw = !doel, v = doel || voorbeeld || {}, st = P.set();
    P.blad(nieuw ? 'Nieuw spaardoel' : 'Doel aanpassen', (sluit) => {
      const naam = P.veld('Naam', { value: v.naam || '', placeholder: 'Bijvoorbeeld Vakantie', maxlength: 40 });
      const bedrag = P.bedragVeld('Doelbedrag', v.doel);
      const al = P.bedragVeld('Al gespaard', 0, 'Begin met wat je al hebt weggelegd voor dit doel');
      const datum = P.veld('Einddatum (mag leeg)', { type: 'date', value: v.datum || '' });
      const maand = P.bedragVeld('Per maand sparen', v.maandinleg);
      const rente = P.veld('Rente per jaar (mag leeg)', { inputmode: 'decimal', value: typeof v.rente === 'number' ? P.inv(v.rente) : '', hint: 'Leeg = ' + P.pct(st.rente) + ' uit Instellingen' });
      const uit = h('div', { class: 'uitkomst', hidden: true });
      const bijwerk = () => {
        const d = P.getal(bedrag.el.value), m = P.getal(maand.el.value) || 0, a = nieuw ? (P.getal(al.el.value) || 0) : P.gespaard(doel);
        const r = P.getal(rente.el.value); const rr = isNaN(r) ? st.rente : r;
        uit.hidden = true; if (!(d > 0)) return;
        let t = '';
        if (datum.el.value) { const mm = P.maandenTot(datum.el.value); if (mm > 0) t = h('div', {}, h('span', { class: 'getal groot' }, P.eur(P.nodigPerMaand(a, d, mm, rr), true)), h('small', {}, 'per maand nodig om op ' + P.korteDatum(datum.el.value) + ' je doel te halen')); }
        else if (m > 0) { const mm = P.maandenTotDoel(a, d, m, rr); t = h('div', {}, h('span', { class: 'getal groot' }, mm === Infinity ? 'Lukt niet' : P.maandenVanaf(mm)), h('small', {}, 'dan heb je ' + P.eur(d) + ' bij ' + P.eur(m) + ' per maand')); }
        if (t) { uit.replaceChildren(t); uit.hidden = false; }
      };
      [bedrag, al, datum, maand, rente].forEach((f) => f.el.addEventListener('input', bijwerk));
      const body = h('div', {}, naam, bedrag, nieuw ? al : null, datum, maand, rente, uit,
        h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
          h('button', { class: 'knop', onclick: () => {
            const nm = naam.el.value.trim(), d = P.getal(bedrag.el.value);
            if (!nm) return P.toast('Geef je doel een naam');
            if (!(d > 0)) return P.toast('Vul een doelbedrag in');
            const o = Object.assign(doel || { id: P.id(), gestort: [] }, { naam: nm, doel: d, datum: datum.el.value || '', maandinleg: P.getal(maand.el.value) || 0 });
            const r = P.getal(rente.el.value); if (isNaN(r)) delete o.rente; else o.rente = r;
            if (nieuw) { const a = P.getal(al.el.value); if (a > 0) o.gestort.push({ d: P.vandaag(), b: a }); P.d.doelen.push(o); }
            P.bewaar(); sluit(); P.render(true); P.toast(nieuw ? 'Doel toegevoegd' : 'Doel bijgewerkt');
          } }, 'Opslaan')));
      bijwerk();
      return body;
    });
  };

  P.stortBlad = function (doel) {
    P.blad('Storten of opnemen', (sluit) => {
      let opnemen = false;
      const bedrag = P.bedragVeld('Bedrag'), datum = P.veld('Datum', { type: 'date', value: P.vandaag() });
      const knoppen = h('div', { class: 'schakel' });
      const maak = () => { knoppen.replaceChildren(
        h('button', { 'aria-pressed': String(!opnemen), onclick: () => { opnemen = false; maak(); } }, 'Storten'),
        h('button', { 'aria-pressed': String(opnemen), onclick: () => { opnemen = true; maak(); } }, 'Opnemen')); };
      maak();
      return h('div', {}, h('p', { class: 'gedempt' }, doel.naam + ' · nu ' + P.eur(P.gespaard(doel), true)), knoppen, bedrag, datum,
        h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
          h('button', { class: 'knop', onclick: () => {
            const b = P.getal(bedrag.el.value);
            if (!(b > 0)) return P.toast('Vul een bedrag in');
            if (opnemen && b > P.gespaard(doel) + 0.001) return P.toast('Je kunt niet meer opnemen dan er in zit');
            doel.gestort.push({ d: datum.el.value || P.vandaag(), b: opnemen ? -b : b });
            P.bewaar(); sluit(); P.sheets.slice().forEach((s) => s.sluit(true)); P.render(true);
            P.toast(opnemen ? 'Opgenomen' : (P.gespaard(doel) >= doel.doel ? 'Gestort: doel bereikt' : 'Gestort'));
          } }, opnemen ? 'Opnemen' : 'Storten')));
    });
  };

  P.doelBlad = function (id) {
    const doel = P.d.doelen.find((x) => x.id === id); if (!doel) return;
    P.blad(doel.naam, (sluit) => {
      const g = P.gespaard(doel);
      const hist = doel.gestort.slice().sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 8);
      return h('div', {},
        h('span', { class: 'getal', style: 'font-size:34px;font-weight:600;display:block' }, P.eur(g, true)),
        h('p', { class: 'gedempt' }, 'van ' + P.eur(doel.doel) + (doel.datum ? ' voor ' + P.korteDatum(doel.datum) : '')),
        P.balk(doel.doel ? g / doel.doel : 0, g >= doel.doel ? 'goed' : ''),
        h('div', { class: 'sub gedempt', style: 'margin:10px 0 0' }, P.doelRegels(doel).map((x) => h('div', {}, x))),
        h('div', { class: 'knoppen' },
          h('button', { class: 'knop', onclick: () => { sluit(true); P.stortBlad(doel); } }, 'Storten of opnemen'),
          h('button', { class: 'knop rand', onclick: () => { sluit(true); P.nieuwDoel(doel); } }, 'Aanpassen')),
        hist.length ? h('h3', { style: 'margin:22px 0 0' }, 'Laatste stortingen') : null,
        h('ul', { class: 'regels' }, hist.map((x) => h('li', { class: 'regel' }, h('div', { class: 'l' }, P.korteDatum(x.d)), h('span', { class: 'r getal ' + (x.b < 0 ? 'min' : 'plus') }, (x.b < 0 ? '−' : '+') + P.eur(Math.abs(x.b), true))))),
        h('div', { class: 'knoppen' }, h('button', { class: 'knop gevaar', onclick: () => { sluit(true); P.vraag('Doel verwijderen?', 'Je verwijdert ' + doel.naam + ' met alle stortingen. Dit kun je niet ongedaan maken.', 'Verwijderen', true, () => { P.d.doelen = P.d.doelen.filter((x) => x.id !== id); P.bewaar(); P.render(true); P.toast('Doel verwijderd'); }); } }, 'Doel verwijderen')));
    });
  };
})();
