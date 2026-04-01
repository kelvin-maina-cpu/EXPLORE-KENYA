const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sampleAttractions = require('../data/sampleAttractions');
const Attraction = require('../models/Attraction');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

async function seedAttractions() {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI in Backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  try {
    await Attraction.deleteMany({});
    const inserted = await Attraction.insertMany(sampleAttractions);
    console.log(`Seeded ${inserted.length} attractions`);
  } finally {
    await mongoose.disconnect();
  }
}

seedAttractions().catch((error) => {
  console.error('Attraction seeding failed:', error.message);
  process.exitCode = 1;
});
