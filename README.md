# GymTracker

Ein bewusst simpler Gym-Tracker (Expo / React Native, SDK 55).

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

## Aufbau

Die komplette App steckt in **einer Datei: `App.js`**. So kann sie direkt in Snack eingefügt werden.
Die Übungsdatenbank (876 Übungen) lädt die App beim ersten Start aus dem Internet und speichert sie
danach auf dem Gerät.

---

## 1. Testen mit Snack + Expo Go

1. **Expo Go** aus dem App Store aufs iPhone laden.
2. https://snack.expo.dev öffnen, unten SDK **55** einstellen.
3. Den kompletten Inhalt von [`App.js`](App.js) kopieren (auf GitHub: Datei öffnen → „Copy raw file“)
   und den Inhalt der `App.js` im Snack damit ersetzen.
4. Fragt Snack nach fehlenden Paketen („Add dependency“), jeweils hinzufügen.
5. Rechts **„My Device“** → QR-Code mit der iPhone-Kamera scannen.

### Alternativ lokal

```bash
npm install
npx expo start        # QR-Code mit der iPhone-Kamera scannen
```

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
```
