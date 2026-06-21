const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['new_request', 'status_change', 'feedback_request', 'general'],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to deep-link to, e.g. /requests/<id>
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Most common query: "give me this user's notifications, newest first"
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
