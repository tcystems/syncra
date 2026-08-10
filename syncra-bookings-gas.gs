// ═══════════════════════════════════════════════════════════════════
//  Syncra Bookings — Google Apps Script
//  Separate from the blog script. Deploy as a NEW Web App.
//
//  SETUP STEPS:
//  1. Create a new Google Sheet (name it "Syncra Bookings" or anything)
//  2. Go to Extensions → Apps Script
//  3. Paste this entire file replacing the default Code.gs
//  4. Run setupSheets() once manually to create tabs + headers
//  5. Deploy → New deployment → Web App
//       Execute as: Me
//       Who has access: Anyone
//  6. Copy the Web App URL and paste it into booking.service.ts
//  7. Deploy netlify/functions/send-mail.js (see that file's setup comment),
//     then update MAIL_RELAY_URL and MAIL_RELAY_SECRET below to match.
// ═══════════════════════════════════════════════════════════════════

// ── Configuration ────────────────────────────────────────────────────
// Email addresses that receive booking notifications.
// Add as many as needed. First one is temporary for testing.
const NOTIFICATION_EMAILS = [
  'info@syncrabiz.com',
  // 'your-official-syncra-email@syncra.com',   // ← Add production email here
];

// Mail relay (Netlify Function) — sends via the authorized mail server
// (mail.thinkcube.lk / info@syncrabiz.com) instead of MailApp, which was
// landing in customers' spam folders. See netlify/functions/send-mail.js.
const MAIL_RELAY_URL    = 'https://syncrabiz.com/.netlify/functions/send-mail'; // ← Replace with your live Netlify URL
const MAIL_RELAY_SECRET = '7ef98fed67acec09ba499e291f6f5f97d34f4d13ebee55f5';                     // ← Must match MAIL_RELAY_SECRET in Netlify

// Sheet tab names — one per form
const TABS = ['Syncra Demo', 'Claude MD', 'Cyclone RCM', 'Sumxio'];

// Column headers for every tab
const HEADERS = [
  'Timestamp',
  'Date',
  'Day',
  'Timezone',
  'Time Slot (US)',
  'Time Slot (IST – Sri Lanka)',
  'Services / Product',
  'Company',
  'Email',
  'Phone'
];

// ── Timezone & DST helpers ────────────────────────────────────────────

/**
 * Returns true if the given date falls within US Daylight Saving Time.
 * DST: 2nd Sunday of March → 1st Sunday of November
 */
function isUSDST(date) {
  var year = date.getFullYear();
  var dstStart = getNthSundayOf(year, 2, 2);   // March (month index 2), 2nd Sunday
  var dstEnd   = getNthSundayOf(year, 10, 1);  // November (month index 10), 1st Sunday
  return date >= dstStart && date < dstEnd;
}

/**
 * Returns the date of the Nth Sunday in a given month/year.
 * month is 0-indexed (March = 2, November = 10).
 */
function getNthSundayOf(year, month, n) {
  var firstDay = new Date(year, month, 1);
  var dayOfWeek = firstDay.getDay(); // 0 = Sunday
  var firstSunday = new Date(year, month, 1 + (7 - dayOfWeek) % 7);
  return new Date(year, month, firstSunday.getDate() + (n - 1) * 7);
}

/**
 * Returns the UTC offset (in decimal hours) for a given US timezone abbreviation.
 * e.g., 'ET' in standard time → -5, in DST → -4
 */
function getUTCOffset(tzAbbr, date) {
  var dst = isUSDST(date);
  var offsets = {
    'ET':  dst ? -4 : -5,
    'CT':  dst ? -5 : -6,
    'MT':  dst ? -6 : -7,
    'PT':  dst ? -7 : -8,
    'AKT': dst ? -8 : -9,
    'HT':  -10   // Hawaii never observes DST
  };
  return (offsets[tzAbbr] !== undefined) ? offsets[tzAbbr] : -5;
}

/**
 * Adds a decimal number of hours to a 12-hour time string.
 * e.g., addHoursTo12h("9:00 AM", 10.5) → "7:30 PM"
 */
