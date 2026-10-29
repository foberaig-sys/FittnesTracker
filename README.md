# GymTracker

Ein bewusst simpler Gym-Tracker (Expo / React Native, SDK 55, Expo Router).

## Funktionen

- **Wochenansicht oben** – Mo–So mit dem geplanten Training pro Tag. Erledigte Tage werden grün.
  Mit den Pfeilen blätterst du in vergangene Wochen. Tippe auf einen Tag, um zu sehen,
  was du dort trainiert hast – inkl. Gewicht und Wiederholungen pro Satz.
- **Wochenplan** – pro Wochentag ein Training (z. B. „Leg Day“) mit Übungen und Satzanzahl.
  Der Plan gilt jede Woche. Vorlagen: Push, Pull, Legs, Oberkörper, Unterkörper, Ganzkörper u. a.
  Pläne lassen sich auf andere Tage kopieren.
- **Heutiges Training in der Mitte** – mit Übungsbildern und „Training starten“.
- **Laufendes Training** – Stoppuhr, Fortschrittsbalken, pro Übung Sätze mit kg & Wdh.
  - Spalte **„Vorher“** zeigt die Werte vom letzten Mal, sie werden als Vorschlag eingetragen
  - **Alltime High** pro Übung, neuer Rekord wird live mit 🏆 markiert (+ Vibration)
  - **Pausentimer** nach jedem Satz (±15 s, merkt sich deine Pausenlänge)
  - Sätze/Übungen hinzufügen, entfernen, umsortieren · Bildschirm bleibt an
- **Zusammenfassung** nach dem Training: Dauer, Volumen, Sätze, neue Rekorde.
- **Übungsbibliothek** – 876 Übungen mit Fotos (Start-/Endposition animiert), Suche auf Deutsch
  und Englisch, Filter nach Muskelgruppe, eigene Übungen anlegen.
- **Übungsdetails** – Rekord, geschätztes 1RM, Fortschrittsdiagramm, Verlauf, Ausführung.
- **Motivation** – Wochen-Serie 🔥, Wochenziel-Ring, Spruch des Tages.

Alle Daten bleiben lokal auf dem Gerät (AsyncStorage). Die Übungsbilder werden aus dem Internet
geladen und danach zwischengespeichert.

Übungsdaten & Bilder: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Public Domain / Unlicense).

## Projektstruktur

```
src/app/            Screens (Expo Router)
  index.tsx         Startseite: Woche, heutiges Training, Statistik, Wochenplan
  workout.tsx       Laufendes Training
  day/[date].tsx    Rückblick auf einen Tag
  plan/[day].tsx    Plan für einen Wochentag bearbeiten
  exercises.tsx     Übungsbibliothek / Auswahl
  exercise/[id].tsx Übungsdetails
  log/[id].tsx      Trainingszusammenfassung
src/components/     UI-Bausteine
src/data/           Übungsdatenbank, deutsche Namen, Vorlagen
src/lib/            Datums- und Statistikfunktionen
src/store/          App-Zustand + Speicherung
```

---

## 1. Testen mit Expo Go

1. **Expo Go** aus dem App Store aufs iPhone laden.
2. Am Computer (Node.js installiert):
   ```bash
   npm install
   npx expo start
   ```
3. QR-Code mit der iPhone-Kamera scannen → App öffnet sich in Expo Go.
   (iPhone und Computer müssen im selben WLAN sein, sonst `npx expo start --tunnel`.)

### Alternativ über Snack (ohne Computer-Setup)

https://snack.expo.dev → links bei „Project“ auf **⋮** → **„Import git repository“** →
`https://github.com/foberaig-sys/FittnesTracker` eintragen → **„Show advanced options“** →
Branch **`snack`** eintragen → importieren → unten SDK **55** wählen → rechts **„My Device“** →
QR-Code mit dem iPhone scannen.

Der Branch `snack` ist eine abgespeckte Kopie von `main` (ohne Bilder, Lockfile und Tooling),
damit der Snack-Import funktioniert. Er wird mit `scripts/make-snack-branch.sh` aus `main` erzeugt.

> Expo Go im App Store unterstützt nur die aktuelle SDK-Version. Verlangt Expo Go eine neuere SDK:
> `npx expo install expo@latest --fix`.

## 2. Auf das eigene iPhone installieren (Apple Developer Program)

Voraussetzungen: Apple-Developer-Account (99 €/Jahr) und ein kostenloser Expo-Account
(https://expo.dev/signup). Ein Mac ist **nicht** nötig – EAS baut in der Cloud.

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # verknüpft das Projekt mit deinem Expo-Account
```

> Die Bundle-ID in `app.json` (`com.foberaig.fittnestracker`) muss weltweit eindeutig sein –
> ggf. vor dem ersten Build anpassen.

### Variante A: Direkt aufs Gerät (Ad-hoc)

```bash
npx eas-cli@latest device:create                         # Link auf dem iPhone öffnen, Profil installieren
npx eas-cli@latest build --platform ios --profile preview
```

EAS fragt nach deinem Apple-Login und erstellt Zertifikat und Provisioning Profile automatisch.
Nach dem Build den Link/QR-Code auf dem iPhone öffnen → installieren. Einmalig
**Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** aktivieren.

### Variante B: TestFlight

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

In App Store Connect unter **TestFlight** dich selbst als Tester eintragen und die App über die
TestFlight-App installieren.

## Entwicklung

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
```
