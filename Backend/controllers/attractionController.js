const Attraction = require('../models/Attraction');
const asyncHandler = require('express-async-handler');
const sampleAttractions = require('../data/sampleAttractions');

// @desc    Get all attractions
// @route   GET /api/attractions
// @access  Public
const getAttractions = asyncHandler(async (req, res) => {
  const { search = '', category = '' } = req.query;
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const attractions = await Attraction.find(query).sort({ name: 1 });
  res.json(attractions);
});

// @desc    Get single attraction
// @route   GET /api/attractions/:id
// @access  Public
const getAttraction = asyncHandler(async (req, res) => {
  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }
  res.json(attraction);
});

// Sample data seeder (run once)
const seedSampleAttractions = asyncHandler(async (req, res) => {
  await Attraction.deleteMany({});

  await Attraction.insertMany(sampleAttractions);
  res.status(201).json({ message: 'Sample attractions seeded' });
});

module.exports = {
  getAttractions,
  getAttraction,
  seedSampleAttractions
};

