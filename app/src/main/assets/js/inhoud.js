// Leerstof: lessen, trucs en tips. Algemene uitleg, geen persoonlijk beleggings- of belastingadvies.
(function () {
  const P = window.P;

  P.lessen = [
    {
      id: 'betaal-eerst', titel: 'Betaal jezelf eerst', duur: 3,
      basis: [
        'Wie spaart met wat er aan het einde van de maand overblijft, houdt meestal niets over. Draai het om: zet op de dag dat je salaris binnenkomt direct een vast bedrag opzij, en leef van de rest.',
        'Begin klein. Een bedrag dat je niet voelt, houd je jaren vol. Verhoog het elke keer dat je salaris stijgt, dan merk je het nauwelijks.',
        'Zet de overboeking automatisch in je bank-app. Wat je niet elke maand opnieuw hoeft te beslissen, gebeurt gewoon.',
      ],
      gevorderd: [
        'Dit werkt door gedrag, niet door wiskunde: je verlaagt het aantal beslismomenten. Onderzoek naar standaardkeuzes (opt-out bij pensioenen) laat zien dat mensen veel meer sparen als sparen de standaard is.',
        'Een vuistregel is 10 tot 20 procent van je netto inkomen, maar het juiste percentage hangt af van je vaste lasten en doelen. Het gaat er eerst om dat de gewoonte staat.',
      ],
      actie: 'Maak in je bank-app een automatische overboeking naar je spaarrekening, op de dag na je salaris.',
    },
    {
      id: 'overzicht', titel: 'Weten waar je geld heen gaat', duur: 4,
      basis: [
        'Je kunt alleen sturen op wat je ziet. Kijk één keer naar drie maanden aan afschriften en deel alles in: vaste lasten (huur, energie, verzekeringen), boodschappen en al het andere.',
        'Een bekend startpunt is de 50/30/20-regel: ongeveer de helft van je netto inkomen voor vaste lasten, 30 procent voor leuke dingen en 20 procent voor sparen of aflossen. Het is een richtlijn, geen wet. In een dure huurwoning kom je er niet uit, en dat is oké.',
        'Importeer je afschriften in Potje en stel per categorie een budget in. Kijk je maandoverzicht één keer per week, niet elke dag.',
      ],
      gevorderd: [
        'Let vooral op de vaste lasten. Die bepalen het grootste deel van je uitgaven en je kunt ze maar een paar keer per jaar aanpassen: overstappen van energie, verzekering of abonnement levert elke maand een voordeel op.',
        'Bekijk je netto besteedbaar inkomen na vaste lasten. Dat vrije bedrag is wat je werkelijk kunt verdelen tussen sparen, beleggen en genieten.',
      ],
      actie: 'Importeer je laatste afschrift via Uitgaven en kijk welke categorie groter is dan je had gedacht.',
    },
    {
      id: 'noodfonds', titel: 'Je noodfonds', duur: 3,
      basis: [
        'Een noodfonds is geld voor tegenvallers: een kapotte wasmachine, een autoreparatie, een tijdelijke inkomensdip. Het houdt je uit de schulden en uit de beleggingen die je op het verkeerde moment zou moeten verkopen.',
        'Een gebruikelijke richtlijn is drie tot zes maanden aan vaste uitgaven. Begin met één maand en bouw op.',
        'Zet het op een spaarrekening waar je direct bij kunt, maar niet op je betaalrekening. Als het te makkelijk beschikbaar is, is het ook te makkelijk weg.',
      ],
      gevorderd: [
        'Hoeveel buffer je nodig hebt hangt af van je risico: vast contract of zzp, kostwinner of dubbel inkomen, huurder of huiseigenaar. Zzp-ers houden vaak zes maanden of meer aan.',
        'Het noodfonds komt vóór beleggen. Beleggen zonder buffer betekent dat je bij tegenslag verkoopt, mogelijk met verlies.',
      ],
      actie: 'Maak in Sparen een doel Noodfonds en vul het bedrag in met de rekenhulp Noodfonds.',
    },
    {
      id: 'sparen-rente', titel: 'Slim sparen: rente en veiligheid', duur: 4,
      basis: [
        'Op een spaarrekening krijg je rente. De hoogte verschilt per bank en verandert met de markt. Vergelijk af en toe: een paar tienden procent verschil maakt bij grotere bedragen elk jaar een verschil.',
        'In Nederland valt spaargeld bij een Nederlandse bank onder het depositogarantiestelsel: tot 100.000 euro per persoon per bank krijg je terug als de bank omvalt.',
        'Let op de voorwaarden: een hoge actierente is soms maar tijdelijk, of geldt alleen tot een bepaald bedrag.',
      ],
      gevorderd: [
        'Rente die lager is dan de inflatie betekent dat je spaargeld koopkracht verliest, ook al groeit het saldo. Kijk daarom naar de rente min inflatie: de reële rente.',
        'Buitenlandse banken vallen onder het garantiestelsel van hun eigen land. De hoogte van de garantie is binnen Europa gelijk, de afhandeling kan langer duren.',
      ],
      actie: 'Controleer de rente van je spaarrekening en vergelijk die met twee andere banken.',
    },
    {
      id: 'doelen', titel: 'Sparen voor een doel', duur: 3,
      basis: [
        'Sparen gaat makkelijker als je weet waarvoor. Geef elk doel een naam, een bedrag en een datum: een vakantie van 1.800 euro over 12 maanden is 150 euro per maand.',
        'Meerdere doelen tegelijk kan, maar begin met het noodfonds. Verdeel daarna je maandbedrag over doelen in volgorde van belang.',
        'Potje rekent uit hoeveel je per maand nodig hebt en wanneer je je doel haalt. Pas het bedrag aan als je ziet dat je achterloopt.',
      ],
      gevorderd: [
        'Lange doelen (meer dan vijf jaar) kunnen deels in beleggingen, korte doelen horen op een spaarrekening. Het geld voor iets dat je volgend jaar nodig hebt, wil je niet kwijt kunnen raken in een slechte beursperiode.',
      ],
      actie: 'Maak in Sparen één doel met een einddatum en kijk wat het per maand kost.',
    },
    {
      id: 'impuls', titel: 'Impulsaankopen herkennen', duur: 4,
      basis: [
        'Winkels, apps en reclames zijn gebouwd om je op het verkeerde moment te laten kopen: tijdelijke aanbieding, bijna uitverkocht, gratis verzending boven een bedrag, één klik betalen.',
        'Je merkt het aan een gevoel van haast of van beloning. Wie moe, verveeld of boos is, geeft meer uit.',
        'Zet er afstand tussen: de 24-uursregel, geen opgeslagen betaalgegevens, afmelden voor nieuwsbrieven. Bij de meeste aankopen is de zin na een nacht verdwenen.',
      ],
      gevorderd: [
        'Schaarste en sociale bewijskracht zijn de standaardtrucs: "nog 2 op voorraad", "37 mensen bekijken dit nu". Zulke meldingen zijn vaak automatisch en zeggen weinig over de werkelijke voorraad.',
        'Reken een aankoop om naar werkuren: wat je voor een uur werk netto verdient, afgezet tegen de prijs. De rekenhulp Werkuren doet dat voor je.',
      ],
      actie: 'Verwijder opgeslagen creditcard- of iDEAL-gegevens uit je meest gebruikte webshop.',
    },
    {
      id: 'schulden', titel: 'Schulden en wat lenen kost', duur: 4,
      basis: [
        'Lenen kost rente, en rente werkt tegen je zoals hij voor je werkt bij sparen. Een creditcard- of roodstand met 10 tot 15 procent rente groeit sneller dan je spaargeld.',
        'Los dure schulden eerst af, ook voordat je gaat beleggen: een schuld van 12 procent aflossen is een zekere opbrengst van 12 procent.',
        'Betaal altijd minstens de rente en liefst een vast bedrag extra. De rekenhulp Schuld aflossen laat zien hoeveel maanden en hoeveel rente dat scheelt.',
      ],
      gevorderd: [
        'Twee methoden: sneeuwbal (kleinste schuld eerst, goed voor je motivatie) en lawine (hoogste rente eerst, goedkoopste in totaal). Kies wat je volhoudt.',
        'Krijg je betalingsproblemen, ga dan niet wachten. Gemeenten en instanties zoals Geldfit.nl helpen gratis; hoe eerder, hoe meer er te redden valt.',
      ],
      actie: 'Schrijf al je schulden op met bedrag en rente, en rangschik ze op rente.',
    },
    {
      id: 'beleggen-basis', titel: 'Beleggen: wat is het?', duur: 5,
      basis: [
        'Bij beleggen koop je een deel van iets dat waarde kan krijgen: een bedrijf (aandeel), een lening (obligatie) of een mandje daarvan (fonds). Je hoopt op rendement, maar je kunt ook verlies lijden.',
        'Hoger verwacht rendement hoort bij hoger risico. Over lange tijd hebben aandelen meer opgebracht dan sparen, maar in een gewoon jaar kan de waarde fors dalen.',
        'Beleg alleen geld dat je minstens vijf jaar, liefst langer, niet nodig hebt. Gebruik nooit geleend geld en nooit het geld van je noodfonds.',
      ],
      gevorderd: [
        'Rendement is niet gegarandeerd en uit het verleden volgt niets voor de toekomst. Reken in Potje daarom met een voorzichtige aanname, en kijk naar de bandbreedte in plaats van één getal.',
        'Je hebt in Nederland als particulier een brokerrekening nodig of een beleggingsrekening bij een bank. Let op kosten, wat je kunt kopen en of de aanbieder is geregistreerd bij de AFM.',
      ],
      actie: 'Schrijf op hoeveel geld je minstens vijf jaar kunt missen. Begin pas met beleggen als je noodfonds klaar is.',
    },
    {
      id: 'beleggen-spreiding', titel: 'Beleggen: spreiding en kosten', duur: 5,
      basis: [
        'Spreiding betekent: niet alles op één paard. Een breed wereldfonds bezit honderden of duizenden bedrijven in veel landen. Als er één omvalt, merk je dat nauwelijks.',
        'Kosten tellen zwaar, want ze komen elk jaar terug. 1 procent kosten per jaar klinkt weinig, maar over dertig jaar eet het een groot deel van je rendement op.',
        'Veel mensen kiezen voor een indexfonds of ETF: goedkoop, breed en zonder dat je zelf aandelen hoeft te kiezen. Bij maandelijks inleggen koop je steeds een beetje, op wisselende koersen.',
      ],
      gevorderd: [
        'Kijk naar de lopende kosten (TER), de aankoopkosten en het verschil tussen bied- en laatkoers. Een goedkoop fonds heeft lopende kosten van enkele tienden van een procent.',
        'Maandelijks inleggen heet gespreid instappen. Het voorkomt dat je één slecht moment kiest. Op de lange termijn doet het niet per se beter dan in één keer inleggen, maar het is wel gemakkelijker vol te houden.',
        'Herbalanceren: als een deel sterk is gestegen, kun je periodiek terugschakelen naar je gekozen verdeling. Dat is een keuze, geen plicht.',
      ],
      actie: 'Zoek bij elke belegging in Potje de jaarlijkse kosten op en zet ze in je notitie.',
    },
    {
      id: 'rente-op-rente', titel: 'Rente op rente en tijd', duur: 3,
      basis: [
        'Rente op rente betekent dat je rente ook weer rente oplevert. In het begin merk je er weinig van, later gaat het hard.',
        'Voorbeeld: 200 euro per maand, 30 jaar, gemiddeld 5 procent per jaar. Je legt zelf 72.000 euro in en hebt dan ruim 160.000 euro. Meer dan de helft is rendement.',
        'Beginnen telt zwaarder dan hoeveel je begint. Tien jaar eerder starten met een klein bedrag levert vaak meer op dan later veel inleggen.',
      ],
      gevorderd: [
        'Het effect komt van de exponentiële formule: eindbedrag = inleg × (1 + r)^tijd. Een kleine stijging in r of in de looptijd heeft een grote invloed op het eind.',
        'De regel van 72: deel 72 door het rendement in procenten om te zien na hoeveel jaar je geld verdubbelt. Bij 6 procent is dat 12 jaar.',
      ],
      actie: 'Gebruik de rekenhulp Sparen en beleggen met rente met jouw maandbedrag, en kijk wat 10, 20 en 30 jaar doet.',
    },
    {
      id: 'inflatie', titel: 'Inflatie: waarom stilstaan achteruitgaan is', duur: 3,
      basis: [
        'Inflatie betekent dat dingen langzaam duurder worden. Met 2 procent inflatie kost wat nu 100 euro is, over tien jaar ongeveer 122 euro.',
        'Je spaargeld verliest dus koopkracht als de rente lager is dan de inflatie. Geld op je betaalrekening groeit helemaal niet mee.',
        'Dat is geen reden om te beleggen met je noodfonds, maar wel om je geld niet jaren te laten liggen op een rekening zonder rente.',
      ],
      gevorderd: [
        'Reële rente = nominale rente min inflatie. Is de reële rente negatief, dan krimpt je koopkracht, ook al staat er elk jaar meer op je rekening.',
        'Potje toont daarom bij de verwachting ook wat het bedrag in euro\'s van vandaag waard is.',
      ],
      actie: 'Vul in Instellingen een inflatie in die jij redelijk vindt en bekijk het effect op je verwachting.',
    },
    {
      id: 'belasting', titel: 'Belasting over je vermogen', duur: 4,
      basis: [
        'In Nederland betaal je belasting over je spaargeld en beleggingen in box 3. Je betaalt over een verondersteld rendement, niet over wat je werkelijk hebt verdiend.',
        'Een deel van je vermogen is vrijgesteld (heffingvrij vermogen). Het bedrag en de percentages worden vaak aangepast. Kijk daarom bij de Belastingdienst naar de actuele regels.',
        'Je geeft je bezittingen op in je aangifte. Houd daarom je saldo op 1 januari bij: dat is het peilmoment.',
      ],
      gevorderd: [
        'De regels voor box 3 zijn de afgelopen jaren veranderd en kunnen weer veranderen, mede door rechtszaken. Reken daarom in Potje niet met belastingen, maar houd er rekening mee dat je opbrengst netto lager kan zijn.',
        'Heb je vragen over je eigen situatie, vraag dan de Belastingdienst of een belastingadviseur. Potje geeft geen belastingadvies.',
      ],
      actie: 'Noteer je saldo van elke spaar- en beleggingsrekening op 1 januari, voor je aangifte.',
    },
    {
      id: 'pensioen', titel: 'Pensioen en je toekomst', duur: 4,
      basis: [
        'Via je werk bouw je meestal pensioen op naast de AOW. Op mijnpensioenoverzicht.nl zie je wat je tot nu toe hebt opgebouwd en wat je ongeveer later krijgt.',
        'Vaak is er een gat tussen wat je nu uitgeeft en wat je later binnenkrijgt. Zzp-ers en mensen met wisselende contracten hebben meestal minder opgebouwd.',
        'Dat je pensioen via werk loopt, betekent niet dat het vanzelf genoeg is. Kijk een keer per jaar naar je overzicht, zeker bij een nieuwe baan.',
      ],
      gevorderd: [
        'Aanvullend kun je zelf sparen of beleggen voor later. Lijfrentes en banksparen kunnen fiscaal voordeel geven, maar het geld zit vast tot je pensioen. Lees de voorwaarden goed.',
        'Het pensioenstelsel verandert. Controleer dus ook of je werkgever of fonds al is overgestapt en wat dat voor jouw opbouw betekent.',
      ],
      actie: 'Log in op mijnpensioenoverzicht.nl en schrijf je verwachte maandbedrag op.',
    },
  ];

  P.trucs = [
    { id: '24u', titel: 'De 24-uursregel', t: 'Zie je iets wat je wilt kopen en dat niet nodig is? Wacht een dag. Bij de meeste dingen is de zin dan weg.' },
    { id: '30d', titel: 'Wensenlijst van 30 dagen', t: 'Zet grote wensen op een lijst met de datum erbij. Wat na dertig dagen nog steeds telt, mag je kopen.' },
    { id: 'werkuren', titel: 'Reken in werkuren', t: 'Deel de prijs door je netto uurloon. Een jas van 120 euro is bij 15 euro per uur acht uur werken. Vaak al genoeg om te stoppen.' },
    { id: 'automaat', titel: 'Automatisch sparen', t: 'Laat de bank de dag na je salaris een vast bedrag naar je spaarrekening boeken, voordat je het kunt uitgeven.' },
    { id: 'vast', titel: 'Aparte rekening voor vaste lasten', t: 'Laat elke maand een vast bedrag naar een aparte rekening gaan waarvan alleen huur, energie en verzekeringen worden betaald.' },
    { id: 'abonnement', titel: 'Abonnementen opschonen', t: 'Loop je afschrift na op terugkerende bedragen. Zeg alles op wat je de afgelopen maand niet hebt gebruikt. Je kunt altijd opnieuw beginnen.' },
    { id: 'kaart', titel: 'Geen opgeslagen kaartgegevens', t: 'Haal betaalgegevens weg bij webshops. Elke extra stap is een moment om na te denken.' },
    { id: 'lijst', titel: 'Boodschappen met lijst, niet hongerig', t: 'Maak een lijst, eet vooraf en pak alleen wat erop staat. Wie met honger winkelt, geeft aanzienlijk meer uit.' },
    { id: 'weekbudget', titel: 'Een weekbudget voor kleine uitgaven', t: 'Bepaal een bedrag voor koffie, snacks en kleine dingen en houd dat in de gaten. Als het op is, is het op.' },
    { id: 'nospend', titel: 'Geld-vrije dagen', t: 'Kies een of twee dagen per week waarop je niets uitgeeft behalve vaste lasten. Een spel met jezelf, geen straf.' },
    { id: 'reclame', titel: 'Reclame uitzetten', t: 'Schrijf je uit voor nieuwsbrieven met aanbiedingen en zet meldingen van webshops uit. Wat je niet ziet, wil je niet.' },
    { id: 'merkloos', titel: 'Huismerk en vergelijken', t: 'Pak bij vaste producten het huismerk. Vergelijk bij grote aankopen en kijk naar de prijs per stuk of per kilo.' },
    { id: 'afronden', titel: 'Afronden naar boven', t: 'Rond elke uitgave in gedachten af naar een rond bedrag en spaar het verschil. Of laat de bank het automatisch doen.' },
  ];

  P.tips = [
    'Je grootste besparing zit zelden in koffie. Kijk eerst naar huur, energie, verzekeringen en vervoer.',
    'Een extra bedrag van 25 euro per maand is over twintig jaar, bij 5 procent, ruim 10.000 euro.',
    'Zet je spaarrekening bij een andere bank dan je betaalrekening. Dan is het net wat lastiger om er snel bij te kunnen.',
    'Betaal bij voorkeur met je pinpas of iDEAL. Een creditcard verleidt tot uitgeven en rente over een saldo is duur.',
    'Check één keer per jaar je energiecontract, zorgverzekering en inboedelverzekering. Overstappen kost je een kwartier.',
    'Koop grote dingen niet op de dag dat je ze ziet. Wacht tot de volgende dag en vergelijk drie winkels.',
    'Een ongebruikt abonnement van 10 euro per maand kost 120 euro per jaar. Zeg het op en gebruik de rest voor je doel.',
    'Je noodfonds is geen spaarpot voor leuke dingen. Geef het een eigen naam en een eigen rekening.',
    'Zonder doel verdampt je spaarbedrag. Geef elk potje een naam en een datum.',
    'Heb je een schuld met hoge rente? Dat aflossen is meestal beter dan sparen op 2 procent.',
    'Rente op rente werkt het sterkst in de laatste jaren. Haal geld niet weg als het begint te lopen.',
    'Als je salaris stijgt, stijgt je levensstijl vanzelf mee. Boek de helft van de verhoging door naar sparen voordat je eraan went.',
    'Bij beleggen zijn kosten het enige dat je zeker kunt beïnvloeden. Kies goedkoop en breed.',
    'Beleg nooit geld dat je binnen vijf jaar nodig hebt. Beurzen kunnen jaren dalen.',
    'Elke dag 5 euro minder uitgeven is bijna 1.800 euro per jaar.',
    'Reken een aankoop om naar uren werk. Dat maakt de prijs zichtbaar.',
    'Een prijs die lijkt op een aanbieding is niet altijd goedkoper. Controleer de prijs van vorige maand.',
    'Gratis verzending boven een bedrag is een trucje om je meer te laten kopen. Betaal liever de verzendkosten.',
    'Vier het als je een spaardoel haalt. Dat houdt je motivatie vast voor het volgende doel.',
    'Maak een lijstje van dingen die je echt blij maken en bekijk hoeveel je daaraan uitgeeft. Meestal minder dan je denkt.',
    'Doe een keer per jaar een financiële schoonmaak: abonnementen, verzekeringen, bankrekeningen die je niet gebruikt.',
    'Check bij elke vaste lasten of je de dure optie hebt genomen. Veel mensen betalen voor dekking die ze niet nodig hebben.',
    'Eten buiten de deur kost vaak een veelvoud van zelf koken. Eén keer per week minder maakt snel verschil.',
    'Contant geld voelt zwaarder dan pinnen. Gebruik het voor een weekbudget als je wilt afremmen.',
    'Het depositogarantiestelsel dekt tot 100.000 euro per persoon per bank. Heb je meer, verdeel het dan over banken.',
    'Je hoeft niet alles te weten om te beginnen. Begin met een klein bedrag en leer onderweg.',
    'Rente op een spaarrekening is belast als vermogen, niet als inkomen. Kijk bij de Belastingdienst naar de actuele regels.',
    'Beleggen met maandelijkse inleg haalt de druk van het goede moment kiezen. Je koopt gewoon elke maand.',
    'Een dalende beurs is lastig, maar wie doorgaat met maandelijks inleggen koopt goedkoper in.',
    'Vertel iemand over je spaardoel. Het maakt het makkelijker vol te houden.',
    'Maak je aflossing van een schuld eerst automatisch. Wat er overblijft is voor jezelf.',
    'Spreid grote uitgaven: zet elke maand een bedrag opzij voor jaarlijkse kosten zoals verzekeringen en onderhoud.',
    'Als iets echt belangrijk is, kun je het ook over drie dagen nog kopen.',
  ];

  P.tipVanDeDag = () => P.tips[P.dagVanJaar() % P.tips.length];

  P.CATEGORIEEN = ['Boodschappen', 'Eten & drinken', 'Wonen', 'Vervoer', 'Abonnementen', 'Verzekering & zorg', 'Vrije tijd', 'Winkelen', 'Overig'];
  P.ALLE_CATEGORIEEN = P.CATEGORIEEN.concat(['Sparen & beleggen', 'Inkomen']);
  P.BELEGGINGSSOORTEN = ['Indexfonds / ETF', 'Aandelen', 'Obligaties', 'Crypto', 'Pensioen / lijfrente', 'Overig'];
})();
