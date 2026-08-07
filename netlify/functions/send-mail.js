// ═══════════════════════════════════════════════════════════════════
//  Syncra — Mail Relay (Netlify Function)
//
//  Generic SMTP relay used by syncra-bookings-gas.gs to send booking
//  notification/confirmation emails through the authorized mail
//  server (mail.thinkcube.lk / info@syncrabiz.com) instead of GAS's
//  MailApp, which was landing in customers' spam folders.
//
//  SETUP:
//  1. Run `npm install` locally (adds nodemailer to package.json).
//  2. In the Netlify dashboard → Site settings → Environment variables,
//     add:
//       SMTP_HOST         mail.thinkcube.lk
//       SMTP_PORT         587                 (or 465 — see note below)
//       SMTP_SECURE       false               ("true" only if using port 465)
//       SMTP_USER         info@syncrabiz.com
//       SMTP_PASS         <the mailbox password>
//       SMTP_FROM         info@syncrabiz.com  (optional, defaults to SMTP_USER)
//       MAIL_RELAY_SECRET <a long random string — also pasted into the .gs file>
//  3. Redeploy. This function is then reachable at:
//       https://<your-site>.netlify.app/.netlify/functions/send-mail
//     Copy that URL into MAIL_RELAY_URL in syncra-bookings-gas.gs.
//
//  Port note: try 587 (STARTTLS) first. If the mail server rejects it,
//  switch SMTP_PORT to 465 and SMTP_SECURE to "true" (implicit TLS).
// ═══════════════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const providedSecret = event.headers['x-relay-secret'] || event.headers['X-Relay-Secret'];
    if (!process.env.MAIL_RELAY_SECRET || providedSecret !== process.env.MAIL_RELAY_SECRET) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (err) {
      return { statusCode: 400, body: 'Invalid JSON body' };
    }

    const { to, subject, text, html } = payload;
    if (!to || !subject || (!text && !html)) {
      return { statusCode: 400, body: 'Missing required fields: to, subject, and text or html' };
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('send-mail: missing SMTP_HOST/SMTP_USER/SMTP_PASS env vars');
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Mail relay is not configured' }) };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('send-mail error:', err && err.stack ? err.stack : err);
    return { statusCode: 502, body: JSON.stringify({ success: false, error: err.message || String(err) }) };
  }
};
