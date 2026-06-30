const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { initSocket } = require('./utils/socket');
const { ensureBucketExists } = require('./utils/storage');
const { ensureDepartmentsSeeded } = require('./utils/departments');
const { register, metricsMiddleware } = require('./utils/metrics');
const { globalLimiter } = require('./middleware/rateLimiters');

dotenv.config();

// Fail loudly instead of silently running with a guessable secret. The
// .env.example value is a real, public string (it's committed to the repo)
// — if it ever ends up unchanged in a real deployment, anyone can forge a
// valid login token for any user, including an admin. Better to refuse to
// start than to run "successfully" with that hole open.
const INSECURE_DEFAULTS = ['desc_portal_super_secret_jwt_key_2024', '', undefined];
if (process.env.NODE_ENV === 'production' && INSECURE_DEFAULTS.includes(process.env.JWT_SECRET)) {
  console.error('❌ JWT_SECRET is missing or still set to the example value from .env.example.');
  console.error('   Set a unique, random JWT_SECRET before running in production. Refusing to start.');
  process.exit(1);
}

const app = express();

// helmet sets a battery of standard security headers (X-Content-Type-Options,
// X-Frame-Options, a baseline Content-Security-Policy, etc.) that are
// otherwise easy to forget one-by-one.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploads/avatars are fetched cross-origin via signed URLs
}));
app.use(globalLimiter);

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Strips any key starting with "$" or containing "." from req.body/query/params
// — without this, a citizen could submit something like
// { "email": { "$ne": null } } as a login payload and bypass the intended
// query entirely (a classic NoSQL injection). Mongoose's schema typing
// blocks some of this already, but routes that build raw query objects
// from user input (search filters, etc.) are not protected by that alone.
app.use(mongoSanitize());
app.use(metricsMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Scraped by Prometheus — see k8s/monitoring/servicemonitor.yaml, which
// targets this exact port/path on every backend pod. Deliberately no auth
// here: this is only ever reached from inside the cluster (Prometheus runs
// in its own namespace), never exposed through the public Ingress.
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/complaints', require('./routes/adminComplaints'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check — useful to test if backend is alive
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DESC Portal API Running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Global error handler — catches any unhandled errors and returns JSON (not HTML)
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if mongo is unreachable
    });
    console.log('✅ MongoDB connected to:', process.env.MONGODB_URI);

    await ensureBucketExists();
    await ensureDepartmentsSeeded();
    await initSocket(server);

    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  }
};

startServer();

module.exports = app;
