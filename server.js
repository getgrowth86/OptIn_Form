const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 ENV VARS
const AC_API_URL = process.env.AC_API_URL || 'https://lunaswayfare.api-us1.com';
const AC_API_KEY = process.env.AC_API_KEY || '';
const AC_LIST_ID = process.env.AC_LIST_ID || '1';
const AC_TAG = process.env.AC_TAG || 'MWV Evergreen angemeldet WG';

const WG_API_KEY = process.env.WEBINARGEEK_API_KEY || '';
const WG_WEBINAR_ID = process.env.WEBINARGEEK_WEBINAR_ID || '459178';
const WG_EPISODE_ID = process.env.WEBINARGEEK_EPISODE_ID || '489120';

const CS_API_USER = process.env.CLICKSEND_API_USER || '';
const CS_API_KEY = process.env.CLICKSEND_API_KEY || '';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PIXEL_ID = '468972542963546';

// 🧮 HELPER FUNCTIONS
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

function hashPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

// ===== STEP 1: EMAIL REGISTRATION =====
app.post('/api/register-step1', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    console.log('\n📍 STEP 1 - EMAIL REGISTRATION');
    console.log('Email:', email);

    // Check if contact exists in AC
    let acContactId;
    try {
      const searchRes = await axios.get(`${AC_API_URL}/api/3/contacts`, {
        params: { email: email },
        headers: { 'Api-Token': AC_API_KEY }
      });

      if (searchRes.data.contacts && searchRes.data.contacts.length > 0) {
        acContactId = searchRes.data.contacts[0].id;
        console.log('✓ Contact found in AC:', acContactId);
      }
    } catch (searchErr) {
      console.log('Contact not found, will create new');
    }

    // Create or update contact
    let contact;
    if (acContactId) {
      // Update existing
      const updateRes = await axios.put(
        `${AC_API_URL}/api/3/contacts/${acContactId}`,
        {
          contact: {
            email: email,
            listid: AC_LIST_ID
          }
        },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      contact = updateRes.data.contact;
      console.log('✓ Contact updated in AC');
    } else {
      // Create new
      const createRes = await axios.post(
        `${AC_API_URL}/api/3/contacts`,
        {
          contact: {
            email: email,
            listid: AC_LIST_ID
          }
        },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      contact = createRes.data.contact;
      console.log('✓ Contact created in AC:', contact.id);
    }

    // Add tag
    try {
      await axios.post(
        `${AC_API_URL}/api/3/contactTags`,
        {
          contactTag: {
            contact: contact.id,
            tag: AC_TAG
          }
        },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      console.log('✓ Tag added');
    } catch (tagErr) {
      console.warn('⚠️ Tag error (non-blocking):', tagErr.message);
    }

    res.json({ success: true, contactId: contact.id });

  } catch (error) {
    console.error('❌ Step 1 Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Step 1 failed'
    });
  }
});

