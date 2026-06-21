const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');
const { withAttachmentUrls, withAttachmentUrlsMany, withAvatarUrlMany } = require('../utils/storage');

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

    // Average citizen satisfaction rating, from resolved requests that left feedback
    const ratingAgg = await ServiceRequest.aggregate([
      { $match: { 'feedback.rating': { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, ratingCount: { $sum: 1 } } },
    ]);
    const avgRating = ratingAgg[0] ? Math.round(ratingAgg[0].avgRating * 10) / 10 : null;
    const ratingCount = ratingAgg[0] ? ratingAgg[0].ratingCount : 0;

    res.json({
      success: true,
      stats: { total, submitted, inReview, pendingInfo, approved, rejected, resolved, totalCitizens, recentRequests, byServiceType, avgRating, ratingCount },
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
    res.json({
      success: true,
      requests: await withAttachmentUrlsMany(requests),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/requests/:id
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id).populate('citizen', 'fullName email phone');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request: await withAttachmentUrls(request) });
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
    res.json({ success: true, message: 'Status updated', request: await withAttachmentUrls(request) });

    const statusLabels = {
      submitted: 'Submitted', in_review: 'In Review', pending_info: 'Pending Info',
      approved: 'Approved', rejected: 'Rejected', resolved: 'Resolved',
    };
    notifyUser({
      userId: request.citizen,
      type: status === 'resolved' ? 'feedback_request' : 'status_change',
      title: `Request ${request.requestId} ${status === 'resolved' ? 'resolved' : 'updated'}`,
      message: status === 'resolved'
        ? `Your request "${request.subject}" has been resolved. We'd love your feedback!`
        : `Your request "${request.subject}" is now ${statusLabels[status] || status}.`,
      link: `/requests/${request._id}`,
      relatedRequest: request._id,
    }).catch((err) => console.error('notifyUser failed:', err.message));
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
    res.json({ success: true, request: await withAttachmentUrls(request) });
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
    res.json({ success: true, citizens: await withAvatarUrlMany(citizens), total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
