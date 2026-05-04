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

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    // Create/Update contact in Active Campaign
    const acResponse = await axios.post(
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

    const contactId = acResponse.data.contact.id;

    // Add contact to list
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

    // Add tag
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

    res.json({ success: true, contactId });
  } catch (error) {
    console.error('Step 1 error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.errors?.[0]?.message || 'Registration failed' 
    });
  }
});

/**
 * STEP 2: Complete registration (update AC + register in Webinargeek)
 */
app.post('/api/register-complete', async (req, res) => {
  try {
    const { email, firstname, phone, country } = req.body;

    if (!email || !firstname || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get contact by email in Active Campaign
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
    } else {
      // Create new contact if not found
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
    }

    // Update contact in Active Campaign with name and phone
    await axios.put(
      `${AC_API_URL}/api/3/contacts/${contactId}`,
      {
        contact: {
          firstName: firstname,
          phone: phone,
          fieldValues: [
            {
              field: 1,
              value: firstname,
            },
          ],
        },
      },
      {
        headers: {
          'Api-Token': AC_API_KEY,
        },
      }
    );

    // Register in Webinargeek
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

    res.json({ success: true, registrationId: wgResponse.data.registrationId });
  } catch (error) {
    console.error('Complete registration error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Registration failed' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
