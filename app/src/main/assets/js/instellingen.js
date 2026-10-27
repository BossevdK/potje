// Scherm: Instellingen, met de knop om te zoeken naar updates (via GitHub-releases, zie Updater.kt).
(function () {
  const P = window.P, h = P.h;
  const DAG = 20 * 3600 * 1000;

  // ---- Updates ----
  P.update = null; // {status:'zoeken'|'nieuw'|'actueel'|'fout'|'uit'|'downloaden'|'wacht', name, notes, apk, voortgang}
  P.updateTekst = function () {
    const u = P.update, v = P.versie();
    if (!P.N) return 'Updaten werkt alleen in de app.';
    if (!u) return 'Je hebt versie ' + v.name + '.';
    switch (u.status) {
      case 'zoeken': return 'Zoeken…';
      case 'nieuw': return 'Versie ' + u.name + ' is beschikbaar' + (u.notes ? ': ' + u.notes : '.');
      case 'actueel': return 'Je hebt de nieuwste versie (' + v.name + ').';
      case 'uit': return 'Updates zijn in deze versie niet ingesteld.';
      case 'downloaden': return 'Downloaden… ' + (u.voortgang || 0) + '%';
      case 'wacht': return 'Sta Potje toe om apps te installeren en tik daarna opnieuw op de knop.';
      case 'gestart': return 'Volg de stappen van Android om te installeren.';
      default: return 'Zoeken lukt niet. Controleer je internetverbinding en probeer opnieuw.';
    }
  };
  P.versie = function () { try { return P.N ? JSON.parse(P.N.versie()) : { name: 'web', code: 0 }; } catch (e) { return { name: '?', code: 0 }; } };
  P.zoekUpdate = function (stil) {
    if (!P.N) { if (!stil) P.toast('Updaten werkt alleen in de app'); return; }
    if (P.update && (P.update.status === 'zoeken' || P.update.status === 'downloaden')) return;
    if (P.update && P.update.status === 'nieuw' && !stil) { const u = P.update; P.update = Object.assign({}, u, { status: 'downloaden', voortgang: 0, basis: u }); P.N.installeer(u.apk); }
    else { P.update = { status: 'zoeken', stil }; P.N.zoekUpdate(); }
    if (P.tab === 'instellingen') P.render(true);
  };
  window.onUpdate = (r) => {
    const stil = P.update && P.update.stil;
    P.set().laatsteCheck = Date.now(); P.bewaar();
    P.update = r;
    if (stil && r.status !== 'nieuw') P.update = null;
    if (P.tab === 'instellingen' || P.tab === 'overzicht') P.render(true);
  };
  window.onUpdateVoortgang = (p) => { if (P.update) { P.update.voortgang = p; const el = document.getElementById('updatetekst'); if (el) el.textContent = P.updateTekst(); } };
  window.onUpdateKlaar = (s) => {
    const basis = P.update && P.update.basis;
    P.update = Object.assign({}, basis || {}, { status: s === 'need_permission' ? 'wacht' : s === 'started' ? 'gestart' : 'fout' });
    if (P.update.status === 'wacht' || P.update.status === 'fout') P.update.status = P.update.status; // blijft zichtbaar
    if (P.tab === 'instellingen') P.render(true);
  };
  P.stilleCheck = function () { if (P.N && Date.now() - P.set().laatsteCheck > DAG) P.zoekUpdate(true); };

  // ---- Weergave en meldingen ----
  P.thema = function () {
    const t = P.set().thema, licht = t === 'licht' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.dataset.thema = licht ? 'licht' : 'donker';
    if (P.N) P.N.zetThema(licht);
  };
  P.plantMelding = function () {
    if (!P.N) return;
    const s = P.set();
    P.N.zetMelding(!!s.tipMelding, s.tipUur, JSON.stringify(P.tips));
  };
  window.onMeldingToestemming = (ok) => {
    if (ok) { P.set().tipMelding = true; P.bewaar(); P.plantMelding(); P.toast('Je krijgt elke dag een tip'); }
    else { P.set().tipMelding = false; P.bewaar(); P.toast('Zonder toestemming kan Potje geen melding sturen'); }
    if (P.tab === 'instellingen') P.render(true);
  };

  // ---- Gegevens ----
  const csvCel = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  P.exporteerUitgaven = function () {
    const rijen = ['Datum;Bedrag;Omschrijving;Categorie'].concat(P.d.transacties.slice().sort((a, b) => (a.d < b.d ? -1 : 1)).map((x) => [x.d, String(x.b).replace('.', ','), csvCel(x.o), csvCel(x.c)].join(';')));
    P.deel('potje-uitgaven-' + P.vandaag() + '.csv', '﻿' + rijen.join('\r\n'), 'text/csv');
  };
  P.backup = () => P.deel('potje-back-up-' + P.vandaag() + '.json', JSON.stringify(P.d, null, 1), 'application/json');
  P.terugzetten = function () {
    P.kiesBestand('.json,application/json,*/*', (tekst) => {
      let d; try { d = JSON.parse(tekst); } catch (e) { return P.blad('Terugzetten mislukt', () => h('p', {}, 'Dit is geen Potje-back-up.')); }
      if (!d || d.v !== 1 || !Array.isArray(d.doelen) || !Array.isArray(d.transacties)) return P.blad('Terugzetten mislukt', () => h('p', {}, 'Dit bestand lijkt niet van Potje te zijn.'));
      P.vraag('Back-up terugzetten?', 'Je huidige gegevens worden vervangen door de back-up: ' + d.doelen.length + ' doelen, ' + d.transacties.length + ' transacties en ' + (d.beleggingen || []).length + ' beleggingen.', 'Terugzetten', false, () => {
        const s = P.standaard(); P.d = Object.assign(s, d, { instellingen: Object.assign(s.instellingen, d.instellingen || {}) });
        P.bewaar(); P.thema(); P.plantMelding(); P.render(); P.toast('Back-up teruggezet');
      });
    });
  };
  P.wisAlles = () => P.vraag('Alles wissen?', 'Alle doelen, transacties, beleggingen en instellingen verdwijnen van deze telefoon. Maak eerst een back-up als je ze nog wilt hebben.', 'Alles wissen', true, () => {
    P.d = P.standaard(); P.bewaar(); P.thema(); P.plantMelding(); if (P.N) P.N.beschermScherm(false); P.maand = P.huidigeMaand(); P.ga('overzicht'); P.toast('Alles gewist');
  });

  // ---- Scherm ----
  const sec = (titel, ...kids) => [h('h2', {}, titel), ...kids];
  const wissel = (label, uitleg, aan, klik) => h('button', { class: 'vink', 'aria-pressed': String(!!aan), role: 'switch', 'aria-checked': String(!!aan), onclick: klik },
    h('span', { class: 'doos' }), h('span', {}, h('b', {}, label), h('span', { class: 't' }, uitleg)));

  P.schermen.instellingen = function () {
    const s = P.set(), root = h('div', { class: 'scherm' });
    root.append(h('h1', { style: 'margin-top:12px' }, 'Instellingen'));

    const thema = h('div', { class: 'schakel' }, [['donker', 'Donker'], ['licht', 'Licht'], ['auto', 'Systeem']].map(([k, l]) =>
      h('button', { 'aria-pressed': String(s.thema === k), onclick: () => { s.thema = k; P.bewaar(); P.thema(); P.render(true); } }, l)));
    root.append(...sec('Weergave', thema));

    const aan = (k, label, hint) => { const f = P.veld(label, { inputmode: 'decimal', value: P.inv(s[k]), hint });
      f.el.addEventListener('change', () => { const v = P.getal(f.el.value); if (!isNaN(v) && v >= 0 && v <= 100) { s[k] = v; P.bewaar(); } else f.el.value = P.inv(s[k]); }); return f; };
    const uurloon = P.veld('Netto uurloon (voor de rekenhulp Werkuren)', { inputmode: 'decimal', value: s.uurloon ? P.inv(s.uurloon) : '', placeholder: '0,00' });
    uurloon.el.addEventListener('change', () => { const v = P.getal(uurloon.el.value); s.uurloon = v > 0 ? v : 0; P.bewaar(); });
    root.append(...sec('Aannames voor je verwachting',
      h('p', { class: 'gedempt klein' }, 'Potje rekent hiermee je verwachte bedrag uit. Het zijn aannames, geen beloftes. Voorzichtig rekenen is verstandig.'),
      aan('rente', 'Spaarrente per jaar (%)', 'Voor spaardoelen zonder eigen rente'),
      aan('rendement', 'Rendement beleggingen per jaar (%)', 'Lange-termijn gemiddelde, na kosten'),
      aan('inflatie', 'Inflatie per jaar (%)', 'Voor het bedrag in euro\'s van vandaag'), uurloon));

    root.append(...sec('Beveiliging',
      wissel('Vergrendel met vingerafdruk of pincode', 'Potje vraagt het bij het openen en na een halve minuut weg. Bedragen verdwijnen ook uit het app-overzicht van Android.', s.vergrendeling, () => {
        if (!P.N) return P.toast('Vergrendelen werkt alleen in de app');
        if (!s.vergrendeling && !P.N.kanVergrendelen()) return P.toast('Stel eerst een schermvergrendeling in op je telefoon');
        s.vergrendeling = !s.vergrendeling; P.bewaar(); P.N.beschermScherm(s.vergrendeling); P.render(true);
      })));

    root.append(...sec('Meldingen',
      wissel('Dagelijkse tip', 'Elke dag een korte tip over geld op het gekozen uur.', s.tipMelding, () => {
        if (!P.N) return P.toast('Meldingen werken alleen in de app');
        if (s.tipMelding) { s.tipMelding = false; P.bewaar(); P.plantMelding(); P.render(true); } else P.N.vraagMeldingToestemming();
      }),
      s.tipMelding ? P.veldUur() : null));

    root.append(...sec('Je gegevens',
      h('p', { class: 'gedempt klein' }, 'Alles staat alleen op deze telefoon. Maak af en toe een back-up en bewaar die op een veilige plek.'),
      h('ul', { class: 'regels' },
        rij('Back-up maken', 'Bestand met al je gegevens', P.backup),
        rij('Back-up terugzetten', 'Vervangt je huidige gegevens', P.terugzetten),
        rij('Uitgaven exporteren', 'CSV voor Excel of een andere app', P.exporteerUitgaven),
        rij('Alles wissen', 'Begin helemaal opnieuw', P.wisAlles, true))));

    const u = P.update, v = P.versie(), bezig = u && (u.status === 'zoeken' || u.status === 'downloaden');
    root.append(...sec('Updates',
      h('p', { id: 'updatetekst', class: 'gedempt', 'aria-live': 'polite' }, P.updateTekst()),
      h('button', { class: 'knop vol', disabled: bezig, onclick: () => P.zoekUpdate() }, u && u.status === 'nieuw' ? 'Installeer versie ' + u.name : u && u.status === 'wacht' ? 'Opnieuw proberen' : 'Zoek naar updates'),
      h('p', { class: 'gedempt klein', style: 'margin-top:14px' }, 'Potje ' + v.name + '. Updates komen van GitHub (' + (P.N ? (JSON.parse(P.N.versie()).repo || 'niet ingesteld') : 'alleen in de app') + '). Er worden geen gegevens van jou verstuurd.')));
    return root;
  };
  function rij(titel, sub, klik, gevaar) {
    return h('li', {}, h('button', { class: 'regel', onclick: klik }, h('div', { class: 'l' }, h('b', { class: gevaar ? 'min' : '' }, titel), h('small', {}, sub)), h('span', { class: 'r gedempt' }, P.svgIcoon('M9 6l6 6-6 6'))));
  }
  P.veldUur = function () {
    const s = P.set(), f = P.veld('Tijdstip', { opties: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'), value: String(s.tipUur).padStart(2, '0') + ':00' });
    f.el.addEventListener('change', () => { s.tipUur = parseInt(f.el.value, 10); P.bewaar(); P.plantMelding(); P.toast('Tijdstip opgeslagen'); });
    return f;
  };
})();
