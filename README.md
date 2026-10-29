# FittnesTracker

Einfache Fitness-App (Expo / React Native, SDK 58) zum Protokollieren von Trainings.

- **Heute** – Übung, Sätze, Wiederholungen und Gewicht (bzw. km bei „Laufen“) eintragen
- **Verlauf** – alle Trainings nach Tagen gruppiert (lange drücken = löschen)
- **Statistik** – Serie, Trainingstage, Volumen, gelaufene km, häufigste Übungen

Daten werden lokal auf dem Gerät gespeichert (AsyncStorage).

---

## 1. Testen mit Snack + Expo Go (ohne Mac, ohne Account-Kosten)

1. **Expo Go** aus dem App Store aufs iPhone laden.
2. https://snack.expo.dev öffnen → links oben **„Import git repository“** →
   `https://github.com/foberaig-sys/fittnestracker` eintragen
   *(Alternative: Inhalt von `App.js` in einen neuen Snack kopieren.)*
3. In Snack die SDK-Version auf **58** stellen (unten rechts). Falls Snack
   `@react-native-async-storage/async-storage` und
   `react-native-safe-area-context` nicht automatisch erkennt, auf
   „Add dependency“ klicken.
4. Rechts **„My Device“** wählen und den QR-Code mit der iPhone-Kamera scannen
   → App öffnet sich in Expo Go.

> Expo Go im App Store unterstützt immer nur die aktuelle SDK-Version. Wenn
> Expo Go eine neuere SDK verlangt, das Projekt mit `npx expo install expo@latest --fix`
> aktualisieren.

### Alternativ lokal (Computer + iPhone im selben WLAN)

```bash
npm install
npx expo start        # QR-Code mit der iPhone-Kamera scannen
```

## 2. Auf das eigene iPhone installieren (Apple Developer Program)

Voraussetzungen: kostenpflichtiger Apple-Developer-Account (99 €/Jahr) und ein
kostenloser Expo-Account (https://expo.dev/signup). Ein Mac ist **nicht** nötig –
EAS baut in der Cloud.

```bash
npm install -g eas-cli
eas login
eas init                       # verknüpft das Projekt mit deinem Expo-Account
```

> Die Bundle-ID in `app.json` (`com.foberaig.fittnestracker`) muss weltweit
> eindeutig sein – ggf. anpassen, bevor du das erste Mal baust.

### Variante A: Direkt aufs Gerät (Ad-hoc / „internal distribution“)

```bash
eas device:create              # Link auf dem iPhone öffnen, Profil installieren
eas build --platform ios --profile preview
```

EAS fragt nach deinem Apple-Login und erstellt Zertifikat + Provisioning
Profile automatisch. Nach dem Build einen QR-Code/Link auf dem iPhone öffnen →
App installieren. Ab iOS 16 einmalig **Einstellungen → Datenschutz & Sicherheit
→ Entwicklermodus** aktivieren.

### Variante B: Über TestFlight

```bash
eas build --platform ios --profile production
eas submit --platform ios      # lädt den Build zu App Store Connect hoch
```

Danach in App Store Connect unter **TestFlight** dich selbst als Tester
hinzufügen und die App über die TestFlight-App installieren.

## Build-Profile (`eas.json`)

| Profil        | Zweck                                                        |
|---------------|--------------------------------------------------------------|
| `development` | Development Build (nötig, sobald native Module außerhalb von Expo Go verwendet werden) |
| `preview`     | Ad-hoc-Build für registrierte Geräte                         |
| `production`  | App-Store- / TestFlight-Build                                 |
