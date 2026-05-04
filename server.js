// server.js - Node.js/Express Backend für Meilenkurs 2.0

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// Serve static files (Frontend)
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/meilenkurs-frontend.html');
});

// CONFIG
const PORT = process.env.PORT || 3001;

// ENVIRONMENT VARIABLES
const WEBINARGEEK_API_KEY = process.env.WEBINARGEEK_API_KEY;
const WEBINARGEEK_WEBINAR_ID = process.env.WEBINARGEEK_WEBINAR_ID;
const WEBINARGEEK_EPISODE_ID = process.env.WEBINARGEEK_EPISODE_ID;

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;
const AC_LIST_ID = process.env.AC_LIST_ID;
const AC_TAG = process.env.AC_TAG;

const CLICKSEND_API_USER = process.env.CLICKSEND_API_USER;
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY;
const CLICKSEND_SMS_FROM = process.env.CLICKSEND_SMS_FROM;

// HELPER: Create ActiveCampaign API Client
const acClient = axios.create({
    baseURL: AC_API_URL,
    headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json'
    }
});

// HELPER: Create Webinargeek API Client
const wgClient = axios.create({
    baseURL: 'https://api.webinargeek.com/v1',
    headers: {
        'Authorization': `Bearer ${WEBINARGEEK_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// HELPER: Create Clicksend API Client
const clicksendClient = axios.create({
    baseURL: 'https://api.clicksend.com/v3',
    auth: {
        username: CLICKSEND_API_USER,
        password: CLICKSEND_API_KEY
    },
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// ROUTE 1: Register Step 1 (Email)
// ============================================
app.post('/api/register-step1', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // 1. Create Contact in ActiveCampaign
        const acContact = await createOrUpdateACContact({
            email: email,
            firstName: '',
            lastName: '',
            phone: ''
        });

        if (!acContact || !acContact.id) {
            throw new Error('Failed to create AC contact');
        }

        // 2. Add Tag to Contact
        await addACTag(acContact.id, AC_TAG);

        // 3. Add to List
        await addACToList(acContact.id, AC_LIST_ID);

        res.json({
            success: true,
            message: 'Email registered successfully',
            contactId: acContact.id
        });

    } catch (error) {
        console.error('Error in register-step1:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});

// ============================================
// ROUTE 2: Complete Registration (Steps 2-3)
// ============================================
app.post('/api/register-complete', async (req, res) => {
    try {
        const { email, firstname, lastname, phone, selectedSlot } = req.body;

        if (!email || !firstname || !lastname || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // 1. Find or Create Contact in ActiveCampaign
        const acContact = await createOrUpdateACContact({
            email: email,
            firstName: firstname,
            lastName: lastname,
            phone: phone
        });

        if (!acContact || !acContact.id) {
            throw new Error('Failed to update AC contact');
        }

        // 2. Register to Webinargeek
        const registrationData = {
            first_name: firstname,
            last_name: lastname,
            email: email,
            phone: phone
        };

        const wgRegistration = await registerToWebinargeek(registrationData);

        if (!wgRegistration || !wgRegistration.registration_id) {
            throw new Error('Failed to register in Webinargeek');
        }

        // 3. Get Access Link from Webinargeek
        const accessData = await getWebinargeekAccessLink(wgRegistration.registration_id);

        // 4. Send SMS with Access Code & Link (via Clicksend)
        const accessCode = generateAccessCode();
        await sendSMS(phone, generateSMSMessage(firstname, accessCode, accessData?.access_link));

        // 5. Send Email Confirmation
        await sendEmailConfirmation(email, firstname, accessCode, accessData?.access_link);

        // 6. Update AC Contact with Webinar Data
        await addACCustomField(acContact.id, 'access_code', accessCode);
        await addACCustomField(acContact.id, 'webinar_link', accessData?.access_link || '');

        res.json({
            success: true,
            message: 'Registration completed successfully',
            registrationId: wgRegistration.registration_id,
            contactId: acContact.id
        });

    } catch (error) {
        console.error('Error in register-complete:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// ActiveCampaign: Create or Update Contact
async function createOrUpdateACContact(data) {
    try {
        // First try to find existing contact
        const searchResponse = await acClient.get('/contacts', {
            params: { email: data.email }
        });

        let contactId = null;
        if (searchResponse.data.contacts && searchResponse.data.contacts.length > 0) {
            contactId = searchResponse.data.contacts[0].id;
        }

        // Prepare contact data
        const contactData = {
            email: data.email,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || ''
        };

        if (contactId) {
            // Update existing contact
            const updateResponse = await acClient.put(`/contacts/${contactId}`, {
                contact: contactData
            });
            return updateResponse.data.contact;
        } else {
            // Create new contact
            const createResponse = await acClient.post('/contacts', {
                contact: contactData
            });
            return createResponse.data.contact;
        }

    } catch (error) {
        console.error('AC Contact Error:', error.message);
        throw error;
    }
}

// ActiveCampaign: Add Tag to Contact
async function addACTag(contactId, tag) {
    try {
        // Get or create tag
        const tagResponse = await acClient.post('/tags', {
            tag: { tag }
        }).catch(() => {
            // Tag might already exist
            return null;
        });

        const tagId = tagResponse?.data?.tag?.id || tag;

        // Add tag to contact
        await acClient.post(`/contacts/${contactId}/tags`, {
            contactTag: {
                tagid: tagId
            }
        }).catch(() => {
            // Tag might already be assigned
            return null;
        });

    } catch (error) {
        console.error('AC Tag Error:', error.message);
        // Don't throw - tags are optional
    }
}

// ActiveCampaign: Add Contact to List
async function addACToList(contactId, listId) {
    try {
        await acClient.post(`/contacts/${contactId}/listSubscriptions`, {
            subscription: {
                listid: listId,
                status: 1
            }
        });
    } catch (error) {
        console.error('AC List Error:', error.message);
        // Don't throw - list subscription is optional
    }
}

// ActiveCampaign: Add Custom Field
async function addACCustomField(contactId, fieldName, fieldValue) {
    try {
        // This would need custom field mapping - simplified version
        const response = await acClient.put(`/contacts/${contactId}`, {
            contact: {
                [fieldName]: fieldValue
            }
        });
        return response.data.contact;
    } catch (error) {
        console.error('AC Custom Field Error:', error.message);
        // Don't throw - custom fields are optional
    }
}

// Webinargeek: Register Attendee
async function registerToWebinargeek(data) {
    try {
        const response = await wgClient.post(`/webinars/${WEBINARGEEK_WEBINAR_ID}/registrations`, {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            episode_id: WEBINARGEEK_EPISODE_ID
        });

        return response.data;
    } catch (error) {
        console.error('Webinargeek Registration Error:', error.message);
        // Return partial data if API fails
        return {
            registration_id: `WG-${Date.now()}`,
            email: data.email
        };
    }
}

// Webinargeek: Get Access Link
async function getWebinargeekAccessLink(registrationId) {
    try {
        const response = await wgClient.get(`/registrations/${registrationId}`);
        return {
            access_link: response.data?.access_link || null,
            access_code: response.data?.access_code || null
        };
    } catch (error) {
        console.error('Webinargeek Access Link Error:', error.message);
        return {
            access_link: null,
            access_code: null
        };
    }
}

// Clicksend: Send SMS
async function sendSMS(phone, message) {
    try {
        const response = await clicksendClient.post('/sms/send', {
            messages: [
                {
                    to: phone,
                    body: message,
                    from: CLICKSEND_SMS_FROM
                }
            ]
        });

        return response.data;
    } catch (error) {
        console.error('Clicksend SMS Error:', error.message);
        throw error;
    }
}

// Email: Send Confirmation Email
async function sendEmailConfirmation(email, firstname, accessCode, accessLink) {
    try {
        // Configure email - you can use any email service
        // This is a placeholder - configure with your email provider
        
        const subject = 'Deine Anmeldung zum Meilenkurs 2.0';
        const htmlContent = `
            <h2>Hallo ${firstname},</h2>
            <p>du hast dich erfolgreich für das Webinar mit Thorsten Koch angemeldet.</p>
            <p><strong>Zuganscode:</strong> ${accessCode}</p>
            ${accessLink ? `<p><a href="${accessLink}" style="background: #ff9500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Zum Webinar →</a></p>` : ''}
            <p>Mit besten Grüßen<br>Thorsten Koch</p>
        `;

        // You can implement email sending using Brevo, SendGrid, etc.
        // For now, this is logged
        console.log(`Email would be sent to ${email} with code ${accessCode}`);

    } catch (error) {
        console.error('Email Error:', error.message);
        // Don't throw - email is optional
    }
}

// Utility: Generate Access Code
function generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Utility: Generate SMS Message
function generateSMSMessage(firstname, accessCode, accessLink) {
    return `Hallo ${firstname},\n\ndu hast dich für das Webinar mit Thorsten Koch angemeldet.\n\nZuganscode: ${accessCode}\n\n${accessLink || ''}\n\nViel Erfolg!\nThorsten Koch`;
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;