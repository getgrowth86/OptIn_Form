# 🔧 Webinargeek 422 Error - Debugging Guide

## Problem
```
Fehler: Webinargeek subscription error: Request failed with status code 422
```

## IDs sind korrekt:
✅ WEBINAR_ID: 565171
✅ EPISODE_ID: 600918
✅ BROADCAST_ID: 6161271

## Ursachen für 422 Error:

### 1. **Phone Format**
Webinargeek könnte ein spezifisches Phone-Format erwarten:
- Mit +49 Prefix?
- Nur Zahlen?
- Spezifische Länge?

### 2. **Broadcast-Status**
Der Broadcast könnte:
- Deaktiviert sein
- Abgelaufen sein
- Nicht existieren

### 3. **Daten-Validierung**
Webinargeek validiert streng:
- Email Format
- Phone Länge
- Country Code

## Debug-Schritte

### SCHRITT 1: Deploy new server.js
```
1. Download updated meilenkurs-2-0.zip
2. Copy server.js
3. GitHub push
4. Vercel redeploy
```

### SCHRITT 2: Test wieder
```
1. Form ausfüllen
2. F12 → Network Tab
3. POST /api/register-complete
4. Response Tab → Copy full error
```

### SCHRITT 3: Schau nach:
```
❌ Webinargeek subscription error: [STATUS]
Response data: {...}
Payload: {
  firstname: "...",
  email: "...",
  phone: "...",
  country: "..."
}
```

## Mögliche Fixes

### Fix 1: Phone Format überprüfen
```javascript
// Vielleicht muss phone nur Zahlen sein ohne +49?
// Test in Webinargeek Dashboard:
// - Subscriber hinzufügen
// - Welches Format akzeptiert WG?
```

### Fix 2: Broadcast-ID dynamisch holen
```javascript
// Current code:
const nextBroadcast = broadcasts.find(b => b.date > now) || broadcasts[0];

// Falls broadcasts leer sind:
console.log('Available broadcasts:', broadcasts.map(b => ({
  id: b.id,
  date: new Date(b.date * 1000),
  status: b.status
})));
```

### Fix 3: Versuche ohne Country
```javascript
// Manche APIs mögen country nicht
const wgPayload = {
  firstname: firstname,
  email: email,
  phone: phone
  // Entferne: country: country
};
```

## Share den Error

Nach dem Redeploy und Re-Test, schreib mir:

```
Webinargeek Error Details:
Status Code: [?]
Response Data: [...]
Payload: {...}
```

Dann kann ich den genauen Fix machen!
