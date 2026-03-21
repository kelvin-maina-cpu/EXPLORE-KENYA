const asyncHandler = require('express-async-handler');
const Wildlife = require('../models/Wildlife');

const defaultWildlife = [
  {
    speciesName: 'African Elephant',
    habitat: 'Savannah woodlands and open grasslands',
    conservationInfo: 'Protected in Kenya through anti-poaching work and habitat protection programs.',
    region: 'Maasai Mara Ecosystem',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
  },
  {
    speciesName: 'Black Rhino',
    habitat: 'Bushlands, shrublands, and protected conservancies',
    conservationInfo: 'Critically important species with ongoing conservation breeding and ranger monitoring.',
    region: 'Ol Pejeta Conservancy',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=900&q=80',
  },
  {
    speciesName: 'African Lion',
    habitat: 'Grasslands and semi-arid savannah landscapes',
    conservationInfo: 'Population recovery depends on habitat preservation and human-wildlife conflict reduction.',
    region: 'Nairobi National Park',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80',
  },
];

const ensureWildlifeSeeded = async () => {
  const count = await Wildlife.countDocuments();
  if (!count) {
    await Wildlife.insertMany(defaultWildlife);
  }
};

const getWildlife = asyncHandler(async (req, res) => {
  await ensureWildlifeSeeded();

  const { search = '', attractionName = '' } = req.query;
  const filters = [];

  if (search) {
    filters.push({
      $or: [
        { speciesName: { $regex: search, $options: 'i' } },
        { habitat: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (attractionName) {
    const keywordMatches = attractionName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 2 && !['national', 'park', 'reserve', 'the'].includes(part.toLowerCase()))
      .map((keyword) => ({ region: { $regex: keyword, $options: 'i' } }));

    filters.push({
      $or: [
        { region: { $regex: attractionName, $options: 'i' } },
        ...keywordMatches,
      ],
    });
  }

  const query = filters.length ? { $and: filters } : {};

  const wildlife = await Wildlife.find(query).sort({ speciesName: 1 });
  res.json(wildlife);
});

module.exports = {
  getWildlife,
};