function addHoursTo12h(timeStr, hoursToAdd) {
  var match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr;

  var h = parseInt(match[1], 10);
  var m = parseInt(match[2], 10);
  var meridiem = match[3].toUpperCase();

  // Convert to 24-hour
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;

  // Add hours (supports fractional like 10.5 for +5:30)
  var totalMinutes = h * 60 + m + Math.round(hoursToAdd * 60);
  // Normalise to 0–1439 (handle day overflow/underflow)
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  var newH = Math.floor(totalMinutes / 60);
  var newM = totalMinutes % 60;

  var newMeridiem = newH >= 12 ? 'PM' : 'AM';
  var displayH = newH % 12;
  if (displayH === 0) displayH = 12;

  return displayH + ':' + (newM < 10 ? '0' : '') + newM + ' ' + newMeridiem;
}

/**
 * Converts a raw US time slot label to IST.
 * rawSlot: "9:00 AM – 10:00 AM"  (en-dash)
 * tzAbbr:  "ET"
 * dateStr: "2026-05-28"
 * Returns: { us: "9:00 AM – 10:00 AM ET (Eastern Time)", ist: "7:30 PM – 8:30 PM IST (Sri Lanka)" }
 */
function convertSlotToIST(rawSlot, tzAbbr, dateStr) {
  // Split on en-dash (–) or hyphen (-)
  var parts = rawSlot.split('–').map(function(s) { return s.trim(); });
  if (parts.length < 2) {
    return { us: rawSlot + ' ' + tzAbbr, ist: 'N/A' };
  }

  var startStr = parts[0];
  var endStr   = parts[1];

  // Use noon UTC of the booking date to avoid date-boundary issues when computing DST
  var bookingDate = new Date(dateStr + 'T12:00:00Z');

  var utcOffset = getUTCOffset(tzAbbr, bookingDate); // e.g. -7 for PT (DST)
  var istOffset = 5.5;                                // UTC+5:30
  var diff = istOffset - utcOffset;                   // e.g. 5.5 - (-7) = 12.5

  var tzFullNames = {
    'ET':  'Eastern Time',
    'CT':  'Central Time',
    'MT':  'Mountain Time',
    'PT':  'Pacific Time',
    'AKT': 'Alaska Time',
    'HT':  'Hawaii Time'
  };

  var istStart = addHoursTo12h(startStr, diff);
  var istEnd   = addHoursTo12h(endStr,   diff);

  return {
    us:  rawSlot + ' ' + tzAbbr + ' (' + (tzFullNames[tzAbbr] || tzAbbr) + ')',
    ist: istStart + ' \u2013 ' + istEnd + ' IST (Sri Lanka)'
  };
}

// ── doGet: return booked slot labels for a given date ─────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'getSlots') {
      var date = e.parameter.date;
      var tz   = e.parameter.timezone || 'ET';
      return jsonResponse({ date: date, bookedSlots: getBookedSlotsList(date, tz) });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

/**
 * Helper: returns a list of booked raw slots across all tabs for a given date,
 * accurately shifted into the requested timezone.
 */
function getBookedSlotsList(dateStr, requestedTz) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bookedSet = {};
  
  // Use noon UTC to avoid date-boundary issues when getting DST offset
  var bookingDate = new Date(dateStr + 'T12:00:00Z');
  var requestedOffset = getUTCOffset(requestedTz, bookingDate);

  TABS.forEach(function(tabName) {
    try {
      var sheet = ss.getSheetByName(tabName);
      if (!sheet || sheet.getLastRow() < 2) return;

      var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
      data.forEach(function(row) {
        var rowDate = row[1]; // Column B: Date

        // Handle Google Sheets auto-converting string to Date object
        var rowDateStr = "";
        if (rowDate instanceof Date) {
          var y = rowDate.getFullYear();
          var m = rowDate.getMonth() + 1;
          var d = rowDate.getDate();
          rowDateStr = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
        } else {
          rowDateStr = String(rowDate).trim();
        }

        var tzAbbr = row[3];  // Column D: Timezone (e.g. 'PT')
        var usSlot = row[4];  // Column E: Time Slot (US)
        
        if (rowDateStr === dateStr && usSlot && tzAbbr) {
          var originalOffset = getUTCOffset(tzAbbr, bookingDate);
          var diffHours = requestedOffset - originalOffset;

          // Strip timezone suffix to get raw label
          var raw = usSlot.replace(/\s+(ET|CT|MT|PT|AKT|HT)\b.*$/, '').trim();

          if (diffHours === 0) {
            bookedSet[raw] = true;
          } else {
            // Shift the start and end times by the difference
            // Split flexibly on hyphen or en-dash
            var parts = raw.split(/\s*[-–]\s*/);
            if (parts.length === 2) {
              var newStart = addHoursTo12h(parts[0], diffHours);
              var newEnd   = addHoursTo12h(parts[1], diffHours);
              // Rejoin using en-dash to match Angular frontend
              bookedSet[newStart + ' \u2013 ' + newEnd] = true;
            }
          }
        }
      });
    } catch (err) {
      // Tab might not exist yet — ignore
    }
  });

  return Object.keys(bookedSet);
}

