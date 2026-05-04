# 🚀 Meilenkurs 2.0 - Registrierungs-Formular

**Production-Ready Multi-Step Registration Form** mit Hell + Orange Design, integiert mit:
- ✅ **Webinargeek** (Auto-Registrierung)
- ✅ **ActiveCampaign** (CRM & Lead-Tagging)
- ✅ **Clicksend** (SMS-Versand)

---

## 📋 Was ist enthalten?

### Frontend
- 3-Step Registration Form (Email → Termin → Personal Daten)
- Hell + Orange Design (responsive)
- Real-time Validation
- Success Screen mit Countdown-Timer
- Animation & Micro-Interactions

### Backend
- Node.js/Express API
- API-Integration zu Webinargeek, ActiveCampaign, Clicksend
- Error Handling & Logging
- CORS für sichere Cross-Origin Requests

---

## ⚙️ Lokal starten (für Tests)

### 1. Repository clonen / Files downloaden
```bash
cd meilenkurs-2-0
npm install
```

### 2. .env Datei erstellen
Kopiere `.env.example` → `.env` und fülle folgende Werte ein:

```env
# WEBINARGEEK (hast du bereits)
WEBINARGEEK_API_KEY=Y5T53-rLBE07pXyhzjTdWx9CwlDu1ncCpjNnliY9lPLUKFFw5LwIvhaBjmoZv0QJF9R6Er45hI41FmB_54rpRQ
WEBINARGEEK_WEBINAR_ID=365390
WEBINARGEEK_EPISODE_ID=390073

# ACTIVECAMPAIGN (hast du bereits)
AC_API_URL=https://lunaswayfare.api-us1.com
AC_API_KEY=d8b04ec9a6d2813c3d80d473b08b1528261b0761be3a731a7b017f6fc8f104fa606f0e3a
AC_LIST_ID=1
AC_TAG=MWV Evergreen angemeldet WG

# CLICKSEND (hast du bereits)
CLICKSEND_API_USER=hello@lunaswayfare.com
CLICKSEND_API_KEY=CA4536C0-1BE8-E4A0-1952-8052566EB53B
CLICKSEND_SMS_FROM=Natalie

# SERVER
NODE_ENV=development
PORT=3001
```

### 3. Frontend anpassen (für lokales Testing)
In `meilenkurs-frontend.html` suche diese Zeile:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

Für lokales Testing: `const API_URL = 'http://localhost:3001';`

### 4. Server starten
```bash
npm run dev
```

Frontend wird served unter: **http://localhost:3001**

---

## 🌐 Auf Vercel deployen

### 1. GitHub Repository erstellen
```bash
git init
git add .
git commit -m "Initial commit: Meilenkurs 2.0"
git push origin main
```

### 2. Vercel Account erstellen
→ https://vercel.com/signup

### 3. Project auf Vercel importieren
1. Gehe zu https://vercel.com/dashboard
2. Klick "Add New..." → "Project"
3. Wähle dein GitHub Repo
4. Deploy!

### 4. Environment Variables in Vercel setzen
Nach dem Deploy zu Vercel gehen:
1. Projekt → Settings → Environment Variables
2. Füge alle Variablen aus `.env` ein:

```
WEBINARGEEK_API_KEY: Y5T53-...
WEBINARGEEK_WEBINAR_ID: 365390
WEBINARGEEK_EPISODE_ID: 390073
AC_API_URL: https://lunaswayfare.api-us1.com
AC_API_KEY: d8b04ec...
AC_LIST_ID: 1
AC_TAG: MWV Evergreen angemeldet WG
CLICKSEND_API_USER: hello@lunaswayfare.com
CLICKSEND_API_KEY: CA4536C0-...
CLICKSEND_SMS_FROM: Natalie
NODE_ENV: production
```

5. Trigger Re-deployment:
   - Projekt → Deployments → klick auf "Redeploy"

---

## 🔗 Formular einbetten

### Option A: Standalone auf Vercel
Das Formular läuft unter: `https://dein-vercel-projekt.vercel.app`

### Option B: Auf eigener Domain einbetten
1. Gehe zu Vercel → Project Settings → Domains
2. Füge `webinar.thorstenkoch-defi.com` hinzu
3. Aktualisiere DNS-Records (Vercel gibt dir die Anleitung)

