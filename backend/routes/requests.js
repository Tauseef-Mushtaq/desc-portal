const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const ServiceRequest = require('../models/ServiceRequest');
const { protect } = require('../middleware/auth');
const { notifyAdmins } = require('../utils/notify');
const { uploadBuffer, withAttachmentUrls, withAttachmentUrlsMany } = require('../utils/storage');

// Files land in memory just long enough to stream straight to S3/MinIO —
// nothing touches local disk, so it doesn't matter which backend pod
// handles the upload vs. which pod later serves the download.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// @GET /api/requests - Get citizen's own requests
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = { citizen: req.user._id };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { serviceTypeLabel: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await ServiceRequest.countDocuments(query);
    const requests = await ServiceRequest.find(query)
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

// @GET /api/requests/stats - Citizen stats
router.get('/stats', protect, async (req, res) => {
  try {
    const citizenId = req.user._id;
    const [total, submitted, inReview, approved, rejected, resolved] = await Promise.all([
      ServiceRequest.countDocuments({ citizen: citizenId }),
      ServiceRequest.countDocuments({ citizen: citizenId, status: 'submitted' }),
      ServiceRequest.countDocuments({ citizen: citizenId, status: 'in_review' }),
      ServiceRequest.countDocuments({ citizen: citizenId, status: 'approved' }),
      ServiceRequest.countDocuments({ citizen: citizenId, status: 'rejected' }),
      ServiceRequest.countDocuments({ citizen: citizenId, status: 'resolved' }),
    ]);
    res.json({ success: true, stats: { total, submitted, inReview, approved, rejected, resolved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/requests/:id - Single request
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      citizen: req.user._id,
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request: await withAttachmentUrls(request) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/requests - Submit new request
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      serviceType, subject, description, priority,
      applicantCnic, applicantPhone, applicantAddress,
      district, tehsil, village,
    } = req.body;

    // requestId isn't generated until ServiceRequest.create() runs (it's set
    // in a pre-save hook), so attachments are keyed by a random folder name
    // instead — keeps uploads scoped per-submission without that ordering
    // dependency.
    const submissionId = crypto.randomUUID();
    const attachments = await Promise.all(
      (req.files || []).map(async (f) => {
        const safeName = f.originalname.replace(/\s/g, '_');
        const key = `attachments/${submissionId}/${Date.now()}-${safeName}`;
        await uploadBuffer({ buffer: f.buffer, key, contentType: f.mimetype });
        return { key, originalName: f.originalname, mimetype: f.mimetype, size: f.size };
      })
    );

    const request = await ServiceRequest.create({
      citizen: req.user._id,
      applicantName: req.user.fullName,
      applicantEmail: req.user.email,
      applicantCnic: applicantCnic || req.user.cnic || '',
      applicantPhone: applicantPhone || req.user.phone || '',
      applicantAddress: applicantAddress || req.user.address || '',
      serviceType, subject, description,
      priority: priority || 'normal',
      district: district || 'Mardan',
      tehsil, village,
      attachments,
      timeline: [{ status: 'submitted', note: 'Request submitted successfully', updatedByName: req.user.fullName }],
    });

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      request: await withAttachmentUrls(request),
    });

    // Fire-and-forget: don't make the citizen wait on notification delivery.
    notifyAdmins({
      type: 'new_request',
      title: 'New service request submitted',
      message: `${req.user.fullName} submitted a ${request.serviceTypeLabel} request (${request.requestId})`,
      link: `/admin/requests/${request._id}`,
      relatedRequest: request._id,
    }).catch((err) => console.error('notifyAdmins failed:', err.message));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/requests/:id/feedback - citizen rates a resolved request
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    const request = await ServiceRequest.findOne({ _id: req.params.id, citizen: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted once a request is resolved' });
    }
    if (request.feedback?.submittedAt) {
      return res.status(400).json({ success: false, message: 'Feedback has already been submitted for this request' });
    }

    request.feedback = { rating: ratingNum, comment: comment || '', submittedAt: new Date() };
    await request.save();

    res.json({ success: true, message: 'Thank you for your feedback', request: await withAttachmentUrls(request) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
