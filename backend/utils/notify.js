const Notification = require('../models/Notification');

/**
 * Create a notification for one user and push it over their socket room
 * in real time. The DB write always happens — sockets are a nice-to-have
 * delivery channel, not the source of truth. If the user is offline, they
 * still see it next time they open the bell icon.
 */
async function notifyUser({ userId, type = 'general', title, message, link = '', relatedRequest = null }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    relatedRequest,
  });

  try {
    // Lazy require avoids a circular import (socket.js doesn't need notify.js).
    const { getIO } = require('./socket');
    getIO().to(`user:${userId}`).emit('notification:new', notification);
  } catch (err) {
    // Socket.io not initialized (e.g. running a one-off script) — DB write still succeeded.
  }

  return notification;
}

async function notifyAdmins({ type = 'general', title, message, link = '', relatedRequest = null }) {
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin' }).select('_id');
  return Promise.all(
    admins.map((admin) =>
      notifyUser({ userId: admin._id, type, title, message, link, relatedRequest })
    )
  );
}

// For complaints/feedback: notifies every super-admin (always — this is a
// grievance mechanism, the top level should always know) plus, if the
// complaint names a specific department, that department's own admins too.
// Deliberately NOT "all admins" the way notifyAdmins is — a complaint about
// the Water department has no business reaching the Energy department.
async function notifyComplaintRecipients({ departmentId, type = 'general', title, message, link = '' }) {
  const User = require('../models/User');
  const query = departmentId
    ? { role: 'admin', $or: [{ department: null }, { department: departmentId }] }
    : { role: 'admin', department: null };
  const recipients = await User.find(query).select('_id');
  return Promise.all(
    recipients.map((admin) => notifyUser({ userId: admin._id, type, title, message, link }))
  );
}

module.exports = { notifyUser, notifyAdmins, notifyComplaintRecipients };
