const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { initSocket } = require('./utils/socket');
const { ensureBucketExists } = require('./utils/storage');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
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
