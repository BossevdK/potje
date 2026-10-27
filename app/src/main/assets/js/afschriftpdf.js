// PDF-afschriften inlezen. De tekst wordt met pdf.js uit het bestand gehaald, mét de plek op de pagina.
// 1. Rabobank "Rekeningafschrift": vaste kolommen (datum, type, naam, bedrag af, bedrag bij). Welke kolom een bedrag
//    staat, bepaalt of het een uitgave of inkomen is, want er staat geen plus of min bij.
// 2. Andere PDF's: een algemene gok op regels met een datum en een bedrag met plus of min.
// Controleer altijd het voorbeeld voor je importeert.
(function () {
  const P = window.P;

  P.laadScript = function (src) {
    return new Promise((ok, fout) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => fout(new Error('Kon ' + src + ' niet laden'));
      document.head.append(s);
    });
  };

  // Alle tekstdelen per pagina (met plek) en de tekst per regel.
  P.pdfLees = async function (buffer, voortgang) {
    if (!window.pdfjsLib) {
      await P.laadScript('js/lib/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.js';
    }
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const paginas = [], regels = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      if (voortgang && (p === 1 || p % 10 === 0)) voortgang(p, pdf.numPages);
      const tekst = await (await pdf.getPage(p)).getTextContent();
      const items = tekst.items.filter((i) => i.str && i.str.trim()).map((i) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0 }));
      paginas.push(items);
      for (const lijn of groepeer(items)) regels.push(lijn.map((i) => i.s).join(' ').replace(/\s+/g, ' '));
    }
    return { paginas, regels };
  };

  // Tekstdelen op dezelfde hoogte samenvoegen tot regels, van boven naar beneden, links naar rechts.
  function groepeer(items) {
    const lijst = items.slice().sort((a, b) => b.y - a.y || a.x - b.x), uit = [];
    let rij = [], y0 = null;
    for (const it of lijst) {
      if (y0 === null || Math.abs(it.y - y0) > 3) { if (rij.length) uit.push(rij.sort((a, b) => a.x - b.x)); rij = []; y0 = it.y; }
      rij.push(it);
    }
    if (rij.length) uit.push(rij.sort((a, b) => a.x - b.x));
    return uit;
  }

  // Nieuwe transacties maken en dubbele (al in Potje) overslaan. Gelijke transacties op één dag zijn mogelijk
  // (twee keer dezelfde koffie), daarom telt de volgorde binnen het bestand mee in de sleutel.
  function maakNieuw(tx, voorvoegsel) {
    const bestaand = new Set(P.d.transacties.map((x) => x.k).filter(Boolean)), teller = {}, nieuw = []; let dubbel = 0;
    for (const t of tx) {
      const o = (schoon(t.o || '') || 'Onbekend').slice(0, 80), basis = [voorvoegsel, t.d, t.b, o.slice(0, 40).toLowerCase()].join('|');
      teller[basis] = (teller[basis] || 0) + 1;
      const k = basis + '#' + teller[basis];
      if (bestaand.has(k)) { dubbel++; continue; }
      nieuw.push({ id: P.id(), d: t.d, b: t.b, o, c: t.c || P.categoriseer(t.b, o + ' ' + (t.extra || '')), k });
    }
    return { nieuw, dubbel };
  }

  const BEDRAG_TEKST = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
  const naarGetal = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'));

  // ---------- Rabobank Rekeningafschrift ----------
  P.parseRabo = function (paginas) {
    const kopje = paginas.some((p) => p.some((i) => /^Bedrag af/.test(i.s))) && paginas.some((p) => p.some((i) => /^Bedrag bij/.test(i.s)));
    if (!kopje) return null;
    const tx = []; let huidige = null, drempel = null, jaar = null, maandNu = null, overgeslagen = 0;
    const eerste = paginas[0].map((i) => i.s.match(/^(\d{2})-(\d{2})-(\d{4})$/)).find(Boolean);
    if (eerste) { jaar = +eerste[3]; maandNu = +eerste[2]; } // datum waarop het afschrift is gemaakt: laatste mogelijke datum

    for (const items of paginas) {
      const af = items.find((i) => /^Bedrag af/.test(i.s)), bij = items.find((i) => /^Bedrag bij/.test(i.s));
      if (af && bij) drempel = ((af.x + af.w) + (bij.x + bij.w)) / 2; // tussen de rechterkant van beide kolommen
      for (const lijn of groepeer(items)) {
        const k0 = lijn[0], dm = k0.s.match(/^(\d{2})-(\d{2})$/);
        if (dm && k0.x < 60 && drempel !== null) {
          const bedragItem = lijn.slice().reverse().find((i) => i.x >= 425 && BEDRAG_TEKST.test(i.s));
          if (!bedragItem) { overgeslagen++; huidige = null; continue; }
          const type = (lijn.find((i) => i.x >= 60 && i.x < 88) || { s: '' }).s;
          const rest = lijn.filter((i) => i !== k0 && i !== bedragItem && i.x >= 88);
          const iban = rest.filter((i) => i.x < 200).map((i) => i.s).join(' ');
          const naam = rest.filter((i) => i.x >= 198).map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim();
          const uit = bedragItem.x + bedragItem.w < drempel;
          const g = Math.round(naarGetal(bedragItem.s) * 100) / 100;
          huidige = { dd: +dm[1], mm: +dm[2], b: uit ? -g : g, o: naam || iban || 'Onbekend', type, d: null, extra: '' };
          tx.push(huidige);
        } else if (huidige && lijn[0].x >= 198 && /^Verwerkingsdatum/.test(lijn[0].s)) {
          const m = lijn.map((i) => i.s.match(/^(\d{2})-(\d{2})-(\d{4})$/)).find(Boolean);
          if (m && !huidige.verw) huidige.verw = { m: +m[2], j: +m[3] };
        } else if (huidige && !huidige.extra && lijn[0].x >= 198 && lijn.length) {
          huidige.extra = lijn.map((i) => i.s).join(' ').slice(0, 80); // tweede regel (plaats e.d.)
        }
      }
    }

    // Jaar bepalen: uit de verwerkingsdatum van dezelfde transactie, anders het jaar van de vorige.
    let laatsteJaar = jaar;
    for (const t of tx) {
      let j = laatsteJaar;
      if (t.verw) { j = t.verw.j; if (t.mm - t.verw.m > 6) j--; else if (t.verw.m - t.mm > 6) j++; laatsteJaar = j; }
      else if (jaar !== null && maandNu !== null && j === jaar && t.mm > maandNu) j = jaar - 1;
      t.d = j + '-' + String(t.mm).padStart(2, '0') + '-' + String(t.dd).padStart(2, '0');
      if (t.type === 'tb') t.c = 'Sparen & beleggen'; // overboeking tussen eigen rekeningen en potjes
    }
    const r = maakNieuw(tx, 'rabo');
    r.tx = tx; r.herkend = tx.length; r.overgeslagen = overgeslagen; r.formaat = 'Rabobank-afschrift';
    r.som = { af: tx.filter((t) => t.b < 0).reduce((s, t) => s - t.b, 0), bij: tx.filter((t) => t.b > 0).reduce((s, t) => s + t.b, 0) };
    // Controle: de totalen bovenaan het afschrift ("Totaal afgeschreven", "Totaal bijgeschreven") moeten kloppen.
    const kop = groepeer(paginas[0]), n = kop.findIndex((l) => l.some((i) => /^Totaal afgeschreven/.test(i.s)));
    if (n >= 0 && kop[n + 1]) {
      const bed = kop[n + 1].filter((i) => BEDRAG_TEKST.test(i.s)).map((i) => naarGetal(i.s));
      if (bed.length >= 2) r.totalen = { af: bed[0], bij: bed[1], klopt: Math.abs(bed[0] - r.som.af) < 0.01 && Math.abs(bed[1] - r.som.bij) < 0.01 };
    }
    return r;
  };

  // ---------- Algemene PDF: regels met een datum en een bedrag met plus of min ----------
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
    const r = maakNieuw(tx, 'pdf');
    r.herkend = tx.length; r.overgeslagen = overgeslagen; r.formaat = 'Algemene PDF';
    return r;
  };

  P.leesAfschriftPdf = async function (buffer, voortgang) {
    const { paginas, regels } = await P.pdfLees(buffer, voortgang);
    const r = P.parseRabo(paginas) || P.parseAfschriftRegels(regels);
    r.regels = regels;
    return r;
  };
})();