// ── doPost: save booking + send email ────────────────────────────────

function doPost(e) {
  try {
    var p        = e.parameter;
    var formName = p.formName  || 'Syncra Demo';
    var date     = p.date      || '';
    var tzAbbr   = p.timezone  || 'ET';
    var rawSlot  = p.timeSlot  || '';
    var services = p.services  || p.product || formName;
    var company  = p.company   || '';
    var email    = p.email     || '';
    var phone    = p.phone     || '';

    // Backend duplicate check: if already booked, reject
    var alreadyBooked = getBookedSlotsList(date, tzAbbr);
    if (alreadyBooked.indexOf(rawSlot.trim()) !== -1) {
      return jsonResponse({ success: false, error: 'Slot already booked' });
    }

    // Convert US slot to IST
    var times = convertSlotToIST(rawSlot, tzAbbr, date);

    // Friendly day name for the date
    var bookingDate = new Date(date + 'T12:00:00Z');
    var dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
    var prettyDate = bookingDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Ensure the correct tab exists and has headers
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(formName);
    if (!sheet) {
      sheet = ss.insertSheet(formName);
      applyHeaders(sheet);
    }

    // Append the booking row
    var timestamp = new Date().toISOString();
    sheet.appendRow([
      timestamp,
      date,
      dayName,
      tzAbbr,
      times.us,
      times.ist,
      services,
      company,
      email,
      phone
    ]);

    // Auto-resize columns for readability
    try { sheet.autoResizeColumns(1, HEADERS.length); } catch(e) {}

    // Send notification email (to Syncra team)
    sendNotificationEmail(formName, prettyDate, dayName, times, services, company, email, phone);

    // Send confirmation email (to the customer)
    if (email) {
      sendCustomerConfirmationEmail(email, formName, prettyDate, dayName, times, services, company);
    }

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Email notification ────────────────────────────────────────────────

function sendNotificationEmail(formName, prettyDate, dayName, times, services, company, email, phone) {
  var subject = '\uD83D\uDCC5 New Demo Booking \u2014 ' + formName;

  // Plain-text fallback
  var plainBody = [
    'New Demo Booking \u2014 ' + formName,
    '='.repeat(44),
    '',
    'Date:     ' + prettyDate + ' (' + dayName + ')',
    '',
    '\uD83C\uDDFA\uD83C\uDDF8 Booked time (US):   ' + times.us,
    '\uD83C\uDDF1\uD83C\uDDF0 Your time   (IST):  ' + times.ist,
    '',
    'Service / Product:  ' + services,
    '',
    'Customer Details',
    '-'.repeat(24),
    'Company: ' + (company || '\u2014'),
    'Email:   ' + email,
    'Phone:   ' + (phone || '\u2014'),
    '',
    '='.repeat(44),
    'Submitted via the Syncra website booking form.'
  ].join('\n');

  // Rich HTML email
  var htmlBody = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">'

    // Header
    + '<tr><td style="background:#81007F;padding:28px 36px;">'
    + '<p style="margin:0;color:#fff;font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Syncra · Demo Booking</p>'
    + '<h1 style="margin:6px 0 0;color:#fff;font-size:1.5rem;">\uD83D\uDCC5 ' + formName + '</h1>'
    + '</td></tr>'

    // Date banner
    + '<tr><td style="padding:24px 36px 0;">'
    + '<div style="background:#f9f0f9;border-left:4px solid #81007F;border-radius:6px;padding:16px 20px;">'
    + '<p style="margin:0 0 2px;color:#81007F;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Booking Date</p>'
    + '<p style="margin:0;font-size:1.15rem;font-weight:700;color:#222;">' + prettyDate + ' &middot; ' + dayName + '</p>'
    + '</div></td></tr>'

    // Time block
    + '<tr><td style="padding:20px 36px 0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;">'
    + '<tr style="background:#fff8fe;">'
    + '<td style="padding:14px 18px;font-size:0.82rem;color:#666;border-bottom:1px solid #f0e4f0;">\uD83C\uDDFA\uD83C\uDDF8&nbsp; Booked time (US)</td>'
    + '<td style="padding:14px 18px;font-weight:700;color:#333;border-bottom:1px solid #f0e4f0;">' + times.us + '</td>'
    + '</tr>'
    + '<tr style="background:#f0fff0;">'
    + '<td style="padding:14px 18px;font-size:0.82rem;color:#666;">\uD83C\uDDF1\uD83C\uDDF0&nbsp; <strong>Your time (IST)</strong></td>'
    + '<td style="padding:14px 18px;font-weight:700;color:#1a7a1a;font-size:1.05rem;">' + times.ist + '</td>'
    + '</tr>'
    + '</table></td></tr>'

    // Customer details
    + '<tr><td style="padding:24px 36px;">'
    + '<h3 style="margin:0 0 14px;color:#81007F;font-size:0.95rem;text-transform:uppercase;letter-spacing:1px;">Customer Details</h3>'
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + '<tr><td style="padding:7px 0;color:#888;width:38%;font-size:0.88rem;">Service / Product</td><td style="padding:7px 0;color:#222;font-weight:600;">' + services + '</td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Company</td><td style="padding:7px 0;color:#222;">' + (company || '&mdash;') + '</td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Email</td><td style="padding:7px 0;color:#222;"><a href="mailto:' + email + '" style="color:#81007F;">' + email + '</a></td></tr>'
    + '<tr><td style="padding:7px 0;color:#888;font-size:0.88rem;">Phone</td><td style="padding:7px 0;color:#222;">' + (phone || '&mdash;') + '</td></tr>'
    + '</table></td></tr>'

    // Footer
    + '<tr><td style="background:#f8f8f8;padding:16px 36px;border-top:1px solid #eee;">'
    + '<p style="margin:0;color:#aaa;font-size:0.75rem;">This notification was sent automatically from the Syncra website booking form.</p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  NOTIFICATION_EMAILS.forEach(function(recipient) {
    sendViaRelay(recipient, subject, plainBody, htmlBody);
  });
}

