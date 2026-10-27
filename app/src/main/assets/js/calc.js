// Rekenwerk. Rente en rendement zijn jaarpercentages; er wordt per maand samengesteld.
(function () {
  const P = window.P;
  const maandFactor = (jaarPct) => Math.pow(1 + jaarPct / 100, 1 / 12);

  // Saldo per maand (index 0 = nu). Stopt met inleggen zodra 'plafond' is bereikt (spaardoel).
  P.reeks = function (start, perMaand, jaarPct, maanden, plafond) {
    const g = maandFactor(jaarPct), uit = [start];
    let s = start;
    for (let i = 1; i <= maanden; i++) {
      s = s * g + (plafond && s >= plafond ? 0 : perMaand);
      uit.push(s);
    }
    return uit;
  };
  // Hoeveel maanden tot een doelbedrag; Infinity als het nooit lukt.
  P.maandenTotDoel = function (huidig, doel, perMaand, jaarPct) {
    if (huidig >= doel) return 0;
    const g = maandFactor(jaarPct);
    let s = huidig;
    for (let i = 1; i <= 1200; i++) {
      s = s * g + perMaand;
      if (s >= doel) return i;
    }
    return Infinity;
  };
  // Maandbedrag dat nodig is om in 'maanden' maanden op 'doel' uit te komen.
  P.nodigPerMaand = function (huidig, doel, maanden, jaarPct) {
    if (maanden <= 0) return Math.max(0, doel - huidig);
    const g = maandFactor(jaarPct), rest = doel - huidig * Math.pow(g, maanden);
    if (rest <= 0) return 0;
    return Math.abs(g - 1) < 1e-9 ? rest / maanden : rest * (g - 1) / (Math.pow(g, maanden) - 1);
  };
  // Schuld aflossen met vast bedrag per maand.
  P.afbetaling = function (schuld, jaarRente, perMaand) {
    const r = jaarRente / 100 / 12;
    if (perMaand <= schuld * r) return { maanden: Infinity, rente: Infinity };
    let s = schuld, m = 0, rente = 0;
    while (s > 0.005 && m < 1200) {
      const ren = s * r; rente += ren; s = s + ren - perMaand; m++;
      if (s < 0) { rente += s; s = 0; }
    }
    return { maanden: m, rente };
  };
  P.inflatie = (bedrag, pct, jaren) => bedrag / Math.pow(1 + pct / 100, jaren);

  // Verwachte ontwikkeling van spaargeld + beleggingen. Geeft totaal, inleg (zonder groei) en delen.
  P.prognose = function (jaren) {
    const n = jaren * 12, st = P.set();
    const spaar = new Array(n + 1).fill(0), spaarInleg = new Array(n + 1).fill(0);
    for (const doel of P.d.doelen) {
      const s = P.gespaard(doel), m = doel.maandinleg || 0, plafond = doel.doel || 0;
      const a = P.reeks(s, m, P.doelRente(doel), n, plafond), b = P.reeks(s, m, 0, n, plafond);
      for (let i = 0; i <= n; i++) { spaar[i] += a[i]; spaarInleg[i] += b[i]; }
    }
    const bel = new Array(n + 1).fill(0), belInleg = new Array(n + 1).fill(0);
    for (const x of P.d.beleggingen) {
      const a = P.reeks(x.waarde || 0, x.maandinleg || 0, st.rendement, n), b = P.reeks(x.waarde || 0, x.maandinleg || 0, 0, n);
      for (let i = 0; i <= n; i++) { bel[i] += a[i]; belInleg[i] += b[i]; }
    }
    const totaal = spaar.map((v, i) => v + bel[i]);
    const inleg = spaarInleg.map((v, i) => v + belInleg[i]);
    return { n, totaal, inleg, spaar, bel };
  };
  P.maandInleg = () => P.d.doelen.reduce((s, x) => s + (x.maandinleg || 0), 0) + P.d.beleggingen.reduce((s, x) => s + (x.maandinleg || 0), 0);

  // Uitgaven
  P.NIET_UITGAVE = ['Inkomen', 'Sparen & beleggen'];
  P.maandOverzicht = function (k) {
    const t = P.d.transacties.filter((x) => P.mnd(x.d) === k);
    let inkomen = 0, uit = 0, gespaard = 0;
    const perCat = {};
    for (const x of t) {
      if (x.c === 'Inkomen') inkomen += x.b;
      else if (x.c === 'Sparen & beleggen') gespaard += -x.b;
      else { uit += -x.b; perCat[x.c] = (perCat[x.c] || 0) + -x.b; }
    }
    return { t, inkomen, uit, gespaard, perCat };
  };
  P.gemUitgaven = function () {
    const per = {};
    for (const x of P.d.transacties) if (!P.NIET_UITGAVE.includes(x.c) && x.b < 0) per[P.mnd(x.d)] = (per[P.mnd(x.d)] || 0) - x.b;
    const keys = Object.keys(per).sort().slice(-6), nu = P.huidigeMaand();
    const volle = keys.filter((k) => k !== nu);
    const gebruik = volle.length ? volle : keys;
    return gebruik.length ? gebruik.reduce((s, k) => s + per[k], 0) / gebruik.length : 0;
  };
})();