### Option C: Im Overlay auf bestehender Website
Kopiere diesen Code in deine HTML-Seite:
```html
<div id="webinar-form"></div>
<script>
  fetch('https://dein-vercel-projekt.vercel.app/meilenkurs-frontend.html')
    .then(r => r.text())
    .then(html => document.getElementById('webinar-form').innerHTML = html);
</script>
```

---

## 🧪 Testen

### Test 1: Email-Registration
1. Öffne das Formular
2. Gib eine Test-Email ein
3. Check: Sollte in ActiveCampaign angelegt sein (Master Contact List)

### Test 2: SMS-Versand
1. Gib Name + Telefon ein
2. Check: SMS sollte via Clicksend versendet sein (check Clicksend Dashboard)

### Test 3: Webinargeek Integration
1. Nach vollständiger Anmeldung check Webinargeek
2. Sollte eine neue Registration haben

### API Health Check
Besuche: `https://dein-vercel-projekt.vercel.app/api/health`
Response sollte sein:
```json
{ "status": "ok", "timestamp": "..." }
```

---

## 🔐 Security Best Practices

### ⚠️ API-Keys regenerieren!
Deine API-Keys sind jetzt in diesem Code sichtbar. Du solltest:
1. **Webinargeek API-Key regenerieren** → neue Kopie in Vercel einsetzen
2. **ActiveCampaign API-Key regenerieren** → neue Kopie in Vercel einsetzen
3. **Clicksend API-Key regenerieren** → neue Kopie in Vercel einsetzen

### Umgebungsvariablen schützen
- ✅ **NIEMALS** API-Keys im Frontend-Code hardcoden
- ✅ Nutze nur Umgebungsvariablen im Backend
- ✅ Frontend macht Requests zum Backend, nicht direkt zu APIs

---

## 🐛 Troubleshooting

### Problem: "CORS Error"
**Lösung:** Stelle sicher, dass in `vercel.json` CORS korrekt konfiguriert ist.

### Problem: "SMS wird nicht versendet"
**Lösung:**
1. Check Clicksend Dashboard → SMS Log
2. Überprüfe: Guthaben im Clicksend Account vorhanden?
3. Überprüfe: Telefonnummer im korrekten Format? (+49...)

### Problem: "Lead wird nicht in AC angelegt"
**Lösung:**
1. Check ActiveCampaign → Kontakte
2. Überprüfe: AC_API_KEY und AC_API_URL korrekt?
3. Überprüfe: AC_LIST_ID existiert? (Admin → Lists)

### Problem: "Formular lädt nicht"
**Lösung:**
1. Öffne Browser Console (F12)
2. Check für Fehler-Messages
3. Check: Backend läuft? (API Health Check)
4. Check: Environment Variables in Vercel gesetzt?

---

## 📊 Monitoring & Analytics

### ActiveCampaign
- Alle Leads zu sehen unter: Contacts
- Filter nach Tag: "MWV Evergreen angemeldet WG"
- Custom Fields für Access-Code, Webinar-Link

### Webinargeek
- Registrations zu sehen unter: Webinar 365390 → Registrations
- Export möglich als CSV

### Clicksend
- SMS-Log: Dashboard → SMS Reports
- Kosten tracker

---

## 🎯 Nächste Schritte

1. ✅ **Deploy auf Vercel** (diese Anleitung)
2. ✅ **Test mit echten Daten** (1-2 Anmeldungen)
3. ✅ **Tracking überprüfen** (AC, Webinargeek, SMS)
4. ✅ **Landing Page erstellen** mit Link zum Formular
5. ✅ **Ads starten** (Facebook, Google, etc.)

---

## 💬 Support

Falls Probleme auftreten:
1. Check diese Anleitung nochmal
2. Logs in Browser Console anschauen (F12)
3. Vercel Logs checken: Projekt → Deployments → Logs

---

## 📄 Lizenz
MIT - Frei nutzbar für deine Projekte!

**Viel Erfolg mit dem Meilenkurs 2.0!** 🚀

---

**Erstellt für:** Thorsten Koch / Meilenweit Voraus
**Datum:** 2026
**Version:** 1.0.0
