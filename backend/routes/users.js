const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder — profile management handled in /api/auth/profile
router.get('/profile', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
