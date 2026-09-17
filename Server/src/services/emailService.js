const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT == 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  console.log('[Email] Nodemailer configured with SMTP host:', env.SMTP_HOST);
} else {
  console.log('[Email] SMTP credentials not set. Email notifications will be logged to console in dev mode.');
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html: html || text,
      });
      console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
      return info;
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${to}:`, err.message);
    }
  } else {
    // Console log fallback
    console.log(`[Mock Email] TO: ${to} | SUBJECT: ${subject}`);
    console.log(`[Mock Email Content] ${text}`);
  }
};

module.exports = {
  sendEmail,
};
