const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;
const AC_LIST_ID = process.env.AC_LIST_ID || '1';
const AC_TAG = process.env.AC_TAG;

const WG_API_KEY = process.env.WEBINARGEEK_API_KEY;
const WG_WEBINAR_ID = process.env.WEBINARGEEK_WEBINAR_ID;
const WG_EPISODE_ID = process.env.WEBINARGEEK_EPISODE_ID;

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

    console.log('=== STEP 1 DEBUG ===');
    console.log('Email:', email);
    console.log('AC_API_URL:', AC_API_URL);
    console.log('AC_API_KEY exists:', !!AC_API_KEY);
    console.log('AC_LIST_ID:', AC_LIST_ID);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    if (!AC_API_URL || !AC_API_KEY) {
      console.error('Missing AC credentials!');
      return res.status(500).json({ success: false, message: 'Server not configured - missing AC credentials' });
    }

    // First: Search if contact exists
    console.log('Searching for existing contact...');
    let contactId;
    
    try {
      const searchResponse = await axios.get(
        `${AC_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Api-Token': AC_API_KEY,
          },
        }
      );

      if (searchResponse.data.contacts && searchResponse.data.contacts.length > 0) {
        contactId = searchResponse.data.contacts[0].id;
        console.log('Contact found:', contactId);
      } else {
        throw new Error('Contact not found, will create');
      }
    } catch (searchError) {
      // Contact doesn't exist, create new one
      console.log('Creating new contact...');
      const createResponse = await axios.post(
        `${AC_API_URL}/api/3/contacts`,
        {
          contact: {
            email: email,
            firstName: '',
            lastName: '',
          },
        },
        {
          headers: {
            'Api-Token': AC_API_KEY,
          },
        }
      );
      
      contactId = createResponse.data.contact.id;
      console.log('Contact created:', contactId);
    }

    // Add contact to list
    console.log('Adding to list...');
    try {
      await axios.post(
        `${AC_API_URL}/api/3/contactLists`,
        {
          contactList: {
            list: AC_LIST_ID,
            contact: contactId,
            status: 1,
          },
        },
        {
          headers: {
            'Api-Token': AC_API_KEY,
          },
        }
      );
    } catch (listError) {
      console.log('List operation (may already be subscribed):', listError.response?.status);
    }

    // Add tag
    if (AC_TAG) {
      console.log('Adding tag...');
      try {
        await axios.post(
          `${AC_API_URL}/api/3/contactTags`,
          {
            contactTag: {
              tag: AC_TAG,
              contact: contactId,
            },
          },
          {
            headers: {
              'Api-Token': AC_API_KEY,
            },
          }
        );
      } catch (tagError) {
        console.log('Tag operation (may already exist):', tagError.response?.status);
      }
    }

    console.log('✓ Step 1 success');
    res.json({ success: true, contactId });
  } catch (error) {
    console.error('❌ Step 1 error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.errors?.[0]?.message || error.message || 'Registration failed'
    });
  }
});

/**
 * STEP 2: Complete registration (update AC + register in Webinargeek)
 */
app.post('/api/register-complete', async (req, res) => {
  try {
    const { email, firstname, phone, country } = req.body;

    console.log('=== STEP 2 DEBUG ===');
    console.log('Data:', { email, firstname, phone, country });
    console.log('WG_API_KEY exists:', !!WG_API_KEY);
    console.log('WG_WEBINAR_ID:', WG_WEBINAR_ID);
    console.log('WG_EPISODE_ID:', WG_EPISODE_ID);

    if (!email || !firstname || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!WG_API_KEY) {
      console.error('Missing Webinargeek API key!');
      return res.status(500).json({ success: false, message: 'Server not configured - missing WG credentials' });
    }

    // Get contact by email in Active Campaign
    console.log('Searching contact in AC...');
    const acSearchResponse = await axios.get(
      `${AC_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Api-Token': AC_API_KEY,
        },
      }
    );

    let contactId;
    if (acSearchResponse.data.contacts.length > 0) {
      contactId = acSearchResponse.data.contacts[0].id;
      console.log('Contact found:', contactId);
    } else {
      console.log('Contact not found, creating...');
      const createResponse = await axios.post(
        `${AC_API_URL}/api/3/contacts`,
        {
          contact: {
            email: email,
            firstName: firstname,
            phone: phone,
          },
        },
        {
          headers: {
            'Api-Token': AC_API_KEY,
          },
        }
      );
      contactId = createResponse.data.contact.id;
      console.log('Contact created:', contactId);
    }

    // Update contact in Active Campaign with name and phone
    console.log('Updating AC contact...');
    await axios.put(
      `${AC_API_URL}/api/3/contacts/${contactId}`,
      {
        contact: {
          firstName: firstname,
          phone: phone,
        },
      },
      {
        headers: {
          'Api-Token': AC_API_KEY,
        },
      }
    );

    // Register in Webinargeek
    console.log('Registering in Webinargeek...');
    const wgResponse = await axios.post(
      'https://api.webinargeek.com/registrations',
      {
        webinarId: WG_WEBINAR_ID,
        episodeId: WG_EPISODE_ID,
        firstName: firstname,
        email: email,
        phone: phone,
        countryCode: country,
      },
      {
        headers: {
          'Authorization': `Bearer ${WG_API_KEY}`,
        },
      }
    );

    console.log('✓ Step 2 success');
    res.json({ success: true, registrationId: wgResponse.data.registrationId });
  } catch (error) {
    console.error('❌ Step 2 error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || error.message || 'Registration failed'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
