const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;
const AC_LIST_ID = process.env.AC_LIST_ID || '1';
const AC_TAG = process.env.AC_TAG;

// Webinargeek
const WG_API_KEY = process.env.WEBINARGEEK_API_KEY;
const WG_WEBINAR_ID = process.env.WEBINARGEEK_WEBINAR_ID;
const WG_EPISODE_ID = process.env.WEBINARGEEK_EPISODE_ID;
const WG_BROADCAST_ID = process.env.WEBINARGEEK_BROADCAST_ID;

// Meta Conversions API
const META_PIXEL_ID = '468972542963546';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Google Sheets Webhook
const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK;

// 🎯 Google Sheets Logger
async function logToGoogleSheets(leadData) {
  try {
    if (!GOOGLE_SHEETS_WEBHOOK) {
      console.log('Google Sheets webhook not configured, skipping');
      return true;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      email: leadData.email,
      firstname: leadData.firstname,
      phone: leadData.phone,
      country: leadData.country,
      utm_source: leadData.utm_source || '-',
      utm_campaign: leadData.utm_campaign || '-',
      fbclid: leadData.fbclid || '-',
      lead_source: leadData.lead_source || '-',
      lead_score: leadData.lead_score || '-',
      referrer: leadData.referrer || '-',
      browser_fp: leadData.browser_fp || '-'
    };

    console.log('Logging to Google Sheets...');
    
    const response = await axios.post(GOOGLE_SHEETS_WEBHOOK, payload);
    
    console.log('✓ Lead logged to Google Sheets');
    return true;
  } catch (error) {
    console.error('❌ Google Sheets error:', error.message);
    return true;
  }
}

// 🎯 Meta Conversions API - Full Parameter Builder Library Compliance
async function trackMetaConversion(email, phone, firstname, lastname, country, city, state, zip, fbc, fbclid, utm_source, lead_score, ipAddress, userAgent) {
  try {
    if (!META_ACCESS_TOKEN) {
      console.log('Meta Access Token not configured, skipping server-side tracking');
      return true;
    }

    // Hash function - SHA256 for PII
    const hashPII = (value) => {
      if (!value) return undefined;
      return crypto
        .createHash('sha256')
        .update(value.toLowerCase().trim())
        .digest('hex');
    };

    // Generate unique event_id for deduplication
    const event_id = `meilenkurs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build user_data with ALL hashed PII
    const userData = {
      em: hashPII(email),
      ph: hashPII(phone?.replace(/\D/g, '')), // Phone without special chars
      fn: hashPII(firstname),
      ln: hashPII(lastname || ''),
      ct: hashPII(city || ''),
      st: hashPII(state || ''),
      zp: hashPII(zip || ''),
      country: hashPII(country),
    };

    // Add optional parameters if available
    if (ipAddress) {
      userData.external_id = hashPII(ipAddress + email); // External ID for matching
    }

    // Remove undefined values
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

    // Build custom_data
    const customData = {
      value: lead_score || 0,
      currency: 'EUR',
      content_name: 'Meilenweit Voraus Workshop 2.0',
      content_type: 'webinar_registration',
      num_items: 1,
      lead_source: utm_source || 'direct'
    };

    // Full event payload with ALL recommended parameters
    const eventPayload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000), // Unix timestamp
          event_id: event_id, // For deduplication
          event_source_url: 'https://deine-domain.com', // Your registration page URL
          action_source: 'website',
          user_data: userData,
          custom_data: customData,
          fbc: fbc, // Facebook Cookie
          fbclid: fbclid, // Facebook Click ID
          // Optional: for better matching
          opt_out: false,
          data_processing_options: [], // GDPR compliance
          data_processing_options_country: 'DE',
          data_processing_options_state: 'all'
        }
      ],
      // Test mode for debugging (remove in production)
      test_event_code: process.env.META_TEST_EVENT_CODE || undefined
    };

    // Remove undefined fields
    if (!eventPayload.test_event_code) delete eventPayload.test_event_code;

    console.log('📊 Meta Conversions API Payload:');
    console.log('Event ID:', event_id);
    console.log('User Data Keys:', Object.keys(eventPayload.data[0].user_data));
    console.log('Custom Data:', customData);
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`,
      eventPayload,
      {
        params: {
          access_token: META_ACCESS_TOKEN
        }
      }
    );

    console.log('✓ Meta Conversions API event tracked - Event ID:', event_id);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Meta error:', error.response?.data || error.message);
    if (error.response?.data?.error?.message) {
      console.error('Meta Error Detail:', error.response.data.error.message);
    }
    return true; // Don't block registration on Meta error
  }
}

