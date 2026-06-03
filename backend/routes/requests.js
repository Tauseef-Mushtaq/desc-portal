const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ServiceRequest = require('../models/ServiceRequest');
const { protect } = require('../middleware/auth');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
    res.json({ success: true, requests, total, page: Number(page), pages: Math.ceil(total / limit) });
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
    res.json({ success: true, request });
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

    const attachments = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
    }));

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

    res.status(201).json({ success: true, message: 'Request submitted successfully', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
