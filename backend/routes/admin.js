const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Apply auth + admin middleware to all routes
router.use(protect, adminOnly);

// @GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, submitted, inReview, pendingInfo, approved, rejected, resolved, totalCitizens] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'submitted' }),
      ServiceRequest.countDocuments({ status: 'in_review' }),
      ServiceRequest.countDocuments({ status: 'pending_info' }),
      ServiceRequest.countDocuments({ status: 'approved' }),
      ServiceRequest.countDocuments({ status: 'rejected' }),
      ServiceRequest.countDocuments({ status: 'resolved' }),
      User.countDocuments({ role: 'citizen' }),
    ]);

    // By service type
    const byServiceType = await ServiceRequest.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 }, label: { $first: '$serviceTypeLabel' } } },
      { $sort: { count: -1 } },
    ]);

    // Recent 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRequests = await ServiceRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      stats: { total, submitted, inReview, pendingInfo, approved, rejected, resolved, totalCitizens, recentRequests, byServiceType },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 15 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
        { applicantCnic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await ServiceRequest.countDocuments(query);
    const requests = await ServiceRequest.find(query)
      .populate('citizen', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, requests, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/requests/:id
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id).populate('citizen', 'fullName email phone');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/requests/:id/status
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { status, adminNotes, rejectionReason } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    if (status === 'resolved') request.resolvedAt = new Date();

    request.timeline.push({
      status,
      note: adminNotes || `Status updated to ${status}`,
      updatedBy: req.user._id,
      updatedByName: req.user.fullName,
    });

    await request.save();
    res.json({ success: true, message: 'Status updated', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/requests/:id/assign
router.put('/requests/:id/assign', async (req, res) => {
  try {
    const { assignedTo, assignedToName } = req.body;
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTo, assignedToName },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/citizens
router.get('/citizens', async (req, res) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const query = { role: 'citizen' };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const citizens = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, citizens, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
