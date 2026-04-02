const fs = require('fs');
const path = require('path');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const normalizeEmail = (value) => `${value || ''}`.trim().toLowerCase();

const ADMIN_NAME = `${process.env.ADMIN_SEED_NAME || 'Explore Kenya Admin'}`.trim();
const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_SEED_EMAIL || 'admin@explorekenya.com');
const ADMIN_PASSWORD = `${process.env.ADMIN_SEED_PASSWORD || 'Admin123!'}`;
const ADMIN_PHONE = `${process.env.ADMIN_SEED_PHONE || ''}`.trim();

const seedAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set.');
  }

  await connectDB();

  const existingUser = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (existingUser) {
    existingUser.name = ADMIN_NAME;
    existingUser.role = 'admin';
    if (ADMIN_PHONE) {
      existingUser.phoneNumber = ADMIN_PHONE;
    }
    if (process.env.ADMIN_SEED_RESET_PASSWORD === 'true') {
      existingUser.password = ADMIN_PASSWORD;
    }

    await existingUser.save();
    console.log(`Updated admin user: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phoneNumber: ADMIN_PHONE || undefined,
      role: 'admin',
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }
};

seedAdmin()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Admin seed complete');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Admin seed failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
