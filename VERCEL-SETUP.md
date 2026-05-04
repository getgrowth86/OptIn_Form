# 🚀 VERCEL - FINAL ENV VARS SETUP

## ✅ ALL CREDENTIALS READY!

```
Google Sheets Webhook ✅ NEW!
Meta Access Token ✅ 
All other vars ✅ Already set
```

---

## 📋 VERCEL SETUP - 5 MINUTEN

### SCHRITT 1: Vercel Dashboard öffnen
```
https://vercel.com/dashboard
```

### SCHRITT 2: OptIn_Form Project auswählen
```
Dashboard → OptIn_Form → Settings
```

### SCHRITT 3: Environment Variables
```
Settings → Environment Variables
```

### SCHRITT 4: Variables aktualisieren/hinzufügen

**1. GOOGLE_SHEETS_WEBHOOK** (NEW!)
```
Key: GOOGLE_SHEETS_WEBHOOK
Value: https://script.google.com/macros/s/AKfycbyet50miN-q1Q8vyqUM755Kh5BmaKzqi6V-7FOLrlBW6gTuSUgEWVxL1PHqAKDPF20/exec

Environments: Production, Preview, Development (select all)
```

**2. META_ACCESS_TOKEN** (EXISTING - verify it's there)
```
Key: META_ACCESS_TOKEN
Value: EAAFT0mw86CsBRaH7MEz23udE8UXpASi5DiHKgv5oopGoqzo1lZBcrC3hdHuwixX2MTdcUYcip8KD0Mks5HX2nhJ7CZBcfnyizUaz2kNKirFUedvaQzQkAqqqexG2VCzjJsLWGkbJssGeUXDwqLPD52qjnx2zL3Y8WtkZA1YGeeZCLEtiZBngUyTzYGyPZA7inAVQZDZD
```

**3. Check diese sind gesetzt:**
```
AC_API_URL=https://lunaswayfare.api-us1.com
AC_API_KEY=d8b04ec9a6d2813c3d80d473b08b1528261b0761be3a731a7b017f6fc8f104fa606f0e3a
AC_LIST_ID=1
AC_TAG=MWV Evergreen angemeldet WG
WEBINARGEEK_API_KEY=Y5T53-rLBE07pXyhzjTdWx9CwlDu1ncCpjNnliY9lPLUKFFw5LwIvhaBjmoZv0QJF9R6Er45hI41FmB_54rpRQ
WEBINARGEEK_WEBINAR_ID=565171
WEBINARGEEK_EPISODE_ID=600918
CLICKSEND_API_USER=hello@lunaswayfare.com
CLICKSEND_API_KEY=CA4536C0-1BE8-E4A0-1952-8052566EB53B
```

---

## 🔄 SCHRITT 5: Redeploy

Nach jedem Env Var Change MUSS man redeployen:

### Option A: Auto-redeploy (recommended)
```
1. GitHub push (mit updated .env.example)
2. Vercel auto-deploys
3. Warte auf "Ready ✅"
```

### Option B: Manual Redeploy
```
1. Vercel Dashboard
2. OptIn_Form → Deployments
3. Last deployment → Redeploy
4. Confirm
5. Warte auf "Ready ✅"
```

---

## ✅ VERIFICATION CHECKLIST

Nach dem Redeploy:

- [ ] Vercel zeigt "Ready ✅" (nicht "Building" oder "Error")
- [ ] Keine rot gefärbten Env Vars
- [ ] Alle 12+ Env Vars sind gesetzt
- [ ] Form lädt: https://opt-in-form.vercel.app
- [ ] Form antwortet auf Input
- [ ] Kein 422/500 Error beim Submit

---

## 🧪 FINAL TEST

1. **Test Google Sheets Webhook:**
```
Browser Console (F12):

fetch('https://script.google.com/macros/s/AKfycbyet50miN-q1Q8vyqUM755Kh5BmaKzqi6V-7FOLrlBW6gTuSUgEWVxL1PHqAKDPF20/exec', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@example.com',
    firstname: 'Test',
    phone: '+49123456789',
    country: 'DE',
    lead_source: 'direct',
    lead_score: 5
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

Expected: `{success: true}` ✅

2. **Test Form End-to-End:**
```
https://opt-in-form.vercel.app
Step 1: Email eingeben
Step 2: Name + Telefon
Click: ✈️ Anmelden
Check:
  ✅ Success Screen
  ✅ AC Contact created
  ✅ Google Sheets: New row?
  ✅ SMS empfangen?
```

---

## 🚨 TROUBLESHOOTING

### Form still gives 422 error?
→ Check Vercel logs (Deployments → Logs)
→ Look for which API fails
→ Share error message

### Google Sheets not getting data?
→ Test webhook URL in browser console (see above)
→ Check Google Sheets Apps Script Executions

### Env Vars don't take effect?
→ Did you redeploy? (not just save)
→ Check all 12+ vars are set
→ Clear browser cache (Ctrl+Shift+Delete)

---

## 📞 SUPPORT

- Env Var issues? → Check Vercel dashboard
- Webhook issues? → Test in console
- Form errors? → Check browser Network tab

**Everything is ready. Just deploy and test!** 🚀
