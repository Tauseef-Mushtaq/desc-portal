const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');
const { getComplaintScopeFilter } = require('../utils/departments');

router.use(protect, adminOnly);

// @GET /api/admin/complaints
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = getComplaintScopeFilter(req.user);
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizen', 'fullName email phone')
      .populate('department', 'name icon')
      .populate('relatedRequest', 'requestId subject')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/complaints/:id
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'fullName email phone')
      .populate('department', 'name icon')
      .populate('relatedRequest', 'requestId subject');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const scope = getComplaintScopeFilter(req.user);
    if (scope.department && String(complaint.department?._id) !== String(scope.department)) {
      return res.status(403).json({ success: false, message: 'This complaint belongs to a different department' });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/complaints/:id/respond
router.put('/:id/respond', async (req, res) => {
  try {
    const { adminResponse, status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const scope = getComplaintScopeFilter(req.user);
    if (scope.department && String(complaint.department) !== String(scope.department)) {
      return res.status(403).json({ success: false, message: 'This complaint belongs to a different department' });
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse;
      complaint.respondedBy = req.user._id;
      complaint.respondedByName = req.user.fullName;
      complaint.respondedAt = new Date();
    }
    if (status) complaint.status = status;
    await complaint.save();
    await complaint.populate(['department', 'relatedRequest']);

    res.json({ success: true, message: 'Response saved', complaint });

    notifyUser({
      userId: complaint.citizen,
      type: 'general',
      title: `Your ${complaint.type} has been updated`,
      message: adminResponse
        ? `A response was added to "${complaint.subject}"`
        : `"${complaint.subject}" is now ${status?.replace('_', ' ')}`,
      link: `/complaints/${complaint._id}`,
    }).catch((err) => console.error('notifyUser failed:', err.message));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
