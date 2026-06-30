const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');
const { notifyComplaintRecipients } = require('../utils/notify');
const { complaintLimiter } = require('../middleware/rateLimiters');

// @GET /api/complaints/departments - so the complaint form can offer a
// "which department is this about?" dropdown. Admin-only department
// listing already exists at /api/admin/departments, but citizens can't
// reach that (it's behind adminOnly), so this is the citizen-facing twin.
router.get('/departments', protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/complaints - citizen's own complaints/feedback, newest first
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { citizen: req.user._id };
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('department', 'name icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/complaints/:id - citizen's own single complaint
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id })
      .populate('department', 'name icon')
      .populate('relatedRequest', 'requestId subject');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/complaints - file a complaint or share feedback, freely (no
// service request required) — optionally about a specific department,
// optionally referencing a request for context.
//
// complaintLimiter caps this at 8/hour per IP — the actual fix for someone
// scripting a flood of fake complaints into a department's queue. The
// validators below cap length (a 50,000-character "complaint" is either
// abuse or a mistake, either way it shouldn't reach the database) and trim
// HTML-ish content out of free text, since this text is later rendered
// back to both the citizen and admins.
router.post(
  '/',
  protect,
  complaintLimiter,
  [
    body('type').isIn(['complaint', 'feedback']).withMessage('Type must be "complaint" or "feedback"'),
    body('subject').trim().notEmpty().isLength({ max: 200 }).withMessage('Subject is required (max 200 characters)').escape(),
    body('description').trim().notEmpty().isLength({ max: 5000 }).withMessage('Description is required (max 5000 characters)').escape(),
    body('department').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid department'),
    body('relatedRequest').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid related request'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { type, subject, description, department, relatedRequest } = req.body;

      let departmentId = null;
      if (department) {
        const dept = await Department.findById(department);
        if (!dept) return res.status(400).json({ success: false, message: 'Department not found' });
        departmentId = dept._id;
      }

      const complaint = await Complaint.create({
        citizen: req.user._id,
        type,
        subject,
        description,
        department: departmentId,
        relatedRequest: relatedRequest || null,
      });

      await complaint.populate('department', 'name icon');
      res.status(201).json({ success: true, message: `Your ${type} has been submitted`, complaint });

      // Fire-and-forget: don't make the citizen wait on notification delivery.
      notifyComplaintRecipients({
        departmentId,
        type: 'general',
        title: `New ${type} submitted${departmentId ? '' : ' (general)'}`,
        message: `${req.user.fullName}: "${subject}"`,
        link: `/admin/complaints`,
      }).catch((err) => console.error('notifyComplaintRecipients failed:', err.message));
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
