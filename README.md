# Potje

Android-app die leert sparen, beleggen en omgaan met geld, en bijhoudt wat je spaart en uitgeeft. Kotlin-schil met een web-interface (`app/src/main/assets`). Alle gegevens blijven op de telefoon.

- **Sparen**: doelen met voortgang, maandbedrag en einddatum, prognose met rente.
- **Uitgaven**: budget per categorie, CSV-import van Rabobank (en een gok voor andere banken).
- **Beleggen**: handmatig bijhouden, spreiding, verwachting.
- **Leren**: lessen (beginner tot gevorderd), trucs tegen overbesteden, rekenhulpen, dagelijkse tip.
- **Updates**: Instellingen > Zoek naar updates. Elke GitHub-release heeft `Potje.apk` en `version.json`. Zie `Updater.kt`.
- **Crashpagina**: eigen proces (`CrashActivity.kt`) met ook een knop om naar updates te zoeken.

## Bouwen

```
gradle assembleRelease
```

Je hebt JDK 17, de Android SDK (platform 34) en `local.properties` met `sdk.dir` nodig. De ondertekeningssleutel staat in `keystore/` (niet in git). Bewaar een kopie: zonder dezelfde sleutel past een update niet over de app heen.

## Publiceren

```
.\publiceer.ps1 "Wat er nieuw is"
```
