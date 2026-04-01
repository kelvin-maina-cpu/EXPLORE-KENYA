const asyncHandler = require('express-async-handler');
const Wildlife = require('../models/Wildlife');
const defaultWildlife = require('../data/defaultWildlife');

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
