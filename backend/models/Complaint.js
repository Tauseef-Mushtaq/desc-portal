const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Same record type covers both — a citizen picks one when submitting.
    // Complaints are actionable grievances; feedback is informational and
    // doesn't necessarily need a resolution, but both go through the same
    // visibility/notification pipeline.
    type: { type: String, enum: ['complaint', 'feedback'], required: true },

    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },

    // Optional — which department this is about. Left null for general
    // feedback about the portal/DESC overall that isn't department-specific.
    // This is the actual access-control field: a department admin only
    // ever sees complaints where this matches their own department.
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },

    // Optional — a citizen can reference a specific request for context
    // (e.g. "this is about my pending water connection"), but it's never
    // required, since complaints are often about conduct/process, not a
    // specific request.
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },

    status: { type: String, enum: ['open', 'in_review', 'resolved', 'dismissed'], default: 'open' },

    // A single admin response is enough for this feature's scope — not a
    // full back-and-forth thread.
    adminResponse: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedByName: { type: String, default: '' },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ citizen: 1, createdAt: -1 });
complaintSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
