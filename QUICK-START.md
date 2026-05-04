# ⚡ Quick-Start: 5 Minuten bis Live!

## 🎯 Was du machst:
1. Code zu GitHub pushen
2. Vercel mit GitHub verbinden
3. Environment Variables eintragen
4. LIVE! 🎉

---

## 📦 Datei-Struktur

```
meilenkurs-2-0/
├── server.js                  ← Backend (Node.js/Express)
├── meilenkurs-frontend.html   ← Frontend (HTML/CSS/JS)
├── package.json               ← Dependencies
├── vercel.json                ← Vercel Config
├── .env.example               ← Template (kopiere zu .env)
├── README.md                  ← Vollständige Anleitung
└── .gitignore                 ← Git Ignore Rules
```

---

## 🚀 Step-by-Step Deployment

### Step 1: GitHub vorbereiten (2 Min)
```bash
# Im Projekt-Ordner
git init
git add .
git commit -m "Meilenkurs 2.0 Initial"
git push -u origin main
```

### Step 2: Auf Vercel deployen (1 Min)
1. Gehe zu: https://vercel.com
2. Login / Sign up
3. "Add New Project"
4. Wähle dein GitHub Repo
5. Klick "Deploy"

### Step 3: Environment Variables (1 Min)
In Vercel Projekt → Settings → Environment Variables:

```
WEBINARGEEK_API_KEY=Y5T53-rLBE07pXyhzjTdWx9CwlDu1ncCpjNnliY9lPLUKFFw5LwIvhaBjmoZv0QJF9R6Er45hI41FmB_54rpRQ
WEBINARGEEK_WEBINAR_ID=365390
WEBINARGEEK_EPISODE_ID=390073

AC_API_URL=https://lunaswayfare.api-us1.com
AC_API_KEY=d8b04ec9a6d2813c3d80d473b08b1528261b0761be3a731a7b017f6fc8f104fa606f0e3a
AC_LIST_ID=1
AC_TAG=MWV Evergreen angemeldet WG

CLICKSEND_API_USER=hello@lunaswayfare.com
CLICKSEND_API_KEY=CA4536C0-1BE8-E4A0-1952-8052566EB53B
CLICKSEND_SMS_FROM=Natalie

NODE_ENV=production
```

### Step 4: Redeploy (1 Min)
- Vercel → Deployments → Redeploy
- Warte ~2 Min...
- ✅ LIVE!

---

## ✅ Test nach dem Deploy

**Öffne in Browser:**
```
https://dein-vercel-projekt.vercel.app
```

**Solltest du sehen:**
- ✅ Formular mit Hell + Orange Design
- ✅ Step 1: Email Input
- ✅ Step 2: Sonntag 10:00 Uhr
- ✅ Step 3: Name + Telefon

**Test-Anmeldung machen:**
1. Email eingeben
2. Termin wählen
3. Name + Telefon eingeben
4. "Kostenlos anmelden"

**Überprüfen:**
- ✅ Lead in ActiveCampaign? (Contacts)
- ✅ SMS erhalten? (check Handy)
- ✅ Registration in Webinargeek? (Webinar → Registrations)

---

## 🔗 URL-Struktur

Dein Formular ist jetzt unter:
- **Vercel Domain:** `https://dein-vercel-projekt.vercel.app`
- **Custom Domain:** `webinar.thorstenkoch-defi.com` (optional, siehe README)

---

## 📱 Auf Website einbetten

Wenn du das Formular auf deiner bestehenden Webseite einbetten willst:

```html
<!-- In deine Website HTML einfügen -->
<div id="webinar-form" style="width: 100%; max-width: 500px; margin: 0 auto;">
  <!-- Formular wird hier geladen -->
</div>

<script>
  // Lade das Formular
  document.getElementById('webinar-form').innerHTML = 
    '<iframe src="https://dein-vercel-projekt.vercel.app" style="width: 100%; height: 800px; border: none; border-radius: 20px;"></iframe>';
</script>
```

---

## ⚠️ WICHTIG: API-Keys regenerieren!

Nach dem Deploy solltest du deine API-Keys in den Originalanwendungen **REGENERIEREN**:

1. **Webinargeek:** Settings → API → Regenerate
2. **ActiveCampaign:** Settings → Developer → Regenerate API Token
3. **Clicksend:** Account Settings → API → Regenerate Key

→ Die neuen Keys dann in Vercel einsetzen

---

## 🐛 Häufige Fehler

| Problem | Lösung |
|---------|--------|
| "Cannot find module" | `npm install` lokal nochmal ausführen |
| 500 Error im Formular | Environment Variables in Vercel überprüfen |
| SMS nicht versendet | Clicksend Account hat kein Guthaben? |
| Lead nicht in AC | AC_API_KEY falsch? AC_LIST_ID existiert? |

---

## 📊 Nach dem Launch

- **Traffick starten:** Ads schalten (Facebook, Google)
- **Monitoring:** ActiveCampaign → Contacts filtern nach Tag
- **SMS-Kosten:** Clicksend Dashboard → SMS Reports
- **Webinar-Data:** Webinargeek → Webinar → Analytics

---

## 💡 Nächste Features (optional)

- [x] Multi-Step Form
- [x] Webinargeek Integration
- [x] ActiveCampaign Integration
- [x] SMS-Versand
- [ ] A/B Testing (später)
- [ ] Custom Analytics (später)
- [ ] Email-Automation (später)

---

**Du bist LIVE!** 🎉

Gratuliere! Dein Registrierungs-Funnel für den Meilenkurs 2.0 läuft jetzt auf Vercel und ist mit all deinen Tools verbunden.

Jetzt: **Ads starten und Leads generieren!** 🚀