// ===== STEP 2: FULL REGISTRATION =====
app.post('/api/register-complete', async (req, res) => {
  try {
    const { email, firstname, phone, country, fbc, fbclid } = req.body;

    if (!email || !firstname || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: email, firstname, phone' 
      });
    }

    console.log('\n📍 STEP 2 - COMPLETE REGISTRATION');
    console.log('Email:', email);
    console.log('Name:', firstname);
    console.log('Phone:', phone);
    console.log('Country:', country);

    // ===== 1. ACTIVECAMP AIGN =====
    console.log('\n1️⃣ ACTIVECAMPAIGN');
    try {
      const acSearchRes = await axios.get(`${AC_API_URL}/api/3/contacts`, {
        params: { email: email },
        headers: { 'Api-Token': AC_API_KEY }
      });

      if (!acSearchRes.data.contacts || acSearchRes.data.contacts.length === 0) {
        throw new Error('Contact not found in AC');
      }

      const acContactId = acSearchRes.data.contacts[0].id;

      // Update with firstname and phone
      await axios.put(
        `${AC_API_URL}/api/3/contacts/${acContactId}`,
        {
          contact: {
            firstName: firstname,
            phone: phone,
            fieldValues: [
              { field: '1', value: firstname }, // First name
              { field: '2', value: phone }       // Phone
            ]
          }
        },
        { headers: { 'Api-Token': AC_API_KEY } }
      );

      console.log('✓ AC updated:', acContactId);
    } catch (acErr) {
      console.error('❌ AC Error:', acErr.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to update ActiveCampaign: ' + acErr.message 
      });
    }

    // ===== 2. WEBINARGEEK =====
    console.log('\n2️⃣ WEBINARGEEK');
    let subscriptionId;
    let watchLink = 'https://webinars.webinargeek.com';

    const wgPayload = {
      firstname: firstname,
      email: email,
      phone: phone,
      country: country
    };

    // Try multiple endpoints
    const endpoints = [
      `https://app.webinargeek.com/api/v2/episodes/${WG_EPISODE_ID}/subscriptions`,
      `https://app.webinargeek.com/api/v2/webinars/459178/episodes/${WG_EPISODE_ID}/subscriptions`,
      `https://app.webinargeek.com/api/v2/webinars/459178/series_subscribe`
    ];

    let wgSuccess = false;
    for (const endpoint of endpoints) {
      try {
        console.log(`📍 Trying: ${endpoint}`);
        const wgRes = await axios.post(endpoint, wgPayload, { 
          headers: { 'Api-Token': WG_API_KEY },
          timeout: 5000
        });
        
        subscriptionId = wgRes.data.id || wgRes.data.subscription_id || 'success';
        watchLink = wgRes.data.watch_link || wgRes.data.confirmation_link || watchLink;
        console.log('✓ SUCCESS at:', endpoint);
        wgSuccess = true;
        break;
      } catch (err) {
        console.log(`  ❌ Failed: ${err.response?.data?.message || err.message}`);
      }
    }

    if (!wgSuccess) {
      console.error('❌ All WG endpoints failed');
      return res.status(400).json({ 
        success: false, 
        message: 'Webinargeek registration failed - invalid episode'
      });
    }

    // ===== 3. CLICKSEND SMS =====
    console.log('\n3️⃣ CLICKSEND SMS');
    try {
      const smsMessage = `Hallo ${firstname}\nDu hast dich angemeldet!\nZugangslink: ${watchLink}`;
      
      await axios.post(
        'https://rest.clicksend.com/v3/sms/send',
        {
          messages: [
            {
              to: phone,
              body: smsMessage
            }
          ]
        },
        {
          auth: {
            username: CS_API_USER,
            password: CS_API_KEY
          }
        }
      );

      console.log('✓ SMS sent');
    } catch (smsErr) {
      console.warn('⚠️ SMS Error (non-blocking):', smsErr.message);
    }

    // ===== 4. META PIXEL =====
    console.log('\n4️⃣ META PIXEL');
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

      console.log('✓ Meta Pixel tracked');
    } catch (metaErr) {
      console.warn('⚠️ Meta Error (non-blocking):', metaErr.message);
    }

    // ===== SUCCESS =====
    console.log('\n✅ ALL STEPS COMPLETE');
    res.json({ 
      success: true, 
      subscriptionId: subscriptionId,
      watchLink: watchLink,
      message: 'Registration successful!'
    });

  } catch (error) {
    console.error('❌ Step 2 Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Registration failed'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve HTML on root
app.get('/', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  // Try different paths (for local dev vs Vercel)
  const possiblePaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(__dirname, 'meilenkurs-frontend.html')
  ];
  
  let html;
  for (const htmlPath of possiblePaths) {
    try {
      html = fs.readFileSync(htmlPath, 'utf8');
      console.log('✓ HTML found at:', htmlPath);
      break;
    } catch (e) {
      // Try next path
    }
  }
  
  if (!html) {
    console.error('❌ HTML file not found');
    return res.status(500).send('Error: HTML file not found');
  }
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
