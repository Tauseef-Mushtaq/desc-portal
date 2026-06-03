const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, default: 'System' },
  },
  { timestamps: true }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, unique: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Applicant info (snapshot at time of submission)
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantCnic: { type: String, required: true },
    applicantPhone: { type: String, required: true },
    applicantAddress: { type: String, required: true },

    // Request details
    serviceType: {
      type: String,
      required: true,
      enum: [
        'water_supply',
        'electricity',
        'road_maintenance',
        'sewerage',
        'birth_certificate',
        'death_certificate',
        'property_tax',
        'business_license',
        'building_permit',
        'other',
      ],
    },
    serviceTypeLabel: { type: String },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    
    // Location
    district: { type: String, default: 'Mardan' },
    tehsil: { type: String, default: '' },
    village: { type: String, default: '' },

    // Status
    status: {
      type: String,
      enum: ['submitted', 'in_review', 'pending_info', 'approved', 'rejected', 'resolved'],
      default: 'submitted',
    },
    
    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedToName: { type: String, default: '' },
    
    // Admin notes
    adminNotes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },

    // Attachments
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
      },
    ],

    // Timeline
    timeline: [timelineEventSchema],
    
    // Resolved date
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate request ID
serviceRequestSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const count = await mongoose.model('ServiceRequest').countDocuments();
    const year = new Date().getFullYear();
    this.requestId = `DESC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Set service type label
  const labels = {
    water_supply: 'Water Supply',
    electricity: 'Electricity',
    road_maintenance: 'Road Maintenance',
    sewerage: 'Sewerage',
    birth_certificate: 'Birth Certificate',
    death_certificate: 'Death Certificate',
    property_tax: 'Property Tax',
    business_license: 'Business License',
    building_permit: 'Building Permit',
    other: 'Other',
  };
  this.serviceTypeLabel = labels[this.serviceType] || this.serviceType;
  
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
