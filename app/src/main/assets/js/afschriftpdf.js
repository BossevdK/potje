// PDF-afschriften inlezen (bijvoorbeeld uit de Rabo-app). De tekst wordt met pdf.js uit het bestand gehaald, per regel
// samengevoegd en daarna op zoek naar datums en bedragen met een plus of min. Dat werkt voor meerdere opmaken,
// maar een PDF heeft geen vaste kolommen: controleer daarom altijd het voorbeeld voor je importeert.
(function () {
  const P = window.P;

  P.laadScript = function (src) {
    return new Promise((ok, fout) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => fout(new Error('Kon ' + src + ' niet laden'));
      document.head.append(s);
    });
  };

  // Alle regels tekst uit een PDF, in leesvolgorde.
  P.pdfRegels = async function (buffer) {
    if (!window.pdfjsLib) {
      await P.laadScript('js/lib/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.js';
    }
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const regels = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tekst = await (await pdf.getPage(p)).getTextContent();
      const items = tekst.items.filter((i) => i.str && i.str.trim()).map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5] }));
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      let rij = [], y0 = null;
      const sluit = () => { if (rij.length) regels.push(rij.sort((a, b) => a.x - b.x).map((i) => i.s.trim()).join(' ').replace(/\s+/g, ' ')); rij = []; };
      for (const it of items) {
        if (y0 === null || Math.abs(it.y - y0) > 3) { sluit(); y0 = it.y; }
        rij.push(it);
      }
      sluit();
    }
    return regels;
  };

  const MND = { jan: 1, feb: 2, mrt: 3, maa: 3, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
  const iso = (j, m, d) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? j + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') : null);
  const DATUMS = [
    [/(\d{4})-(\d{2})-(\d{2})/, (m) => iso(+m[1], +m[2], +m[3])],
    [/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/, (m) => iso(+m[3], +m[2], +m[1])],
    [/(\d{1,2})\s+(jan|feb|mrt|maa|mar|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?,?\s+(\d{4})/i, (m) => iso(+m[3], MND[m[2].toLowerCase()], +m[1])],
  ];
  const BEDRAG = /(?:([+-])\s?)?(?:€\s?|EUR\s?)?(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(?!\d)(?:\s?(?:EUR|€))?(?:\s?([+-])(?![\d,]))?/g;
  const RUIS = /^(pagina|blz\.?|datum\b|omschrijving\b|bedrag\b|saldo\b|begin|eind|rabobank|iban\b|afschrift|transactieoverzicht|periode|overzicht|totaal|bijschrijvingen|afschrijvingen|rekeninghouder|rekening\b|naam\b|valutadatum)/i;

  const SALDO = /^(saldo|beginsaldo|eindsaldo|begin\s?saldo|eind\s?saldo|totaal|totalen|bijschrijvingen|afschrijvingen|nieuw saldo|oud saldo)\b/i;

  const WEEKDAG = /\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b,?/gi;
  // Omschrijving zonder losse bedragen (bijv. het saldo ernaast) en zonder Af/Bij.
  function schoon(t) {
    return t.replace(BEDRAG, ' ').replace(/\b(af|bij)\b\.?/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  function zoekDatum(r) {
    for (const [re, naarIso] of DATUMS) { const m = r.match(re); if (m) { const d = naarIso(m); if (d) return { d, rest: r.replace(m[0], ' ') }; } }
    return null;
  }
  function zoekBedrag(r) {
    BEDRAG.lastIndex = 0; let m;
    while ((m = BEDRAG.exec(r))) {
      const teken = m[1] || m[4];
      const bijAf = !teken && r.match(/\b(af|bij)\b/i);
      const sign = teken ? teken : bijAf ? (/^af/i.test(bijAf[1]) ? '-' : '+') : null;
      if (!sign) continue; // geen plus of min: niet te zeggen of het uitgave of inkomen is (bijv. een saldo)
      const getal = parseFloat(m[2].replace(/\./g, '') + '.' + m[3]);
      return { b: Math.round((sign === '-' ? -getal : getal) * 100) / 100, rest: (r.slice(0, m.index) + ' ' + r.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() };
    }
    return null;
  }

  // Regels -> transacties. Geeft {nieuw, dubbel, overgeslagen, herkend}.
  P.parseAfschriftRegels = function (regels) {
    const norm = regels.map((r) => r.replace(/[−–—]/g, '-').trim()).filter(Boolean);
    const tx = []; let datum = null, buffer = [], vorige = null, overgeslagen = 0;
    for (let r of norm) {
      const dt = zoekDatum(r); let heeftDatum = false;
      if (dt) { datum = dt.d; r = dt.rest.replace(WEEKDAG, ' ').replace(/\s+/g, ' ').trim(); heeftDatum = true; }
      const bd = SALDO.test(r) ? null : zoekBedrag(r); // regels met saldo's en totalen zijn geen transacties
      if (SALDO.test(r)) continue;
      if (bd) {
        if (!datum) { overgeslagen++; buffer = []; continue; }
        let tekst = bd.rest;
        if (!tekst && buffer.length) tekst = buffer.join(' ');        // naam stond boven het bedrag
        else if (tekst && buffer.length && vorige) vorige.o += ' ' + buffer.slice(0, 2).join(' '); // regels erboven hoorden bij de vorige
        buffer = [];
        vorige = { d: datum, b: bd.b, o: schoon(tekst) };
        tx.push(vorige);
      } else if (r && !RUIS.test(r) && !(heeftDatum && r.length < 3)) {
        // tekst zonder bedrag: vervolg van de vorige transactie of de naam van de volgende
        if (vorige && vorige.o && !vorige.klaar && buffer.length === 0 && r.length < 90) { vorige.o += ' ' + r; vorige.n = (vorige.n || 0) + 1; if (vorige.n >= 2) vorige.klaar = true; }
        else buffer.push(r);
      }
      if (heeftDatum && !bd) { if (vorige) vorige.klaar = true; }
    }
    const bestaand = new Set(P.d.transacties.map((x) => x.k).filter(Boolean)), gezien = new Set(), nieuw = []; let dubbel = 0;
    for (const t of tx) {
      const o = (schoon(t.o || '') || 'Onbekend').slice(0, 80), k = ['pdf', t.d, t.b, o.slice(0, 40).toLowerCase()].join('|');
      if (bestaand.has(k) || gezien.has(k)) { dubbel++; continue; }
      gezien.add(k);
      nieuw.push({ id: P.id(), d: t.d, b: t.b, o, c: P.categoriseer(t.b, o), k });
    }
    return { nieuw, dubbel, overgeslagen, herkend: tx.length };
  };

  P.leesAfschriftPdf = async function (buffer) {
    const regels = await P.pdfRegels(buffer);
    const r = P.parseAfschriftRegels(regels);
    r.regels = regels;
    return r;
  };
})();
