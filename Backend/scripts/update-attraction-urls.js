/**
 * Script to update all 20 attractions with official website URLs
 * Run with: node scripts/update-attraction-urls.js
 */

const fs = require('fs');
const path = require('path');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

const mongoose = require('mongoose');
const Attraction = require('../models/Attraction');
const { attractionLinks } = require('../data/attractionLinks');

const ATTRACTION_URLS = Object.entries(attractionLinks).map(([name, links]) => ({
  name,
  ...links,
}));

const updateAttractionUrls = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let updated = 0;
    let notFound = 0;

    for (const item of ATTRACTION_URLS) {
      const result = await Attraction.findOneAndUpdate(
        { name: { $regex: item.name, $options: 'i' } },
        {
          $set: {
            websiteUrl: item.websiteUrl,
            bookingUrl: item.bookingUrl,
          },
        },
        { returnDocument: 'after' }
      );

      if (result) {
        console.log(`Updated: ${result.name}`);
        updated += 1;
      } else {
        console.log(`Not found: ${item.name}`);
        notFound += 1;
      }
    }

    console.log(`Results: ${updated} updated, ${notFound} not found`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

updateAttractionUrls();
