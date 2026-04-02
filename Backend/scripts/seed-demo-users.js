const fs = require('fs');
const path = require('path');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const users = [
  {
    role: 'admin',
    name: process.env.DEMO_ADMIN_NAME || 'Dashboard Admin',
    email: (process.env.DEMO_ADMIN_EMAIL || 'admin@explorekenya.com').trim().toLowerCase(),
    password: process.env.DEMO_ADMIN_PASSWORD || 'Admin123!',
    phoneNumber: process.env.DEMO_ADMIN_PHONE || '0700000001',
  },
  {
    role: 'user',
    name: process.env.DEMO_USER_NAME || 'Demo Traveler',
    email: (process.env.DEMO_USER_EMAIL || 'traveler@explorekenya.com').trim().toLowerCase(),
    password: process.env.DEMO_USER_PASSWORD || 'User123!',
    phoneNumber: process.env.DEMO_USER_PHONE || '0700000002',
  },
];

const upsertUser = async (entry) => {
  const existing = await User.findOne({ email: entry.email }).select('+password');

  if (existing) {
    existing.name = entry.name;
    existing.role = entry.role;
    existing.phoneNumber = entry.phoneNumber;

    if (process.env.DEMO_USERS_RESET_PASSWORD === 'true') {
      existing.password = entry.password;
    }

    await existing.save();
    console.log(`Updated ${entry.role}: ${entry.email}`);
    return;
  }

  await User.create(entry);
  console.log(`Created ${entry.role}: ${entry.email}`);
};

const run = async () => {
  await connectDB();

  for (const entry of users) {
    await upsertUser(entry);
  }
};

run()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Demo user seed complete');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Demo user seed failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
