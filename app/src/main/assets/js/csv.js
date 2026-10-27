// CSV-import van bankafschriften (Rabobank, plus een nette gok voor andere banken) en automatische categorieën.
(function () {
  const P = window.P;

  const REGELS = [
    ['Sparen & beleggen', ['spaar', 'degiro', 'bux ', 'brand new day', 'meesman', 'sparen', 'beleggen', 'flatex', 'saxo']],
    ['Boodschappen', ['albert heijn', 'ah to go', 'jumbo', 'lidl', 'aldi', 'plus ', 'dirk', 'coop ', 'spar ', 'ekoplaza', 'picnic', 'hoogvliet', 'vomar', 'dekamarkt', 'boni', 'poiesz', 'nettorama', 'jan linders']],
    ['Eten & drinken', ['restaurant', 'thuisbezorgd', 'uber eats', 'deliveroo', 'mcdonald', 'burger king', 'kfc', 'starbucks', 'cafe', 'café', 'bakker', 'domino', 'subway', 'lunchroom', 'new york pizza', 'snackbar', 'bar ', 'eetcafe', 'grand cafe']],
    ['Vervoer', ['ovpay', 'ns international', 'circle k', 'ns groep', 'ns reizigers', 'ns-', 'shell', 'tango', 'tinq', 'esso', 'texaco', 'bp ', 'parkeren', 'q-park', 'ov-chip', 'translink', 'gvb', 'htm', 'ret ', 'anwb', 'uber', 'flixbus', 'swapfiets', 'bolt', 'tamoil', 'total ']],
    ['Wonen', ['youfone', 'vodafone', 't-mobile', 'simyo', 'lebara', 'huur', 'hypotheek', 'vattenfall', 'eneco', 'essent', 'greenchoice', 'ziggo', 'kpn', 'odido', 'vitens', 'gemeente', 'waterschap', 'energie', 'woonstad', 'vve', 'woningcorporatie', 'waterbedrijf', 'pzem', 'budget energie', 'belastingdienst']],
    ['Abonnementen', ['npo ', 'netflix', 'spotify', 'disney', 'videoland', 'youtube', 'apple.com/bill', 'google', 'amazon prime', 'hbo', 'storytel', 'dropbox', 'icloud', 'microsoft', 'openai', 'anthropic', 'adobe', 'strava']],
    ['Verzekering & zorg', ['verzekering', 'zilveren kruis', 'cz ', 'vgz', 'menzis', 'ditzo', 'apotheek', 'huisarts', 'tandarts', 'fysio', 'centraal beheer', 'nationale-nederlanden', 'aegon', 'a.s.r', 'achmea', 'ohra', 'unive', 'fbto', 'interpolis', 'zorg']],
    ['Vrije tijd', ['gaming', 'toto', 'bioscoop', 'pathe', 'pathé', 'theater', 'steam', 'playstation', 'nintendo', 'sportschool', 'basic-fit', 'fitness', 'museum', 'concert', 'ticketmaster', 'efteling', 'dierentuin', 'bol.com/kijk']],
    ['Winkelen', ['klarna', 'bol.com', 'coolblue', 'zalando', 'h&m', 'hema', 'action', 'ikea', 'amazon', 'wehkamp', 'kruidvat', 'etos', 'primark', 'mediamarkt', 'blokker', 'gamma', 'praxis', 'intratuin', 'decathlon', 'vinted', 'marktplaats', 'ccv*']],
  ];
  P.categoriseer = function (bedrag, tekst) {
    const t = ' ' + tekst.toLowerCase() + ' ';
    // Overboekingen van en naar je spaarrekening zijn geen inkomen of uitgave, ook niet als het geld terugkomt.
    if (REGELS[0][1].some((s) => t.includes(s))) return REGELS[0][0];
    if (bedrag > 0) return 'Inkomen';
    for (const [cat, sleutels] of REGELS) if (sleutels.some((s) => t.includes(s))) return cat;
    return 'Overig';
  };

  // CSV-regels, met aanhalingstekens en puntkomma of komma als scheidingsteken
  P.leesCsv = function (tekst) {
    tekst = tekst.replace(/^﻿/, '');
    const eersteRegel = tekst.split(/\r?\n/, 1)[0];
    const sep = (eersteRegel.match(/;/g) || []).length > (eersteRegel.match(/,/g) || []).length ? ';' : ',';
    const rijen = []; let rij = [], cel = '', q = false;
    for (let i = 0; i < tekst.length; i++) {
      const c = tekst[i];
      if (q) {
        if (c === '"') { if (tekst[i + 1] === '"') { cel += '"'; i++; } else q = false; }
        else cel += c;
      } else if (c === '"') q = true;
      else if (c === sep) { rij.push(cel); cel = ''; }
      else if (c === '\n') { rij.push(cel); rijen.push(rij); rij = []; cel = ''; }
      else if (c !== '\r') cel += c;
    }
    if (cel || rij.length) { rij.push(cel); rijen.push(rij); }
    return rijen.filter((r) => r.some((x) => x.trim()));
  };

  const datumIso = function (s) {
    s = (s || '').trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/); if (m) return m[3] + '-' + m[2] + '-' + m[1];
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    return null;
  };
  const bedragNum = function (s) {
    s = (s || '').trim().replace(/[€\s+]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s);
  };

  // Zet de tekst om naar transacties. Geeft {nieuw, dubbel, fout}.
  P.leesAfschrift = function (tekst) {
    const rijen = P.leesCsv(tekst);
    if (rijen.length < 2) return { fout: 'Het bestand is leeg of geen CSV.' };
    const kop = rijen[0].map((x) => x.trim().toLowerCase());
    const kol = (...namen) => { for (const n of namen) { const i = kop.findIndex((k) => k === n || k.startsWith(n)); if (i >= 0) return i; } return -1; };
    const iDatum = kol('datum', 'date', 'boekdatum');
    const iBedrag = kol('bedrag', 'amount');
    const iNaam = kol('naam tegenpartij', 'naam / omschrijving', 'naam', 'name');
    const iAfBij = kol('af bij');
    const iOms = [kol('omschrijving-1'), kol('omschrijving-2'), kol('omschrijving-3'), kol('omschrijving'), kol('mededelingen')].filter((i) => i >= 0);
    const iIban = kol('iban/bban', 'rekening'), iVolg = kol('volgnr');
    if (iDatum < 0 || iBedrag < 0) return { fout: 'Ik herken de kolommen niet. Exporteer in je bank-app als CSV met datum en bedrag.' };
    const bestaand = new Set(P.d.transacties.map((x) => x.k).filter(Boolean));
    const nieuw = [], gezien = new Set(); let dubbel = 0, overgeslagen = 0;
    for (const r of rijen.slice(1)) {
      const d = datumIso(r[iDatum]); let b = bedragNum(r[iBedrag]);
      if (!d || isNaN(b)) { overgeslagen++; continue; }
      if (iAfBij >= 0 && /^af/i.test((r[iAfBij] || '').trim())) b = -Math.abs(b);
      else if (iAfBij >= 0 && /^bij/i.test((r[iAfBij] || '').trim())) b = Math.abs(b);
      const naam = iNaam >= 0 ? (r[iNaam] || '').trim() : '';
      const oms = iOms.map((i) => (r[i] || '').trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ');
      const o = (naam || oms || 'Onbekend').slice(0, 80);
      const k = [iIban >= 0 ? r[iIban] : '', iVolg >= 0 ? r[iVolg] : '', d, b, naam, oms.slice(0, 40)].join('|');
      if (bestaand.has(k) || gezien.has(k)) { dubbel++; continue; }
      gezien.add(k);
      nieuw.push({ id: P.id(), d, b: Math.round(b * 100) / 100, o, c: P.categoriseer(b, naam + ' ' + oms), k });
    }
    return { nieuw, dubbel, overgeslagen };
  };
})();
