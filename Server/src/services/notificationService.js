const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Dispatch an in-app notification and optional email alert
 */
const notify = async ({ recipient, title, message, type, complaintId, email }) => {
  try {
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      complaintId,
    });

    if (email) {
      sendEmail({
        to: email,
        subject: `[Hostel Portal] ${title}`,
        text: message,
      }).catch((e) => console.warn('Email dispatch warning:', e.message));
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error] Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  notify,
};