// Clicksend SMS
const CLICKSEND_API_USER = process.env.CLICKSEND_API_USER;
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY;

async function sendSMS(phone, country, firstname, accessCode, accessLink, confirmationLink, watchLink) {
  try {
    if (!CLICKSEND_API_USER || !CLICKSEND_API_KEY) {
      console.log('Clicksend not configured, skipping SMS');
      return true;
    }

    let formattedPhone = phone;
    if (country === 'DE') formattedPhone = '+49' + (phone.startsWith('0') ? phone.slice(1) : phone);
    else if (country === 'AT') formattedPhone = '+43' + (phone.startsWith('0') ? phone.slice(1) : phone);
    else if (country === 'CH') formattedPhone = '+41' + (phone.startsWith('0') ? phone.slice(1) : phone);

    let message = `Hallo ${firstname}

Du hast dich für den Workshop mit Meilenweitvoraus angemeldet.

Zugangscode: ${accessCode}

📅 Zur Bestätigung & Kalender:
${confirmationLink || accessLink}

🎥 Zum Workshop:
${watchLink || accessLink}

Sonnige Grüße
Natalie`;

    console.log('Sending SMS to:', formattedPhone);
    
    const response = await axios.post(
      'https://rest.clicksend.com/v3/sms/send',
      {
        messages: [
          {
            to: formattedPhone,
            body: message,
          },
        ],
      },
      {
        auth: {
          username: CLICKSEND_API_USER,
          password: CLICKSEND_API_KEY,
        },
      }
    );

    console.log('✓ SMS sent successfully');
    return true;
  } catch (error) {
    console.error('❌ SMS error:', error.response?.data || error.message);
    return true;
  }
}

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/meilenkurs-frontend.html');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * STEP 1: Register email in Active Campaign
 */
