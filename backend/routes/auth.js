const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadBuffer, deleteObject, withAvatarUrl } = require('../utils/storage');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiters');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Avatars get a tight size/type limit — these are small profile pictures,
// not document attachments, so 2MB and images-only is plenty. Like request
// attachments, they go straight to S3/MinIO via memory storage, not local
// disk, so they're reachable no matter which backend pod a request lands on.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
  },
});

// @POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { fullName, email, password, cnic, phone, address } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

      const user = await User.create({ fullName, email, password, cnic, phone, address });
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token: generateToken(user._id),
        user,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// @POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).populate('department', 'name icon');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }
      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(user._id),
        user: await withAvatarUrl(user),
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  await req.user.populate('department', 'name icon');
  res.json({ success: true, user: await withAvatarUrl(req.user) });
});

// @PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, phone, address, cnic, city, province } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, address, cnic, city, province },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: await withAvatarUrl(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/avatar - upload/replace profile picture
router.post('/avatar', protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

    const oldAvatarKey = req.user.avatar; // the key persisted in Mongo, not a signed URL
    const ext = req.file.originalname.includes('.') ? `.${req.file.originalname.split('.').pop().toLowerCase()}` : '';
    const key = `avatars/${req.user._id}-${Date.now()}${ext}`;
    await uploadBuffer({ buffer: req.file.buffer, key, contentType: req.file.mimetype });

    const user = await User.findByIdAndUpdate(req.user._id, { avatar: key }, { new: true });
    deleteObject(oldAvatarKey).catch(() => {}); // best-effort cleanup, don't block the response on it

    res.json({ success: true, message: 'Avatar updated successfully', user: await withAvatarUrl(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/auth/avatar - remove profile picture, fall back to initials
router.delete('/avatar', protect, async (req, res) => {
  try {
    const oldAvatarKey = req.user.avatar;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: '' }, { new: true });
    deleteObject(oldAvatarKey).catch(() => {});
    res.json({ success: true, message: 'Avatar removed', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
