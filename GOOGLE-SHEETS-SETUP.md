# 📊 Google Sheets Logger Setup - Schritt für Schritt

## 🎯 ZIEL
Jeder Lead wird **automatisch** in dein Google Sheet protokolliert.

---

## 📋 VORBEREITUNG

1. **Google Sheet öffnen**
   - URL: https://docs.google.com/spreadsheets/d/1eBdPK5EKSLEaWScEnnO3W_Qj3UWwlcpxyBgi0p2Obk4/edit
   
2. **Kopiere diese Headers in Zeile 1:**
   ```
   Timestamp | Email | Name | Phone | Country | UTM Source | UTM Campaign | fbclid | Lead Source | Lead Score | Referrer | Browser FP
   ```

---

## 🔧 SCHRITT 1: Apps Script öffnen

1. Oben im Sheet: **Extensions** (oder "Erweiterungen")
2. **Apps Script** klicken
3. Ein neuer Tab öffnet sich

---

## 🔧 SCHRITT 2: Code einfügen

1. Im Apps Script Editor: alles markieren (Ctrl+A)
2. Löschen
3. **Den ganzen Code aus `GOOGLE-SHEETS-SCRIPT.js` kopieren**
4. Hier einfügen
5. Ctrl+S zum speichern

---

## 🔧 SCHRITT 3: Deployen

1. Oben rechts: **Deploy** Button
2. "Select type" → **New Deployment**
3. Typ: **Web app**
4. "Execute as": Dein Google Account
5. "Who has access": **Anyone**
6. **Deploy**
7. Ein Pop-up erscheint mit einer URL

---

## 📌 SCHRITT 4: Deployment URL kopieren

```
Die URL sieht so aus:
https://script.google.com/macros/s/[DEPLOYMENT_ID]/usercripts
```

**DIESE URL GEBEN AN MANUEL!** ✈️

---

## ✅ TEST (Optional)

1. Im Apps Script:
   - Funktion: "testLog" auswählen
   - ▶️ Run Button
   
2. Im Sheet checken:
   - Eine Test-Zeile sollte erscheinen
   - Email: "test@example.com"

---

## 🚀 FERTIG!

Wenn Manuel die URL erhält:
- Setzt er sie in Vercel als `GOOGLE_SHEETS_WEBHOOK` ein
- Jeder neue Lead wird automatisch ins Sheet geschrieben!

---

## 🆘 TROUBLESHOOTING

**"Permission denied" Error?**
- Checken ob Manuel darf in dem Sheet schreiben
- Falls nicht: Share → Everyone (Editor)

**Script läuft nicht?**
- Apps Script: Execution Logs anschauen (oben)
- Logger.log() messages checken

**URL funktioniert nicht?**
- New Deployment erstellen
- Alte Deployment löschen
- Neue URL kopieren

---

## 📞 FRAGEN?

Falls stuck: Screenshot nehmen + fragen!
