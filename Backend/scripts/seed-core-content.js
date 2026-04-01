const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Wildlife = require('../models/Wildlife');
const ChatbotKnowledge = require('../models/ChatbotKnowledge');
const defaultWildlife = require('../data/defaultWildlife');
const defaultKnowledgeBase = require('../data/defaultKnowledgeBase');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

async function seedCoreContent() {
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
    await Wildlife.deleteMany({});
    await ChatbotKnowledge.deleteMany({});

    const wildlife = await Wildlife.insertMany(defaultWildlife);
    const knowledgeBase = await ChatbotKnowledge.insertMany(defaultKnowledgeBase);

    console.log(`Seeded ${wildlife.length} wildlife records`);
    console.log(`Seeded ${knowledgeBase.length} chatbot knowledge records`);
  } finally {
    await mongoose.disconnect();
  }
}

seedCoreContent().catch((error) => {
  console.error('Core content seeding failed:', error.message);
  process.exitCode = 1;
});
