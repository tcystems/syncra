// ═══════════════════════════════════════════════════════════════════
//  Syncra "Get in Touch" Contact Form — Google Apps Script
//  Standalone script, separate from syncra-bookings-gas.gs, dedicated
//  solely to the contact form. Writes to the SAME spreadsheet (via
//  SpreadsheetApp.openById) but deploys and authorizes independently,
//  so it can never be affected by the booking script's deploy state.
//
//  SETUP STEPS:
//  1. Go to https://script.google.com → New project
//  2. Paste this entire file replacing the default Code.gs
//  3. Set SPREADSHEET_ID below to the Syncra Bookings spreadsheet ID
//     (copy it from that spreadsheet's URL:
//      docs.google.com/spreadsheets/d/{THIS_PART}/edit)
//  4. Select "testSubmission" in the function dropdown → Run.
//     This triggers the one-time authorization prompt (Sheets access +
//     external URL access for the mail relay) — click through: Review
//     permissions → your account → Advanced → Go to [project] (unsafe)
//     → Allow. Then check the spreadsheet for a "Contact Data" tab and
//     a test row to confirm it worked.
//  5. Deploy → New deployment → Web App
//       Execute as: Me
//       Who has access: Anyone
//  6. Copy the Web App URL and paste it into src/app/services/contact.service.ts
// ═══════════════════════════════════════════════════════════════════

// ── Configuration ────────────────────────────────────────────────────
const SPREADSHEET_ID = 'REPLACE_WITH_SYNCRA_BOOKINGS_SPREADSHEET_ID'; // ← from the Sheet's URL

const NOTIFICATION_EMAILS = [
  'info@syncrabiz.com',
];

// Mail relay (Netlify Function) — same one used by syncra-bookings-gas.gs.
// See netlify/functions/send-mail.js for setup.
const MAIL_RELAY_URL    = 'https://syncrabiz.com/.netlify/functions/send-mail';
const MAIL_RELAY_SECRET = '7ef98fed67acec09ba499e291f6f5f97d34f4d13ebee55f5'; // ← must match Netlify's MAIL_RELAY_SECRET

// ── doPost: save contact submission + notify team ─────────────────────
function doPost(e) {
  try {
    var p = e.parameter;
    logDebug('Contact doPost received: ' + JSON.stringify(p));

    var name     = p.name     || '';
    var email    = p.email    || '';
    var phone    = p.phone    || '';
    var services = p.services || '';
    var message  = p.message  || '';

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Contact Data');
    if (!sheet) {
      sheet = ss.insertSheet('Contact Data');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Services', 'Message']);
      var headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange
        .setBackground('#81007F')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setFontSize(10);
      sheet.setFrozenRows(1);
    }

    var timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, name, email, phone, services, message]);
    try { sheet.autoResizeColumns(1, 6); } catch (e) {}
    logDebug('Contact doPost: row appended for ' + email);

    sendContactNotificationEmail(name, email, phone, services, message);

    return jsonResponse({ success: true });
  } catch (err) {
    logDebug('Contact doPost EXCEPTION: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Email notification (team only — no confirmation to the submitter) ──
function sendContactNotificationEmail(name, email, phone, services, message) {
  var subject = '📩 New Contact Form Submission — ' + name;

  var plainBody = [
    'New Contact Form Submission',
    '='.repeat(44),
    '',
    'Name:     ' + name,
    'Email:    ' + email,
    'Phone:    ' + (phone || '—'),
    'Services: ' + (services || '—'),
    '',
    'Message:',
    message,
    '',
    '='.repeat(44),
    'Submitted via the Syncra website "Get in Touch" form.'
  ].join('\n');

  var htmlBody = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">'

    // Header
    + '<tr><td style="background:#81007F;padding:28px 36px;">'
    + '<p style="margin:0;color:#fff;font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Syncra · Get in Touch</p>'
    + '<h1 style="margin:6px 0 0;color:#fff;font-size:1.5rem;">📩 New Contact Form Submission</h1>'
    + '</td></tr>'

    // Details
    + '<tr><td style="padding:24px 36px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + '<tr><td style="padding:7px 0;color:#888;width:30%;font-size:0.88rem;">Name</td><td style="padding:7px 0;color:#222;font-weight:600;">' + name + '</td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Email</td><td style="padding:7px 0;color:#222;"><a href="mailto:' + email + '" style="color:#81007F;">' + email + '</a></td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Phone</td><td style="padding:7px 0;color:#222;">' + (phone || '&mdash;') + '</td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Services</td><td style="padding:7px 0;color:#222;">' + (services || '&mdash;') + '</td></tr>'
    + '</table></td></tr>'

    // Message
    + '<tr><td style="padding:0 36px 24px;">'
    + '<div style="background:#f9f0f9;border-left:4px solid #81007F;border-radius:6px;padding:16px 20px;">'
    + '<p style="margin:0 0 4px;color:#81007F;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Message</p>'
    + '<p style="margin:0;color:#222;white-space:pre-wrap;">' + message + '</p>'
    + '</div></td></tr>'

    // Footer
    + '<tr><td style="background:#f8f8f8;padding:16px 36px;border-top:1px solid #eee;">'
    + '<p style="margin:0;color:#aaa;font-size:0.75rem;">Submitted via the Syncra website "Get in Touch" form.</p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  NOTIFICATION_EMAILS.forEach(function(recipient) {
    sendViaRelay(recipient, subject, plainBody, htmlBody);
  });
}

// ── Mail relay helper (same pattern as syncra-bookings-gas.gs) ─────────
function sendViaRelay(to, subject, text, html) {
  try {
    var response = UrlFetchApp.fetch(MAIL_RELAY_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Relay-Secret': MAIL_RELAY_SECRET },
      payload: JSON.stringify({ to: to, subject: subject, text: text, html: html }),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var body = response.getContentText();
    logDebug('sendViaRelay to=' + to + ' code=' + code + ' body=' + body.substring(0, 300));
    if (code !== 200) {
      Logger.log('Mail relay failed for ' + to + ': ' + code + ' ' + body);
    }
  } catch (err) {
    logDebug('sendViaRelay EXCEPTION to=' + to + ' err=' + err.message);
    Logger.log('Mail relay error for ' + to + ': ' + err.message);
  }
}

// ── Debug logging (writes to a "DebugLog" tab in the same spreadsheet) ─
function logDebug(message) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('DebugLog');
    if (!sheet) {
      sheet = ss.insertSheet('DebugLog');
      sheet.appendRow(['Timestamp', 'Message']);
    }
    sheet.appendRow([new Date().toISOString(), message]);
  } catch (e) {
    // ignore — debug logging must never break the submission
  }
}

// ── Utility ───────────────────────────────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manual test helper — run this from the Apps Script editor to trigger
 * the one-time authorization prompt and verify the flow end-to-end
 * before deploying.
 */
function testSubmission() {
  var fakeEvent = {
    parameter: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      services: 'Finance Solutions',
      message: 'This is a test message from testSubmission().'
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
