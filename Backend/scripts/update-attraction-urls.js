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

const ATTRACTION_URLS = [
  {
    name: 'Maasai Mara National Reserve',
    websiteUrl: 'https://www.maasaimara.com',
    bookingUrl: 'https://www.kws.go.ke/parks/maasai-mara-national-reserve',
  },
  {
    name: 'Amboseli National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/amboseli-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/amboseli-national-park',
  },
  {
    name: 'Tsavo East National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/tsavo-east-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/tsavo-east-national-park',
  },
  {
    name: 'Tsavo West National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/tsavo-west-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/tsavo-west-national-park',
  },
  {
    name: 'Nairobi National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/nairobi-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/nairobi-national-park',
  },
  {
    name: 'Lake Nakuru National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/lake-nakuru-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/lake-nakuru-national-park',
  },
  {
    name: 'Samburu National Reserve',
    websiteUrl: 'https://www.kws.go.ke/parks/samburu-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/parks/samburu-national-reserve',
  },
  {
    name: 'Mount Kenya National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/mount-kenya-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/mount-kenya-national-park',
  },
  {
    name: 'Aberdare National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/aberdare-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/aberdare-national-park',
  },
  {
    name: "Hell's Gate National Park",
    websiteUrl: 'https://www.kws.go.ke/parks/hells-gate-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/hells-gate-national-park',
  },
  {
    name: 'Diani Beach',
    websiteUrl: 'https://www.magicalkenya.com/destination/diani-beach',
    bookingUrl: 'https://www.magicalkenya.com/destination/diani-beach',
  },
  {
    name: 'Watamu Marine National Park',
    websiteUrl: 'https://www.kws.go.ke/parks/watamu-marine-national-park',
    bookingUrl: 'https://www.kws.go.ke/parks/watamu-marine-national-park',
  },
  {
    name: 'Mombasa Old Town',
    websiteUrl: 'https://www.museums.or.ke/fort-jesus',
    bookingUrl: 'https://www.magicalkenya.com/destination/mombasa',
  },
  {
    name: 'Lake Bogoria National Reserve',
    websiteUrl: 'https://www.kws.go.ke/parks/lake-bogoria-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/parks/lake-bogoria-national-reserve',
  },
  {
    name: 'Ol Pejeta Conservancy',
    websiteUrl: 'https://www.olpejetaconservancy.org',
    bookingUrl: 'https://www.olpejetaconservancy.org/visit',
  },
  {
    name: 'Arabuko Sokoke Forest',
    websiteUrl: 'https://www.kws.go.ke/parks/arabuko-sokoke-forest',
    bookingUrl: 'https://www.magicalkenya.com/destination/arabuko-sokoke-forest',
  },
  {
    name: 'Kakamega Forest',
    websiteUrl: 'https://www.kws.go.ke/parks/kakamega-forest',
    bookingUrl: 'https://www.kws.go.ke/parks/kakamega-forest',
  },
  {
    name: 'Lamu Old Town',
    websiteUrl: 'https://www.magicalkenya.com/destination/lamu',
    bookingUrl: 'https://www.magicalkenya.com/destination/lamu',
  },
  {
    name: 'Lake Turkana',
    websiteUrl: 'https://www.magicalkenya.com/destination/lake-turkana',
    bookingUrl: 'https://www.magicalkenya.com/destination/lake-turkana',
  },
  {
    name: 'Shimba Hills National Reserve',
    websiteUrl: 'https://www.kws.go.ke/parks/shimba-hills-national-reserve',
    bookingUrl: 'https://www.kws.go.ke/parks/shimba-hills-national-reserve',
  },
];

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
        { new: true }
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