// ── Mail relay helper ──────────────────────────────────────────────────
/**
 * Sends an email via the Netlify mail-relay function, which authenticates
 * to the authorized mail server (mail.thinkcube.lk / info@syncrabiz.com)
 * over SMTP. Replaces MailApp.sendEmail, which was landing in spam because
 * it sent from a Google account with no SPF/DKIM alignment to our domain.
 */
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
    logDebug('sendViaRelay EXCEPTION to=' + to + ' err=' + err.message + ' url=' + MAIL_RELAY_URL);
    Logger.log('Mail relay error for ' + to + ': ' + err.message);
  }
}

// ── Debug logging (writes to a "DebugLog" sheet tab, since Executions
//    logs in the Apps Script UI can be slow/unreliable to view) ────────
function logDebug(message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('DebugLog');
    if (!sheet) {
      sheet = ss.insertSheet('DebugLog');
      sheet.appendRow(['Timestamp', 'Message']);
    }
    sheet.appendRow([new Date().toISOString(), message]);
  } catch (e) {
    // ignore — debug logging must never break the booking flow
  }
}

// ── Email confirmation (to customer) ────────────────────────────────────

function sendCustomerConfirmationEmail(toEmail, formName, prettyDate, dayName, times, services, company) {
  var subject = '✅ Your ' + formName + ' Booking is Confirmed — Syncra';

  // Plain-text fallback
  var plainBody = [
    'Your booking is confirmed!',
    '='.repeat(44),
    '',
    'Thank you for booking a ' + formName + ' session with Syncra.',
    '',
    'Date:     ' + prettyDate + ' (' + dayName + ')',
    '',
    '🇺🇸 Your time:  ' + times.us,
    '🇱🇰 IST time:   ' + times.ist,
    '',
    'Service / Product:  ' + services,
    (company ? 'Company:            ' + company : ''),
    '',
    '='.repeat(44),
    'If you need to reschedule or have any questions, just reply to this email.',
    '',
    '— The Syncra Team'
  ].filter(function(line) { return line !== ''; }).join('\n');

  // Rich HTML email
  var htmlBody = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">'

    // Header
    + '<tr><td style="background:#81007F;padding:28px 36px;">'
    + '<p style="margin:0;color:#fff;font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Syncra · Booking Confirmed</p>'
    + '<h1 style="margin:6px 0 0;color:#fff;font-size:1.5rem;">✅ ' + formName + '</h1>'
    + '</td></tr>'

    // Intro
    + '<tr><td style="padding:24px 36px 0;">'
    + '<p style="margin:0;font-size:0.95rem;color:#333;">Hi' + (company ? ' from ' + company : '') + ', thanks for booking a ' + formName + ' session with us — we look forward to speaking with you.</p>'
    + '</td></tr>'

    // Date banner
    + '<tr><td style="padding:20px 36px 0;">'
    + '<div style="background:#f9f0f9;border-left:4px solid #81007F;border-radius:6px;padding:16px 20px;">'
    + '<p style="margin:0 0 2px;color:#81007F;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Booking Date</p>'
    + '<p style="margin:0;font-size:1.15rem;font-weight:700;color:#222;">' + prettyDate + ' &middot; ' + dayName + '</p>'
    + '</div></td></tr>'

    // Time block
    + '<tr><td style="padding:20px 36px 0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;">'
    + '<tr style="background:#fff8fe;">'
    + '<td style="padding:14px 18px;font-size:0.82rem;color:#666;border-bottom:1px solid #f0e4f0;">🇺🇸&nbsp; Your time</td>'
    + '<td style="padding:14px 18px;font-weight:700;color:#333;border-bottom:1px solid #f0e4f0;">' + times.us + '</td>'
    + '</tr>'
    + '<tr style="background:#f0fff0;">'
    + '<td style="padding:14px 18px;font-size:0.82rem;color:#666;">🇱🇰&nbsp; <strong>IST time</strong></td>'
    + '<td style="padding:14px 18px;font-weight:700;color:#1a7a1a;font-size:1.05rem;">' + times.ist + '</td>'
    + '</tr>'
    + '</table></td></tr>'

    // Service
    + '<tr><td style="padding:24px 36px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + '<tr><td style="padding:7px 0;color:#888;width:38%;font-size:0.88rem;">Service / Product</td><td style="padding:7px 0;color:#222;font-weight:600;">' + services + '</td></tr>'
    + '</table></td></tr>'

    // Footer
    + '<tr><td style="background:#f8f8f8;padding:16px 36px;border-top:1px solid #eee;">'
    + '<p style="margin:0;color:#aaa;font-size:0.75rem;">Need to reschedule or have a question? Just reply to this email.</p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  sendViaRelay(toEmail, subject, plainBody, htmlBody);
}

/**
 * Manual test helper — run this from the Apps Script editor (not
 * sendCustomerConfirmationEmail directly, which needs real arguments).
 * Update testEmail below to your own inbox before running.
 */
function testSendCustomerConfirmationEmail() {
  var testEmail = 'your-test-address@example.com';
  sendCustomerConfirmationEmail(
    testEmail,
    'Syncra Demo',
    'May 28, 2026',
    'Thursday',
    { us: '9:00 AM – 10:00 AM ET (Eastern Time)', ist: '6:30 PM – 7:30 PM IST (Sri Lanka)' },
    'Syncra Demo',
    'Test Company'
  );
}

// ── Utility ───────────────────────────────────────────────────────────

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function applyHeaders(sheet) {
  sheet.appendRow(HEADERS);
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setBackground('#81007F')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(10);
  sheet.setFrozenRows(1);
}

/**
 * Run this ONCE manually from the Apps Script editor after pasting:
 * Extensions → Apps Script → Run → setupSheets
 * This creates all 4 tabs with headers and branded colours.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  TABS.forEach(function(tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    if (sheet.getLastRow() === 0) {
      applyHeaders(sheet);
    }
  });
  Logger.log('Setup complete. Tabs: ' + TABS.join(', '));
}
