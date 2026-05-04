const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const AC_API_URL = process.env.AC_API_URL || 'https://lunaswayfare.api-us1.com';
const AC_API_KEY = process.env.AC_API_KEY || '';
const AC_LIST_ID = process.env.AC_LIST_ID || '1';
const AC_TAG = process.env.AC_TAG || 'MWV Evergreen angemeldet WG';

const WG_API_KEY = process.env.WEBINARGEEK_API_KEY || '';
const WG_EPISODE_ID = process.env.WEBINARGEEK_EPISODE_ID || '489120';

const CS_API_USER = process.env.CLICKSEND_API_USER || '';
const CS_API_KEY = process.env.CLICKSEND_API_KEY || '';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PIXEL_ID = '468972542963546';

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

function hashPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

app.get('/', (req, res) => {
  const fs = require('fs');
  const paths = ['./index.html', './public/index.html', '../public/index.html'];
  for (const path of paths) {
    try {
      const html = fs.readFileSync(path, 'utf8');
      return res.send(html);
    } catch (e) {}
  }
  res.status(404).send('index.html not found');
});

app.post('/api/register-step1', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    let acContactId;
    try {
      const searchRes = await axios.get(`${AC_API_URL}/api/3/contacts`, {
        params: { email: email },
        headers: { 'Api-Token': AC_API_KEY }
      });
      if (searchRes.data.contacts?.length > 0) {
        acContactId = searchRes.data.contacts[0].id;
      }
    } catch (e) {}

    let contact;
    if (acContactId) {
      const updateRes = await axios.put(
        `${AC_API_URL}/api/3/contacts/${acContactId}`,
        { contact: { email: email, listid: AC_LIST_ID } },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      contact = updateRes.data.contact;
    } else {
      const createRes = await axios.post(
        `${AC_API_URL}/api/3/contacts`,
        { contact: { email: email, listid: AC_LIST_ID } },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      contact = createRes.data.contact;
    }

    try {
      await axios.post(
        `${AC_API_URL}/api/3/contactTags`,
        { contactTag: { contact: contact.id, tag: AC_TAG } },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
    } catch (e) {}

    res.json({ success: true, contactId: contact.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/register-complete', async (req, res) => {
  try {
    const { email, firstname, phone, country, fbc, fbclid } = req.body;
    if (!email || !firstname || !phone) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // AC
    const acSearchRes = await axios.get(`${AC_API_URL}/api/3/contacts`, {
      params: { email: email },
      headers: { 'Api-Token': AC_API_KEY }
    });

    if (!acSearchRes.data.contacts?.length) {
      return res.status(400).json({ success: false, message: 'Contact not found' });
    }

    const acContactId = acSearchRes.data.contacts[0].id;
    await axios.put(
      `${AC_API_URL}/api/3/contacts/${acContactId}`,
      { contact: { firstName: firstname, phone: phone } },
      { headers: { 'Api-Token': AC_API_KEY } }
    );

    // WEBINARGEEK
    let subscriptionId;
    let watchLink = 'https://webinars.webinargeek.com';

    const wgPayload = { firstname, email, phone, country };
    const endpoints = [
      `https://app.webinargeek.com/api/v2/episodes/${WG_EPISODE_ID}/subscriptions`,
      `https://app.webinargeek.com/api/v2/webinars/459178/episodes/${WG_EPISODE_ID}/subscriptions`,
      `https://app.webinargeek.com/api/v2/webinars/459178/series_subscribe`
    ];

    let wgSuccess = false;
    for (const endpoint of endpoints) {
      try {
        const wgRes = await axios.post(endpoint, wgPayload, { 
          headers: { 'Api-Token': WG_API_KEY },
          timeout: 5000
        });
        
        subscriptionId = wgRes.data.id || wgRes.data.subscription_id || '';
        
        // Try to get watch_link or watch_token
        let watchToken = wgRes.data.watch_token || 
                         wgRes.data.access_token || 
                         wgRes.data.url_token ||
                         wgRes.data.registration_token ||
                         wgRes.data.token;
        
        // Try full links first
        watchLink = wgRes.data.watch_link || 
                    wgRes.data.confirmation_link || 
                    wgRes.data.join_url ||
                    wgRes.data.access_link ||
                    wgRes.data.registration_link ||
                    wgRes.data.link;
        
        // If we have token but no link, construct it
        if (!watchLink && watchToken) {
          watchLink = `https://lunaswayfare.webinargeek.com/watch/${watchToken}/`;
        }
        
        // Fallback
        if (!watchLink) {
          watchLink = 'https://webinars.webinargeek.com';
        }
        wgSuccess = true;
        break;
      } catch (err) {}
    }

    if (!wgSuccess) {
      return res.status(400).json({ success: false, message: 'Webinargeek failed' });
    }

    // SMS
    try {
      const smsMessage = `Hallo ${firstname}\n\nDu hast dich für den Workshop mit Meilenweitvoraus angemeldet.\n\nZugangsscope: ${subscriptionId}\n\n👇 Hier Dein Zugangslink (auch per Email):\n${watchLink}\n\nSonnige Grüße\nNatalie`;
      
      await axios.post(
        'https://rest.clicksend.com/v3/sms/send',
        {
          messages: [{ to: phone, body: smsMessage }]
        },
        {
          auth: {
            username: CS_API_USER,
            password: CS_API_KEY
          }
        }
      );
    } catch (e) {}

    // META PIXEL
    try {
      const emailHash = hashEmail(email);
      const phoneHash = hashPhone(phone);

      await axios.post(
        `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`,
        {
          data: [
            {
              event_name: 'Lead',
              event_time: Math.floor(Date.now() / 1000),
              user_data: {
                em: emailHash,
                ph: phoneHash,
                fn: firstname,
                ct: country,
                fbc: fbc,
                fbclid: fbclid
              }
            }
          ],
          access_token: META_ACCESS_TOKEN
        }
      );
    } catch (e) {}

    res.json({ 
      success: true, 
      subscriptionId: subscriptionId,
      watchLink: watchLink
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
