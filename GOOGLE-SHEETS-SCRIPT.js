/**
 * MEILENKURS 2.0 - Google Sheets Logger
 * 
 * Kopiere diesen Code in Google Apps Script:
 * 1. Öffne dein Sheet
 * 2. Extensions (oben) → Apps Script
 * 3. Löschen den default Code
 * 4. Füge DIESEN Code ein
 * 5. Deploy!
 */

function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Append new row with all tracking data
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email || '',
      data.firstname || '',
      data.phone || '',
      data.country || '',
      data.utm_source || '-',
      data.utm_campaign || '-',
      data.fbclid || '-',
      data.lead_source || '-',
      data.lead_score || '-',
      data.referrer || '-',
      data.browser_fp || ''
    ]);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Lead logged successfully'
    }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Test function (run manually to test)
function testLog() {
  const testData = {
    timestamp: new Date().toISOString(),
    email: 'test@example.com',
    firstname: 'Test',
    phone: '+49123456789',
    country: 'DE',
    utm_source: 'facebook',
    utm_campaign: 'meilenkurs',
    fbclid: 'test_fbclid_123',
    lead_source: 'paid',
    lead_score: 9,
    referrer: 'facebook.com',
    browser_fp: 'abc123def456'
  };
  
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.appendRow([
    testData.timestamp,
    testData.email,
    testData.firstname,
    testData.phone,
    testData.country,
    testData.utm_source,
    testData.utm_campaign,
    testData.fbclid,
    testData.lead_source,
    testData.lead_score,
    testData.referrer,
    testData.browser_fp
  ]);
  
  Logger.log('Test row added');
}
