const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Department = require('../models/Department');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');
const { withAttachmentUrls, withAttachmentUrlsMany, withAvatarUrlMany } = require('../utils/storage');
const { withDepartment, withDepartmentMany, getScopeFilter, isServiceTypeInScope } = require('../utils/departments');

// Apply auth + admin middleware to all routes
router.use(protect, adminOnly);

// @GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const scope = await getScopeFilter(req.user);

    const [total, submitted, inReview, pendingInfo, approved, rejected, resolved, totalCitizens] = await Promise.all([
      ServiceRequest.countDocuments(scope),
      ServiceRequest.countDocuments({ ...scope, status: 'submitted' }),
      ServiceRequest.countDocuments({ ...scope, status: 'in_review' }),
      ServiceRequest.countDocuments({ ...scope, status: 'pending_info' }),
      ServiceRequest.countDocuments({ ...scope, status: 'approved' }),
      ServiceRequest.countDocuments({ ...scope, status: 'rejected' }),
      ServiceRequest.countDocuments({ ...scope, status: 'resolved' }),
      User.countDocuments({ role: 'citizen' }), // citizen count isn't department-specific
    ]);

    // By service type
    const byServiceType = await ServiceRequest.aggregate([
      { $match: scope },
      { $group: { _id: '$serviceType', count: { $sum: 1 }, label: { $first: '$serviceTypeLabel' } } },
      { $sort: { count: -1 } },
    ]);

    // Recent 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRequests = await ServiceRequest.countDocuments({ ...scope, createdAt: { $gte: sevenDaysAgo } });

    // Daily request volume for the last 30 days, zero-filled so the chart's
    // x-axis has a consistent day-by-day spacing instead of gaps on days
    // with no submissions. Built with UTC-explicit date math throughout —
    // MongoDB's $dateToString groups in UTC by default, so using local-time
    // setters here could shift every key by a day depending on the server's
    // timezone, silently misaligning the zero-fill with the real data.
    const THIRTY_DAYS = 30;
    const today = new Date();
    const trendStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (THIRTY_DAYS - 1)));

    const dailyAgg = await ServiceRequest.aggregate([
      { $match: { ...scope, createdAt: { $gte: trendStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const dailyMap = Object.fromEntries(dailyAgg.map((d) => [d._id, d.count]));
    const dailyTrend = [];
    for (let i = 0; i < THIRTY_DAYS; i++) {
      const d = new Date(trendStart);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, count: dailyMap[key] || 0 });
    }

    // Average citizen satisfaction rating, from resolved requests that left feedback
    const ratingAgg = await ServiceRequest.aggregate([
      { $match: { ...scope, 'feedback.rating': { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, ratingCount: { $sum: 1 } } },
    ]);
    const avgRating = ratingAgg[0] ? Math.round(ratingAgg[0].avgRating * 10) / 10 : null;
    const ratingCount = ratingAgg[0] ? ratingAgg[0].ratingCount : 0;

    const department = req.user.department ? await Department.findById(req.user.department) : null;

    res.json({
      success: true,
      department, // null for super-admins — frontend uses this to label the dashboard
      stats: { total, submitted, inReview, pendingInfo, approved, rejected, resolved, totalCitizens, recentRequests, byServiceType, dailyTrend, avgRating, ratingCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 15 } = req.query;
    const query = await getScopeFilter(req.user);
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
      requests: await withDepartmentMany(await withAttachmentUrlsMany(requests)),
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

    const scope = await getScopeFilter(req.user);
    if (!isServiceTypeInScope(scope, request.serviceType)) {
      return res.status(403).json({ success: false, message: 'This request belongs to a different department' });
    }

    res.json({ success: true, request: await withDepartment(await withAttachmentUrls(request)) });
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

    const scope = await getScopeFilter(req.user);
    if (!isServiceTypeInScope(scope, request.serviceType)) {
      return res.status(403).json({ success: false, message: 'This request belongs to a different department' });
    }

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
    res.json({ success: true, message: 'Status updated', request: await withDepartment(await withAttachmentUrls(request)) });

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
    const existing = await ServiceRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });

    const scope = await getScopeFilter(req.user);
    if (!isServiceTypeInScope(scope, existing.serviceType)) {
      return res.status(403).json({ success: false, message: 'This request belongs to a different department' });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTo, assignedToName },
      { new: true }
    );
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

// @GET /api/admin/departments - any admin can see the department list (for context, dropdowns)
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/staff - super-admin only: roster of every admin account + their department
router.get('/staff', superAdminOnly, async (req, res) => {
  try {
    const staff = await User.find({ role: 'admin' }).populate('department', 'name icon').sort({ createdAt: -1 });
    res.json({ success: true, staff: await withAvatarUrlMany(staff) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/admin/staff - super-admin only: create a new department-scoped admin account.
// Regular citizen registration (POST /api/auth/register) can never create an
// admin account — staff accounts only ever come from here, deliberately.
router.post('/staff', superAdminOnly, async (req, res) => {
  try {
    const { fullName, email, password, department, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    if (department) {
      const dept = await Department.findById(department);
      if (!dept) return res.status(400).json({ success: false, message: 'Department not found' });
    }

    const staffMember = await User.create({
      fullName,
      email,
      password,
      phone: phone || '',
      role: 'admin',
      department: department || null, // no department -> this new account is also a super-admin
    });

    res.status(201).json({ success: true, message: 'Staff account created', staff: staffMember });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/staff/:id - super-admin only: reassign department or activate/deactivate
router.put('/staff/:id', superAdminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own department or deactivate your own account' });
    }

    const { department, isActive } = req.body;
    const update = {};
    if (department !== undefined) update.department = department || null;
    if (isActive !== undefined) update.isActive = isActive;

    const staffMember = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'admin' },
      update,
      { new: true }
    ).populate('department', 'name icon');
    if (!staffMember) return res.status(404).json({ success: false, message: 'Staff account not found' });

    res.json({ success: true, staff: staffMember });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
