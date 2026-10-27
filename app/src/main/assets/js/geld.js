// Schermen: Uitgaven (budget, afschrift-import) en Beleggen (handmatig bijhouden).
(function () {
  const P = window.P, h = P.h;
  P.maand = P.huidigeMaand();

  P.kiesBestand = function (accept, cb) {
    const inp = h('input', { type: 'file', accept: accept || '*/*', style: 'position:fixed;left:-9999px' });
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      const r = new FileReader(); r.onload = () => cb(String(r.result), f.name); r.onerror = () => P.toast('Het bestand kon niet worden gelezen'); r.readAsText(f);
    });
    document.body.append(inp); inp.click();
  };

  P.schermen.uitgaven = function () {
    const root = h('div', { class: 'scherm' }), mo = P.maandOverzicht(P.maand), nu = P.huidigeMaand();
    root.append(h('div', { class: 'maand' },
      h('button', { class: 'icoon', 'aria-label': 'Vorige maand', onclick: () => { P.maand = P.verschuifMaand(P.maand, -1); P.render(); } }, P.svgIcoon('M15 6l-6 6 6 6')),
      h('h1', {}, P.maandNaam(P.maand)),
      h('button', { class: 'icoon', 'aria-label': 'Volgende maand', disabled: P.maand >= nu, style: P.maand >= nu ? 'opacity:.3' : '', onclick: () => { if (P.maand < nu) { P.maand = P.verschuifMaand(P.maand, 1); P.render(); } } }, P.svgIcoon('M9 6l6 6-6 6'))));

    const over = mo.inkomen - mo.uit - mo.gespaard;
    root.append(h('div', { class: 'cijfers' },
      h('div', {}, h('small', {}, 'Inkomen'), h('b', { class: 'getal' }, P.eur(mo.inkomen))),
      h('div', {}, h('small', {}, 'Uitgegeven'), h('b', { class: 'getal' }, P.eur(mo.uit))),
      h('div', {}, h('small', {}, 'Over'), h('b', { class: 'getal' + (over < 0 ? ' min' : '') }, P.eur(over)))));
    root.append(h('div', { class: 'knoppen' },
      h('button', { class: 'knop', onclick: () => P.transactieBlad() }, 'Toevoegen'),
      h('button', { class: 'knop rand', onclick: P.importeer }, 'Importeer bestand')));

    if (!P.d.transacties.length) {
      root.append(h('div', { class: 'leeg' }, h('p', {}, 'Download in de Rabobank-app je transacties (CSV of PDF) en importeer ze hier. Potje deelt ze zelf in categorieën in. Je kunt ook uitgaven met de hand noteren.')));
      return root;
    }

    // Categorieën met budget
    const cats = P.CATEGORIEEN.filter((c) => mo.perCat[c] || P.d.budgetten[c]);
    if (cats.length) {
      root.append(h('div', { class: 'titelrij' }, h('h2', {}, 'Per categorie'), h('span', { class: 'gedempt klein' }, 'Tik voor budget')));
      root.append(h('ul', { class: 'regels' }, cats.map((c) => {
        const b = P.d.budgetten[c], s = mo.perCat[c] || 0;
        return h('li', {}, h('button', { class: 'regel', onclick: () => P.budgetBlad(c) },
          h('div', { class: 'l' }, h('b', {}, c), b ? P.balk(s / b, s > b ? 'over' : '') : null, b ? h('small', {}, s > b ? P.eur(s - b) + ' over budget' : P.eur(b - s) + ' over') : h('small', {}, 'Geen budget')),
          h('span', { class: 'r getal' }, P.eur(s), b ? h('small', {}, 'van ' + P.eur(b)) : null)));
      })));
    }

    // Transacties per dag
    root.append(h('h2', {}, 'Transacties'));
    if (!mo.t.length) { root.append(h('p', { class: 'gedempt' }, 'Geen transacties in deze maand.')); return root; }
    const perDag = {};
    mo.t.forEach((x) => (perDag[x.d] = perDag[x.d] || []).push(x));
    Object.keys(perDag).sort().reverse().forEach((dag) => {
      root.append(h('div', { class: 'dag' }, P.dagKop(dag)),
        h('ul', { class: 'regels' }, perDag[dag].map((x) => h('li', {}, h('button', { class: 'regel', onclick: () => P.transactieBlad(x) },
          h('div', { class: 'l' }, h('b', {}, x.o), h('small', {}, x.c)),
          h('span', { class: 'r getal ' + (x.b > 0 ? 'plus' : '') }, (x.b > 0 ? '+' : '−') + P.eur(Math.abs(x.b), true)))))));
    });
    return root;
  };

  P.budgetBlad = function (cat) {
    P.blad('Budget: ' + cat, (sluit) => {
      const v = P.bedragVeld('Budget per maand', P.d.budgetten[cat], 'Leeg of 0 haalt het budget weg');
      return h('div', {}, h('p', { class: 'gedempt' }, 'Deze maand uitgegeven: ' + P.eur(P.maandOverzicht(P.maand).perCat[cat] || 0)), v,
        h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
          h('button', { class: 'knop', onclick: () => { const b = P.getal(v.el.value); if (b > 0) P.d.budgetten[cat] = b; else delete P.d.budgetten[cat]; P.bewaar(); sluit(); P.render(true); } }, 'Opslaan')));
    });
  };

  P.transactieBlad = function (tx) {
    const nieuw = !tx;
    P.blad(nieuw ? 'Uitgave of inkomen' : 'Transactie', (sluit) => {
      let inkomen = !nieuw && tx.b > 0;
      const bedrag = P.bedragVeld('Bedrag', nieuw ? 0 : Math.abs(tx.b)), oms = P.veld('Omschrijving', { value: nieuw ? '' : tx.o, maxlength: 80, placeholder: 'Bijvoorbeeld boodschappen' });
      const cat = P.veld('Categorie', { opties: P.CATEGORIEEN.concat(['Sparen & beleggen']), value: nieuw || tx.c === 'Inkomen' ? 'Overig' : tx.c });
      const datum = P.veld('Datum', { type: 'date', value: nieuw ? (P.maand === P.huidigeMaand() ? P.vandaag() : P.maand + '-01') : tx.d });
      const knoppen = h('div', { class: 'schakel' });
      const maak = () => { knoppen.replaceChildren(
        h('button', { 'aria-pressed': String(!inkomen), onclick: () => { inkomen = false; maak(); } }, 'Uitgave'),
        h('button', { 'aria-pressed': String(inkomen), onclick: () => { inkomen = true; maak(); } }, 'Inkomen')); cat.hidden = inkomen; };
      maak();
      return h('div', {}, knoppen, bedrag, oms, cat, datum,
        h('div', { class: 'knoppen' }, !nieuw ? h('button', { class: 'knop gevaar', onclick: () => { P.d.transacties = P.d.transacties.filter((x) => x !== tx); P.bewaar(); sluit(); P.render(true); P.toast('Verwijderd'); } }, 'Verwijderen') : h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
          h('button', { class: 'knop', onclick: () => {
            const b = P.getal(bedrag.el.value);
            if (!(b > 0)) return P.toast('Vul een bedrag in');
            const t = nieuw ? { id: P.id() } : tx;
            Object.assign(t, { d: datum.el.value || P.vandaag(), b: inkomen ? b : -b, o: oms.el.value.trim() || (inkomen ? 'Inkomen' : 'Uitgave'), c: inkomen ? 'Inkomen' : cat.el.value });
            if (nieuw) P.d.transacties.push(t);
            P.maand = P.mnd(t.d); P.bewaar(); sluit(); P.render(true);
          } }, 'Opslaan')));
    });
  };

  // Kiest een CSV of PDF en geeft {tekst} of {pdf: ArrayBuffer} door.
  P.kiesAfschrift = function (cb) {
    const inp = h('input', { type: 'file', accept: '.csv,.pdf,text/csv,application/pdf,text/plain,*/*', style: 'position:fixed;left:-9999px' });
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      const pdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf', r = new FileReader();
      r.onload = () => cb(pdf ? { pdf: r.result } : { tekst: String(r.result) });
      r.onerror = () => P.toast('Het bestand kon niet worden gelezen');
      if (pdf) r.readAsArrayBuffer(f); else r.readAsText(f);
    });
    document.body.append(inp); inp.click();
  };

  P.importeer = function () {
    P.kiesAfschrift(async (f) => {
      let r;
      if (f.pdf) {
        P.toast('PDF wordt gelezen…');
        try { r = await P.leesAfschriftPdf(f.pdf, (p, n) => P.toast('PDF lezen: pagina ' + p + ' van ' + n)); }
        catch (e) { return P.blad('Import niet gelukt', () => h('p', {}, 'Dit PDF-bestand kon niet worden gelezen. Is het beveiligd met een wachtwoord of een scan van papier? Probeer een CSV.')); }
        if (!r.herkend) return P.blad('Geen transacties herkend', (sluit) => h('div', {},
          h('p', {}, 'Ik kon in deze PDF geen regels met een datum en een bedrag met plus of min vinden. Een PDF heeft geen vaste opmaak, dus dit kan per bank en per soort overzicht verschillen.'),
          h('p', { class: 'gedempt' }, 'Je kunt de ingelezen tekst kopiëren en een paar regels daarvan met verzonnen namen en bedragen delen, zodat de import erop aangepast kan worden. Plak geen echte gegevens van jezelf of anderen.'),
          h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => sluit() }, 'Sluiten'),
            h('button', { class: 'knop', onclick: () => P.kopieer(r.regels.slice(0, 60).join('\n')) }, 'Kopieer tekst'))));
      } else r = P.leesAfschrift(f.tekst);
      if (r.fout) return P.blad('Import niet gelukt', () => h('p', {}, r.fout));
      if (!r.nieuw.length) return P.blad('Niets nieuws', () => h('p', { class: 'gedempt' }, r.dubbel ? 'Alle ' + r.dubbel + ' transacties stonden al in Potje.' : 'Er zijn geen transacties gevonden in dit bestand.'));
      P.blad('Importeren', (sluit) => {
        const data = r.nieuw.map((x) => x.d).sort(), perCat = {};
        r.nieuw.forEach((x) => { if (x.b < 0) perCat[x.c] = (perCat[x.c] || 0) + -x.b; });
        const top = Object.entries(perCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return h('div', {},
          h('p', {}, h('b', {}, r.nieuw.length + ' nieuwe transacties'), ' van ' + P.korteDatum(data[0]) + ' tot ' + P.korteDatum(data[data.length - 1]) + '.'),
          r.dubbel ? h('p', { class: 'gedempt klein' }, r.dubbel + ' stonden al in Potje en worden overgeslagen.') : null,
          f.pdf ? h('div', {}, h('p', { class: 'gedempt klein' }, 'Gelezen als: ' + r.formaat + ' (' + r.regels.length + ' regels tekst, ' + r.herkend + ' transacties gevonden).'),
            r.totalen
              ? h('p', { class: 'klein ' + (r.totalen.klopt ? 'plus' : 'min') }, r.totalen.klopt ? 'De totalen kloppen met bovenaan je afschrift.' : 'De totalen kloppen niet met je afschrift (afschrift: ' + P.eur(r.totalen.af, true) + ' af en ' + P.eur(r.totalen.bij, true) + ' bij). Controleer de regels.')
              : h('p', { class: 'gedempt klein' }, 'Een PDF kan fouten geven: controleer of deze regels kloppen voor je importeert.'),
            h('button', { class: 'link', onclick: () => P.kopieer(r.regels.slice(0, 80).join('\n')) }, 'Kopieer ingelezen tekst (eerste 80 regels)'),
            h('table', { class: 'tabel' }, r.nieuw.slice(0, 4).map((x) => h('tr', {}, h('td', {}, P.korteDatum(x.d)), h('td', {}, x.o.slice(0, 28)), h('td', { class: 'getal' }, (x.b > 0 ? '+' : '−') + P.eur(Math.abs(x.b), true)))))) : null,
          r.overgeslagen ? h('p', { class: 'gedempt klein' }, r.overgeslagen + ' regels met een bedrag maar zonder datum zijn overgeslagen.') : null,
          top.length ? h('table', { class: 'tabel', style: 'margin-top:12px' }, h('tr', {}, h('th', {}, 'Grootste categorieën'), h('th', {}, 'Uitgegeven')), top.map(([c, v]) => h('tr', {}, h('td', {}, c), h('td', { class: 'getal' }, P.eur(v))))) : null,
          h('p', { class: 'gedempt klein', style: 'margin-top:12px' }, 'Je kunt de categorie van elke transactie daarna nog aanpassen.'),
          h('div', { class: 'knoppen' }, h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren'),
            h('button', { class: 'knop', onclick: () => { P.d.transacties.push(...r.nieuw); P.maand = P.mnd(data[data.length - 1]); P.bewaar(); sluit(); P.ga('uitgaven'); P.toast(r.nieuw.length + ' transacties geïmporteerd'); } }, 'Importeer ' + r.nieuw.length)));
      });
    });
  };

  // ------- Beleggen -------
  P.schermen.beleggen = function () {
    const root = h('div', { class: 'scherm' }), lijst = P.d.beleggingen;
    root.append(h('div', { class: 'titelrij', style: 'margin-top:12px' }, h('h1', {}, 'Beleggen'), lijst.length ? h('button', { class: 'knop', style: 'min-height:40px;padding:0 14px;font-size:15px', onclick: () => P.beleggingBlad() }, 'Toevoegen') : null));
    if (!lijst.length) {
      root.append(h('div', { class: 'leeg' }, h('p', {}, 'Houd bij wat je hebt belegd en wat het nu waard is. Potje volgt geen koersen: je werkt de waarde zelf bij, bijvoorbeeld één keer per maand.'),
        h('button', { class: 'knop', onclick: () => P.beleggingBlad() }, 'Eerste belegging toevoegen')));
    } else {
      const waarde = P.totaalBelegd(), ingelegd = P.totaalIngelegd(), winst = waarde - ingelegd;
      root.append(h('div', { class: 'hoofd' }, h('span', { class: 'gedempt' }, 'Waarde nu'), h('span', { class: 'getal groot' }, P.eur(waarde)),
        h('div', { class: 'naast' }, h('span', {}, 'Ingelegd ', h('b', { class: 'getal' }, P.eur(ingelegd))),
          h('span', {}, 'Resultaat ', h('b', { class: 'getal ' + (winst < 0 ? 'min' : 'plus') }, (winst < 0 ? '−' : '+') + P.eur(Math.abs(winst)) + (ingelegd > 0 ? ' (' + P.pct(Math.abs(winst) / ingelegd * 100) + ')' : ''))))));

      const perSoort = {}; lijst.forEach((x) => (perSoort[x.soort] = (perSoort[x.soort] || 0) + (x.waarde || 0)));
      if (Object.keys(perSoort).length > 1 && waarde > 0) {
        root.append(h('h2', {}, 'Spreiding'), h('ul', { class: 'regels' }, Object.entries(perSoort).sort((a, b) => b[1] - a[1]).map(([s, v]) =>
          h('li', { class: 'regel' }, h('div', { class: 'l' }, h('b', {}, s), P.balk(v / waarde)), h('span', { class: 'r getal' }, Math.round(v / waarde * 100) + '%')))));
      }
      root.append(h('h2', {}, 'Je beleggingen'), h('ul', { class: 'regels' }, lijst.map((x) => {
        const w = (x.waarde || 0) - (x.ingelegd || 0);
        return h('li', {}, h('button', { class: 'regel', onclick: () => P.beleggingBlad(x) },
          h('div', { class: 'l' }, h('b', {}, x.naam), h('small', {}, x.soort + (x.bijgewerkt ? ' · bijgewerkt ' + P.korteDatum(x.bijgewerkt) : ''))),
          h('span', { class: 'r getal' }, P.eur(x.waarde || 0), h('small', { class: w < 0 ? 'min' : 'plus' }, (w < 0 ? '−' : '+') + P.eur(Math.abs(w))))));
      })));
    }
    root.append(h('p', { class: 'gedempt klein', style: 'margin-top:22px' }, 'Potje geeft geen beleggingsadvies. Rendement uit het verleden is geen garantie voor de toekomst. Je verwachting rekent met ' + P.pct(P.set().rendement) + ' per jaar; pas dat aan in Instellingen.'));
    return root;
  };

  P.beleggingBlad = function (x) {
    const nieuw = !x;
    P.blad(nieuw ? 'Belegging toevoegen' : x.naam, (sluit) => {
      const naam = P.veld('Naam', { value: nieuw ? '' : x.naam, placeholder: 'Bijvoorbeeld Wereldfonds', maxlength: 40 });
      const soort = P.veld('Soort', { opties: P.BELEGGINGSSOORTEN, value: nieuw ? P.BELEGGINGSSOORTEN[0] : x.soort });
      const ingelegd = P.bedragVeld('Totaal ingelegd', nieuw ? 0 : x.ingelegd, 'Alles wat je er zelf in hebt gestopt');
      const waarde = P.bedragVeld('Waarde nu', nieuw ? 0 : x.waarde);
      const maand = P.bedragVeld('Per maand inleggen', nieuw ? 0 : x.maandinleg);
      return h('div', {}, naam, soort, h('div', { class: 'twee' }, ingelegd, waarde), maand,
        h('div', { class: 'knoppen' },
          nieuw ? h('button', { class: 'knop rand', onclick: () => sluit() }, 'Annuleren') : h('button', { class: 'knop gevaar', onclick: () => { sluit(true); P.vraag('Verwijderen?', 'Je verwijdert ' + x.naam + ' uit Potje.', 'Verwijderen', true, () => { P.d.beleggingen = P.d.beleggingen.filter((y) => y !== x); P.bewaar(); P.render(true); }); } }, 'Verwijderen'),
          h('button', { class: 'knop', onclick: () => {
            const nm = naam.el.value.trim(), w = P.getal(waarde.el.value);
            if (!nm) return P.toast('Geef de belegging een naam');
            if (isNaN(w) || w < 0) return P.toast('Vul de waarde van nu in');
            const o = nieuw ? { id: P.id() } : x;
            Object.assign(o, { naam: nm, soort: soort.el.value, ingelegd: P.getal(ingelegd.el.value) || 0, waarde: w, maandinleg: P.getal(maand.el.value) || 0, bijgewerkt: P.vandaag() });
            if (nieuw) P.d.beleggingen.push(o);
            P.bewaar(); sluit(); P.render(true);
          } }, 'Opslaan')));
    });
  };
})();