app.post('/api/register-step1', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== STEP 1 ===');
    console.log('Email:', email.substring(0,5)+'***');
    console.log('AC Config Check:', {
      AC_API_URL: !!AC_API_URL,
      AC_API_KEY: AC_API_KEY?.substring(0, 10) + '...',
      AC_LIST_ID: AC_LIST_ID
    });

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    if (!AC_API_URL || !AC_API_KEY) {
      console.error('❌ Missing AC credentials!');
      console.error('AC_API_URL:', AC_API_URL);
      console.error('AC_API_KEY exists:', !!AC_API_KEY);
      return res.status(500).json({ success: false, message: 'Server not configured - missing AC credentials' });
    }

    let contactId;
    
    try {
      console.log('Searching AC for existing contact...');
      const searchResponse = await axios.get(
        `${AC_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
        { headers: { 'Api-Token': AC_API_KEY } }
      );

      if (searchResponse.data.contacts && searchResponse.data.contacts.length > 0) {
        contactId = searchResponse.data.contacts[0].id;
        console.log('✓ Contact found:', contactId);
      } else {
        throw new Error('Contact not found, will create');
      }
    } catch (searchError) {
      console.log('Creating new contact...');
      try {
        const createResponse = await axios.post(
          `${AC_API_URL}/api/3/contacts`,
          {
            contact: {
              email: email,
              firstName: '',
              lastName: '',
            },
          },
          { headers: { 'Api-Token': AC_API_KEY } }
        );
        
        contactId = createResponse.data.contact.id;
        console.log('✓ Contact created:', contactId);
      } catch (createError) {
        console.error('❌ Create contact error:', createError.response?.status, createError.response?.data);
        return res.status(createError.response?.status || 500).json({ 
          success: false, 
          message: createError.response?.data?.errors?.[0]?.message || 'Failed to create contact',
          details: createError.response?.data
        });
      }
    }

    try {
      console.log('Adding to AC list...');
      await axios.post(
        `${AC_API_URL}/api/3/contactLists`,
        {
          contactList: {
            list: AC_LIST_ID,
            contact: contactId,
            status: 1,
          },
        },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      console.log('✓ Contact added to list');
    } catch (listError) {
      console.log('List error (may already be subscribed):', listError.response?.status, listError.response?.data);
    }

    if (AC_TAG) {
      try {
        console.log('Adding AC tag...');
        await axios.post(
          `${AC_API_URL}/api/3/contactTags`,
          {
            contactTag: {
              tag: AC_TAG,
              contact: contactId,
            },
          },
          { headers: { 'Api-Token': AC_API_KEY } }
        );
        console.log('✓ Tag added');
      } catch (tagError) {
        console.log('Tag error (may already exist):', tagError.response?.status, tagError.response?.data);
      }
    }

    console.log('✓ Step 1 success');
    res.json({ success: true, contactId });
  } catch (error) {
    console.error('❌ Step 1 error:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.errors?.[0]?.message || error.message || 'Registration failed',
      details: error.response?.data
    });
  }
});

/**
 * STEP 2: Complete registration - ENTERPRISE TRACKING
 */
app.post('/api/register-complete', async (req, res) => {
  try {
    const { 
      email, firstname, phone, country, 
      fbc, fbclid, emailHash, phoneHash,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer, lead_source, browser_fp
    } = req.body;

    console.log('=== STEP 2 - ENTERPRISE TRACKING ===');
    console.log('Lead:', { email: email.substring(0,5)+'***', firstname });
    console.log('Phone:', phone);
    console.log('Country:', country);
    console.log('Tracking:', { utm_source, lead_source, fbclid: !!fbclid });

    if (!email || !firstname || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!WG_API_KEY) {
      console.error('❌ Missing Webinargeek API key!');
      return res.status(500).json({ success: false, message: 'Server not configured - missing WG credentials' });
    }

    // Get or create contact in AC
    let contactId;
    try {
      console.log('📍 Searching AC for contact...');
      const acSearchResponse = await axios.get(
        `${AC_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
        { headers: { 'Api-Token': AC_API_KEY } }
      );

      if (acSearchResponse.data.contacts.length > 0) {
        contactId = acSearchResponse.data.contacts[0].id;
        console.log('✓ AC Contact found:', contactId);
      } else {
        console.log('Creating new AC contact...');
        const createResponse = await axios.post(
          `${AC_API_URL}/api/3/contacts`,
          {
            contact: {
              email: email,
              firstName: firstname,
              phone: phone,
            },
          },
          { headers: { 'Api-Token': AC_API_KEY } }
        );
        contactId = createResponse.data.contact.id;
        console.log('✓ AC Contact created:', contactId);
      }
    } catch (acError) {
      console.error('❌ AC contact error:', acError.response?.status, acError.response?.data);
      return res.status(acError.response?.status || 500).json({ 
        success: false, 
        message: 'ActiveCampaign error: ' + (acError.response?.data?.errors?.[0]?.message || acError.message),
        details: acError.response?.data
      });
    }

    // 🎯 UPDATE AC CONTACT WITH TRACKING DATA
    try {
      console.log('📍 Updating AC contact with tracking data...');
      const trackingData = {
        firstName: firstname,
        phone: phone,
        fieldValues: [
          { field: 'fbclid', value: fbclid || '' },
          { field: 'fbc', value: fbc || '' },
          { field: 'utm_source', value: utm_source || '' },
          { field: 'utm_medium', value: utm_medium || '' },
          { field: 'utm_campaign', value: utm_campaign || '' },
          { field: 'utm_content', value: utm_content || '' },
          { field: 'utm_term', value: utm_term || '' },
          { field: 'referrer', value: referrer || '' },
          { field: 'lead_source', value: lead_source || 'direct' },
          { field: 'lead_score', value: lead_source === 'paid' ? 9 : (lead_source === 'referral' ? 7 : 5) },
          { field: 'browser_fp', value: browser_fp || '' },
          { field: 'registration_ts', value: new Date().toISOString() }
        ]
      };

      await axios.put(
        `${AC_API_URL}/api/3/contacts/${contactId}`,
        { contact: trackingData },
        { headers: { 'Api-Token': AC_API_KEY } }
      );
      console.log('✓ AC contact updated with tracking data');
    } catch (acUpdateError) {
      console.error('❌ AC update error:', acUpdateError.response?.status, acUpdateError.response?.data);
      // Don't block on AC update error
      console.log('Continuing despite AC update error...');
    }

    // Get Webinargeek broadcast
    let broadcastId = WG_BROADCAST_ID;
    
    if (!broadcastId) {
      try {
        console.log('📍 Getting Webinargeek webinar info...');
        console.log('WG_WEBINAR_ID:', WG_WEBINAR_ID);
        console.log('WG_EPISODE_ID:', WG_EPISODE_ID);

        const webinarResponse = await axios.get(
          `https://app.webinargeek.com/api/v2/webinars/${WG_WEBINAR_ID}`,
          { headers: { 'Api-Token': WG_API_KEY } }
        );

        console.log('✓ Webinar found');
        const episodes = webinarResponse.data.episodes || [];
        console.log('Episodes count:', episodes.length);

        const episode = episodes.find(ep => ep.id == WG_EPISODE_ID);
        
        if (!episode) {
          console.error('❌ Episode not found! ID:', WG_EPISODE_ID);
          console.error('Available episodes:', episodes.map(e => ({ id: e.id, title: e.title })));
          return res.status(404).json({ 
            success: false, 
            message: `Webinargeek episode ${WG_EPISODE_ID} not found`,
            availableEpisodes: episodes.map(e => ({ id: e.id, title: e.title }))
          });
        }

        const broadcasts = episode.broadcasts || [];
        console.log('Broadcasts count:', broadcasts.length);

        if (!broadcasts || broadcasts.length === 0) {
          console.error('❌ No broadcasts found for episode');
          return res.status(404).json({ success: false, message: 'No broadcasts found for this episode' });
        }

        const now = Math.floor(Date.now() / 1000);
        const nextBroadcast = broadcasts.find(b => b.date > now) || broadcasts[0];
        broadcastId = nextBroadcast.id;
        console.log('✓ Broadcast selected:', broadcastId);
      } catch (wgError) {
        console.error('❌ Webinargeek error:', wgError.response?.status, wgError.response?.data);
        return res.status(wgError.response?.status || 500).json({ 
          success: false, 
          message: 'Webinargeek error: ' + (wgError.response?.data?.message || wgError.message),
          details: wgError.response?.data,
          wgConfig: { WG_WEBINAR_ID, WG_EPISODE_ID, WG_API_KEY: WG_API_KEY?.substring(0, 10) + '...' }
        });
      }
    }

    // Register in Webinargeek
    let subscriptionId;
    let confirmationLink;
    let watchLink;
    
    try {
      console.log('\n╔════════════════════════════════════════════╗');
      console.log('║  📍 WEBINARGEEK REGISTRATION                ║');
      console.log('╚════════════════════════════════════════════╝');
      
      console.log('\n📊 PAYLOAD:');
      const wgPayload = {
        firstname: firstname,
        email: email,
        phone: phone,
        country: country,
      };
      console.log(JSON.stringify(wgPayload, null, 2));
      
      console.log('\n🔑 API CONFIG:');
      console.log('  API-Key:', WG_API_KEY.substring(0, 10) + '...');
      console.log('  Broadcast ID:', broadcastId);
      console.log('  Endpoint:', `https://app.webinargeek.com/api/v2/broadcasts/${broadcastId}/subscriptions`);
      
      const wgResponse = await axios.post(
        `https://app.webinargeek.com/api/v2/broadcasts/${broadcastId}/subscriptions`,
        wgPayload,
        { 
          headers: { 'Api-Token': WG_API_KEY },
          timeout: 10000
        }
      );

      console.log('\n✅ SUCCESS!');
      console.log('Response Status:', wgResponse.status);
      console.log('Response Data:', JSON.stringify(wgResponse.data, null, 2));
      
      subscriptionId = wgResponse.data.id;
      confirmationLink = wgResponse.data.confirmation_link || wgResponse.data.confirmationLink;
      watchLink = wgResponse.data.watch_link || wgResponse.data.watchLink;
      
      console.log('\n📥 EXTRACTED:');
      console.log('  subscriptionId:', subscriptionId);
      console.log('  confirmationLink:', confirmationLink);
      console.log('  watchLink:', watchLink);
      
    } catch (wgError) {
      console.log('\n❌ ERROR!');
      console.log('Status:', wgError.response?.status);
      console.log('Status Text:', wgError.response?.statusText);
      console.log('Message:', wgError.message);
      console.log('Config URL:', wgError.config?.url);
      console.log('Config Data:', wgError.config?.data);
      console.log('Response Headers:', JSON.stringify(wgError.response?.headers, null, 2));
      console.log('Response Data:', JSON.stringify(wgError.response?.data, null, 2));
      
      return res.status(422).json({ 
        success: false, 
        message: 'Webinargeek subscription error',
        error: {
          status: wgError.response?.status,
          statusText: wgError.response?.statusText,
          message: wgError.message,
          data: wgError.response?.data,
          headers: wgError.response?.headers,
          config: {
            url: wgError.config?.url,
            method: wgError.config?.method,
            payload: wgError.config?.data ? JSON.parse(wgError.config.data) : null
          }
        }
      });
    }

    const accessLink = confirmationLink || watchLink || `https://webinars.webinargeek.com/watch/?subscription=${subscriptionId}`;
    
    // 🎯 TRACK IN META CONVERSIONS API
    const lead_score = lead_source === 'paid' ? 9 : (lead_source === 'referral' ? 7 : 5);
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    
    try {
      console.log('📍 Tracking Meta Conversions API...');
      await trackMetaConversion(
        email, phone, firstname, '', country, '', '', '', fbc, fbclid, utm_source, lead_score, clientIP, userAgent
      );
      console.log('✓ Meta tracking complete');
    } catch (metaError) {
      console.error('Meta error:', metaError.message);
    }
    
    // 🎯 LOG TO GOOGLE SHEETS
    try {
      console.log('📍 Logging to Google Sheets...');
      const leadData = {
        email, firstname, phone, country,
        utm_source, utm_campaign, fbclid,
        lead_source, lead_score, referrer, browser_fp
      };
      await logToGoogleSheets(leadData);
      console.log('✓ Google Sheets logging complete');
    } catch (sheetsError) {
      console.error('Sheets error:', sheetsError.message);
    }
    
    // Send SMS
    try {
      console.log('📍 Sending SMS...');
      await sendSMS(phone, country, firstname, subscriptionId, accessLink, confirmationLink, watchLink);
      console.log('✓ SMS sent');
    } catch (smsError) {
      console.error('SMS error:', smsError.message);
    }

    console.log('✅ STEP 2 COMPLETE - ALL SUCCESS');
    res.json({ success: true, subscriptionId, accessLink });
  } catch (error) {
    console.error('❌ STEP 2 UNHANDLED ERROR:', error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.message || error.message || 'Registration failed',
      details: error.response?.data,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
