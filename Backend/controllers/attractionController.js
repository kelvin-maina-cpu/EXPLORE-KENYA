const Attraction = require('../models/Attraction');
const asyncHandler = require('express-async-handler');

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
  
  const sampleAttractions = [
  // NATIONAL RESERVES
  {
    name: 'Maasai Mara National Reserve',
    location: { type: 'Point', coordinates: [35.14, -1.48] },
    description: 'World-famous for the Great Migration of wildebeest and zebras. Home to the Big Five.',
    images: [],
    category: 'wildlife',
    county: 'Narok',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Great Migration', 'Big Five', 'Maasai culture', 'Hot air balloon'],
    isActive: true
  },
  {
    name: 'Amboseli National Park',
    location: { type: 'Point', coordinates: [37.25, -2.65] },
    description: 'Famous for large elephant herds and stunning views of Mount Kilimanjaro.',
    images: [],
    category: 'wildlife',
    county: 'Kajiado',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Elephant herds', 'Mt Kilimanjaro views', 'Bird watching'],
    isActive: true
  },
  {
    name: 'Tsavo East National Park',
    location: { type: 'Point', coordinates: [38.57, -2.97] },
    description: 'One of the largest parks in the world. Known for red elephants and diverse wildlife.',
    images: [],
    category: 'wildlife',
    county: 'Taita-Taveta',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Red elephants', 'Lugard Falls', 'Galana River'],
    isActive: true
  },
  {
    name: 'Tsavo West National Park',
    location: { type: 'Point', coordinates: [37.59, -3.38] },
    description: 'Volcanic landscapes, natural springs and diverse ecosystems.',
    images: [],
    category: 'wildlife',
    county: 'Taita-Taveta',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Mzima Springs', 'Shetani Lava Flow', 'Hippos'],
    isActive: true
  },
  {
    name: 'Nairobi National Park',
    location: { type: 'Point', coordinates: [36.82, -1.35] },
    description: 'Unique urban wildlife park with Big Five sightings against Nairobi skyline.',
    images: [],
    category: 'wildlife',
    county: 'Nairobi',
    entryFee: { resident: 600, nonResident: 4000 },
    highlights: ['Big Five', 'Nairobi skyline', 'Rhino sanctuary'],
    isActive: true
  },
  {
    name: 'Lake Nakuru National Park',
    location: { type: 'Point', coordinates: [36.08, -0.36] },
    description: 'Famous for flamingos, rhinos and diverse birdlife around the alkaline lake.',
    images: [],
    category: 'wildlife',
    county: 'Nakuru',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Flamingos', 'White rhinos', '450+ bird species'],
    isActive: true
  },
  {
    name: 'Samburu National Reserve',
    location: { type: 'Point', coordinates: [37.53, 0.58] },
    description: 'Remote northern reserve with unique species found nowhere else in Kenya.',
    images: [],
    category: 'wildlife',
    county: 'Samburu',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Grevy\'s zebra', 'Reticulated giraffe', 'Samburu culture'],
    isActive: true
  },
  {
    name: 'Mount Kenya National Park',
    location: { type: 'Point', coordinates: [37.30, -0.15] },
    description: 'Africa\'s second highest peak with glaciers, alpine moorlands and unique wildlife.',
    images: [],
    category: 'adventure',
    county: 'Nyeri',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Trekking', 'Glaciers', 'Point Lenana summit', 'Colobus monkeys'],
    isActive: true
  },
  {
    name: 'Aberdare National Park',
    location: { type: 'Point', coordinates: [36.63, -0.40] },
    description: 'Misty moorlands, waterfalls and diverse wildlife in the Aberdare ranges.',
    images: [],
    category: 'adventure',
    county: 'Nyeri',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Karuru Falls', 'Tree hotels', 'Elephants', 'Black rhinos'],
    isActive: true
  },
  {
    name: 'Hell\'s Gate National Park',
    location: { type: 'Point', coordinates: [36.32, -0.90] },
    description: 'Dramatic gorges and geothermal activity. One of few parks where you can walk and cycle.',
    images: [],
    category: 'adventure',
    county: 'Nakuru',
    entryFee: { resident: 600, nonResident: 3000 },
    highlights: ['Cycling', 'Rock climbing', 'Fischer\'s Tower', 'Gorge walks'],
    isActive: true
  },
  {
    name: 'Diani Beach',
    location: { type: 'Point', coordinates: [39.57, -4.28] },
    description: 'Award-winning white sand beach on the South Coast. Crystal clear Indian Ocean waters.',
    images: [],
    category: 'beach',
    county: 'Kwale',
    entryFee: { resident: 0, nonResident: 0 },
    highlights: ['White sand beach', 'Snorkeling', 'Diving', 'Water sports'],
    isActive: true
  },
  {
    name: 'Watamu Marine National Park',
    location: { type: 'Point', coordinates: [40.02, -3.35] },
    description: 'UNESCO Biosphere Reserve with coral reefs, sea turtles and tropical fish.',
    images: [],
    category: 'beach',
    county: 'Kilifi',
    entryFee: { resident: 600, nonResident: 3000 },
    highlights: ['Coral reefs', 'Sea turtles', 'Snorkeling', 'Glass bottom boats'],
    isActive: true
  },
  {
    name: 'Mombasa Old Town',
    location: { type: 'Point', coordinates: [39.68, -4.05] },
    description: 'Historic Swahili architecture, Fort Jesus and vibrant coastal culture.',
    images: [],
    category: 'culture',
    county: 'Mombasa',
    entryFee: { resident: 500, nonResident: 1200 },
    highlights: ['Fort Jesus', 'Swahili architecture', 'Spice markets', 'Coastal cuisine'],
    isActive: true
  },
  {
    name: 'Lake Bogoria National Reserve',
    location: { type: 'Point', coordinates: [36.10, 0.27] },
    description: 'Geothermal geysers, hot springs and the largest flamingo population in Africa.',
    images: [],
    category: 'wildlife',
    county: 'Baringo',
    entryFee: { resident: 600, nonResident: 3000 },
    highlights: ['Flamingos', 'Hot springs', 'Geysers', 'Greater kudu'],
    isActive: true
  },
  {
    name: 'Ol Pejeta Conservancy',
    location: { type: 'Point', coordinates: [36.90, 0.00] },
    description: 'Home to the last two northern white rhinos on earth and a chimpanzee sanctuary.',
    images: [],
    category: 'wildlife',
    county: 'Laikipia',
    entryFee: { resident: 1500, nonResident: 8000 },
    highlights: ['Northern white rhinos', 'Chimpanzee sanctuary', 'Big Five', 'Night game drives'],
    isActive: true
  },
  {
    name: 'Arabuko Sokoke Forest',
    location: { type: 'Point', coordinates: [39.90, -3.33] },
    description: 'Largest intact coastal forest in East Africa with rare and endemic species.',
    images: [],
    category: 'adventure',
    county: 'Kilifi',
    entryFee: { resident: 300, nonResident: 1500 },
    highlights: ['Rare birds', 'Golden-rumped elephant shrew', 'Nature walks', 'Butterfly watching'],
    isActive: true
  },
  {
    name: 'Kakamega Forest',
    location: { type: 'Point', coordinates: [34.87, 0.27] },
    description: 'Kenya\'s only tropical rainforest, a remnant of the ancient Guineo-Congolian rainforest.',
    images: [],
    category: 'adventure',
    county: 'Kakamega',
    entryFee: { resident: 300, nonResident: 1500 },
    highlights: ['Rainforest walks', 'Rare birds', 'Primates', 'Butterflies'],
    isActive: true
  },
  {
    name: 'Lamu Old Town',
    location: { type: 'Point', coordinates: [40.90, -2.27] },
    description: 'UNESCO World Heritage Site. Kenya\'s oldest living town with Swahili culture.',
    images: [],
    category: 'culture',
    county: 'Lamu',
    entryFee: { resident: 0, nonResident: 0 },
    highlights: ['UNESCO heritage', 'Swahili culture', 'Dhow rides', 'Lamu Museum'],
    isActive: true
  },
  {
    name: 'Lake Turkana',
    location: { type: 'Point', coordinates: [36.10, 3.60] },
    description: 'The world\'s largest permanent desert lake and UNESCO World Heritage Site.',
    images: [],
    category: 'adventure',
    county: 'Turkana',
    entryFee: { resident: 300, nonResident: 1500 },
    highlights: ['Jade Sea', 'Crocodiles', 'Fossil sites', 'Turkana culture'],
    isActive: true
  },
  {
    name: 'Shimba Hills National Reserve',
    location: { type: 'Point', coordinates: [39.43, -4.23] },
    description: 'Coastal forest reserve with the rare sable antelope and beautiful waterfalls.',
    images: [],
    category: 'wildlife',
    county: 'Kwale',
    entryFee: { resident: 600, nonResident: 3000 },
    highlights: ['Sable antelope', 'Sheldrick Falls', 'Elephants', 'Coastal forest'],
    isActive: true
  }
];

  await Attraction.insertMany(sampleAttractions);
  res.status(201).json({ message: 'Sample attractions seeded' });
});

module.exports = {
  getAttractions,
  getAttraction,
  seedSampleAttractions
};

