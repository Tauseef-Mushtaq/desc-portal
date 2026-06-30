const rateLimit = require('express-rate-limit');

// Why several limiters instead of one global one: a single citizen
// legitimately checking their request list repeatedly needs a much higher
// ceiling than someone hammering /register or /login, which are the actual
// abuse vectors worth being strict about. One blanket limit would either be
// too loose to stop spam, or too tight for normal browsing.

// Account creation — the core ask: stop someone scripting fake citizen
// accounts. 5 accounts per IP per hour is generous for a real household,
// punishing for a bot loop.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many accounts created from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login — slows down credential-stuffing / password-guessing without
// punishing someone who just mistyped their password twice.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Complaints & feedback — the other half of the actual ask. Freeform text,
// no file required, anyone logged in can submit — exactly the shape of
// endpoint someone would script to flood an admin's queue.
const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'You have submitted several complaints recently. Please wait before submitting more.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Service requests — similar shape of risk, slightly higher ceiling since
// a citizen might legitimately submit a few requests for different services
// in one sitting.
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'You have submitted several requests recently. Please wait before submitting more.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// A loose net over the entire API, mainly to blunt simple denial-of-service
// scripting rather than to police normal usage.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { registerLimiter, loginLimiter, complaintLimiter, requestLimiter, globalLimiter };
