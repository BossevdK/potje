// Gegevens, opslag en kleine hulpjes. Alles staat in localStorage op de telefoon.
(function () {
  const P = (window.P = { klaar: false, tab: 'overzicht', lerenTab: 'lessen' });
  P.N = window.PotjeNative || null; // de Kotlin-schil; null in een gewone browser
  const SLEUTEL = 'potje.v1';

  P.standaard = () => ({
    v: 1,
    instellingen: {
      thema: 'donker', rente: 2, rendement: 5, inflatie: 2, uurloon: 0,
      vergrendeling: false, tipMelding: false, tipUur: 19, horizon: 10, laatsteCheck: 0,
    },
    doelen: [], transacties: [], budgetten: {}, beleggingen: [], geleerd: {}, trucs: {},
  });

  P.laad = function () {
    let ruw = null;
    try { ruw = localStorage.getItem(SLEUTEL); } catch (e) {}
    if (!ruw) return P.standaard();
    try {
      const d = JSON.parse(ruw), s = P.standaard();
      return Object.assign(s, d, { instellingen: Object.assign(s.instellingen, d.instellingen || {}) });
    } catch (e) {
      try { localStorage.setItem(SLEUTEL + '.stuk', ruw); } catch (e2) {}
      P.beschadigd = true;
      return P.standaard();
    }
  };
  P.bewaar = function () {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(P.d)); }
    catch (e) { P.toast('Opslaan lukt niet: de telefoon is vol of geblokkeerd'); }
  };
  P.d = P.laad();
  P.set = () => P.d.instellingen;

  P.id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Getallen
  const f0 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const f2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  P.eur = (n, cent) => (cent ? f2 : f0).format(Math.round((n || 0) * 100) / 100).replace(/ /g, ' ');
  P.pct = (n, d = 1) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d }).format(n) + '%';
  P.getal = function (s) {
    s = String(s == null ? '' : s).trim().replace(/[€\s]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s);
  };
  P.inv = (n) => (n === 0 || n ? String(Math.round(n * 100) / 100).replace('.', ',') : '');

  // Datums
  const pad = (n) => String(n).padStart(2, '0');
  P.vandaag = () => { const t = new Date(); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); };
  P.mnd = (d) => d.slice(0, 7);
  P.huidigeMaand = () => P.vandaag().slice(0, 7);
  const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  P.maandNaam = (k) => MAANDEN[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4);
  P.verschuifMaand = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  P.dagKop = function (d) {
    const dt = new Date(d + 'T12:00:00'), nu = P.vandaag();
    if (d === nu) return 'Vandaag';
    if (d === new Date(Date.now() - 864e5).toISOString().slice(0, 10)) return 'Gisteren';
    return ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'][dt.getDay()] + ' ' + dt.getDate() + ' ' + MAANDEN[dt.getMonth()];
  };
  P.korteDatum = (d) => { const dt = new Date(d + 'T12:00:00'); return dt.getDate() + ' ' + MAANDEN[dt.getMonth()].slice(0, 3) + ' ' + dt.getFullYear(); };
  P.maandenVanaf = function (n) { // n maanden vanaf nu als "maand jaar"
    const t = new Date(); t.setMonth(t.getMonth() + Math.round(n));
    return MAANDEN[t.getMonth()] + ' ' + t.getFullYear();
  };
  P.maandenTot = function (datum) {
    const nu = new Date(), t = new Date(datum + 'T12:00:00');
    return (t.getFullYear() - nu.getFullYear()) * 12 + (t.getMonth() - nu.getMonth()) + (t.getDate() >= nu.getDate() ? 0 : -1);
  };
  P.dagVanJaar = function () { const n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5); };

  // Afgeleide gegevens
  P.gespaard = (doel) => (doel.gestort || []).reduce((s, x) => s + x.b, 0);
  P.doelRente = (doel) => (typeof doel.rente === 'number' ? doel.rente : P.set().rente);
  P.totaalGespaard = () => P.d.doelen.reduce((s, x) => s + P.gespaard(x), 0);
  P.totaalBelegd = () => P.d.beleggingen.reduce((s, x) => s + (x.waarde || 0), 0);
  P.totaalIngelegd = () => P.d.beleggingen.reduce((s, x) => s + (x.ingelegd || 0), 0);

  // Hulp om iets op te bouwen zonder framework
  P.h = function (tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(9)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  };
  P.svgIcoon = (pad) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<path d="' + pad + '"/>'; return s; };

  // Meldingen
  let toastT;
  P.toast = function (tekst) {
    document.querySelectorAll('.melding').forEach((n) => n.remove());
    const n = P.h('div', { class: 'melding', role: 'status' }, tekst);
    document.body.append(n);
    clearTimeout(toastT);
    toastT = setTimeout(() => n.remove(), 2800);
  };

  // Bestanden delen (in de app via het deelmenu, in een browser als download)
  P.deel = function (naam, tekst, mime) {
    if (P.N) { P.N.deel(naam, tekst, mime); return; }
    const a = P.h('a', { href: URL.createObjectURL(new Blob([tekst], { type: mime })), download: naam });
    document.body.append(a); a.click(); a.remove();
  };
  P.kopieer = function (tekst) {
    if (P.N) { P.N.kopieer(tekst); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(tekst).then(() => P.toast('Gekopieerd'));
  };
})();
