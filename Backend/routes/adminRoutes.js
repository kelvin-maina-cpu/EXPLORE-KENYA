const express = require('express');
const asyncHandler = require('express-async-handler');
const Tour = require('../models/Tour');
const Attraction = require('../models/Attraction');
const Booking = require('../models/Booking');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const ATTRACTION_CATEGORIES = ['wildlife', 'culture', 'adventure', 'beach', 'history'];

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean);
};

const normalizeTourPayload = (body = {}) => ({
  title: `${body.title || ''}`.trim(),
  description: `${body.description || ''}`.trim(),
  location: `${body.location || ''}`.trim(),
  price: Number(body.price ?? 0),
  duration: `${body.duration || ''}`.trim(),
  maxGroupSize: body.maxGroupSize === undefined ? 10 : Number(body.maxGroupSize),
  images: normalizeStringList(body.images),
  includes: normalizeStringList(body.includes),
  excludes: normalizeStringList(body.excludes),
  itinerary: Array.isArray(body.itinerary)
    ? body.itinerary
        .map((item, index) => ({
          day: Number(item?.day ?? index + 1),
          title: `${item?.title || ''}`.trim(),
          description: `${item?.description || ''}`.trim(),
          activities: normalizeStringList(item?.activities),
        }))
        .filter((item) => item.title && item.description)
    : [],
  rating: body.rating === undefined ? 0 : Number(body.rating),
  featured: Boolean(body.featured),
  isActive: body.isActive === undefined ? true : Boolean(body.isActive),
});

const normalizeAttractionPayload = (body = {}) => {
  const latitude = Number(body.coordinates?.lat ?? body.lat ?? body.latitude);
  const longitude = Number(body.coordinates?.lng ?? body.lng ?? body.longitude);

  return {
    name: `${body.name || ''}`.trim(),
    description: `${body.description || ''}`.trim(),
    category: ATTRACTION_CATEGORIES.includes(body.category) ? body.category : 'wildlife',
    county: `${body.county || body.locationName || ''}`.trim(),
    websiteUrl: `${body.websiteUrl || ''}`.trim(),
    bookingUrl: `${body.bookingUrl || ''}`.trim(),
    images: normalizeStringList(body.images),
    entryFee: {
      resident: Number(body.entryFee?.resident ?? 0),
      nonResident: Number(body.entryFee?.nonResident ?? 0),
    },
    highlights: normalizeStringList(body.highlights || body.activities),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    location: {
      type: 'Point',
      coordinates: [
        Number.isFinite(longitude) ? longitude : 36.8219,
        Number.isFinite(latitude) ? latitude : -1.2921,
      ],
    },
  };
};

const getDashboardStats = async () => {
  const [totalTours, totalAttractions, totalBookings, paidRevenue, recentBookings] = await Promise.all([
    Tour.countDocuments(),
    Attraction.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email'),
  ]);

  return {
    totalTours,
    totalAttractions,
    totalBookings,
    revenue: paidRevenue[0]?.total || 0,
    recentBookings,
  };
};

router.use(adminAuth);

router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ success: true, stats });
}));

router.get('/tours', asyncHandler(async (req, res) => {
  const tours = await Tour.find().sort({ createdAt: -1 });
  res.json({ success: true, count: tours.length, tours });
}));

router.get('/tours/:id', asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Tour not found');
  }

  res.json({ success: true, tour });
}));

router.post('/tours', asyncHandler(async (req, res) => {
  const tour = await Tour.create(normalizeTourPayload(req.body));
  res.status(201).json({ success: true, tour });
}));

router.put('/tours/:id', asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(
    req.params.id,
    normalizeTourPayload(req.body),
    { new: true, runValidators: true }
  );

  if (!tour) {
    res.status(404);
    throw new Error('Tour not found');
  }

  res.json({ success: true, tour });
}));

router.delete('/tours/:id', asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Tour not found');
  }

  res.json({ success: true, message: 'Tour deleted' });
}));

router.get('/attractions', asyncHandler(async (req, res) => {
  const attractions = await Attraction.find().sort({ name: 1 });
  res.json({ success: true, count: attractions.length, attractions });
}));

router.get('/attractions/:id', asyncHandler(async (req, res) => {
  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }

  res.json({ success: true, attraction });
}));

router.post('/attractions', asyncHandler(async (req, res) => {
  const attraction = await Attraction.create(normalizeAttractionPayload(req.body));
  res.status(201).json({ success: true, attraction });
}));

router.put('/attractions/:id', asyncHandler(async (req, res) => {
  const attraction = await Attraction.findByIdAndUpdate(
    req.params.id,
    normalizeAttractionPayload(req.body),
    { new: true, runValidators: true }
  );

  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }

  res.json({ success: true, attraction });
}));

router.delete('/attractions/:id', asyncHandler(async (req, res) => {
  const attraction = await Attraction.findByIdAndDelete(req.params.id);
  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }

  res.json({ success: true, message: 'Attraction deleted' });
}));

router.get('/bookings', asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('attractionId', 'name category county');

  res.json({ success: true, count: bookings.length, bookings });
}));

module.exports = router;
