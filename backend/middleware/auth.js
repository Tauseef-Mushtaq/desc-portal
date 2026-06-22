const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

// Department-scoped admins manage their own department's requests; only a
// super-admin (an admin with no department assigned) can create staff
// accounts or manage departments themselves.
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin' && !req.user.department) return next();
  res.status(403).json({ success: false, message: 'Super-admin access required' });
};

module.exports = { protect, adminOnly, superAdminOnly };
