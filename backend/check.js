/**
 * DESC Portal — Diagnostics Script
 * Run with: node check.js
 * Checks MongoDB connection and prints clear fix instructions.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/desc_portal';

console.log('\n🔍 DESC Portal — Connection Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MongoDB URI:', MONGO_URI);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT || 5000);
console.log('');

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('   You can now run: npm run dev');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection FAILED');
    console.error('   Error:', err.message);
    console.error('');
    console.error('🔧 Fix options:');
    console.error('   1. Start local MongoDB:');
    console.error('      Windows:  net start MongoDB');
    console.error('      macOS:    brew services start mongodb-community');
    console.error('      Linux:    sudo systemctl start mongod');
    console.error('');
    console.error('   2. OR use MongoDB Atlas (free cloud):');
    console.error('      - Go to https://cloud.mongodb.com');
    console.error('      - Create free cluster → Get connection string');
    console.error('      - Paste it as MONGODB_URI in backend/.env');
    console.error('');
    process.exit(1);
  });
