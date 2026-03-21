const asyncHandler = require('express-async-handler');
const LiveStream = require('../models/LiveStream');
const Attraction = require('../models/Attraction');

const defaultStreams = [
  {
    attractionName: 'Maasai Mara National Reserve',
    title: 'Maasai Mara Sunset Watch',
    description: 'Track evening wildlife movement and scenic skies near the reserve.',
    locationName: 'Maasai Mara National Reserve',
    streamUrl: 'https://www.youtube.com/results?search_query=maasai+mara+live',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    category: 'wildlife',
    status: 'live',
    hostName: 'Explore Kenya',
  },
  {
    attractionName: 'Nairobi National Park',
    title: 'Nairobi Park Wildlife Highlights',
    description: 'Watch live park footage and ranger highlights from Nairobi National Park.',
    locationName: 'Nairobi National Park',
    streamUrl: 'https://www.youtube.com/results?search_query=nairobi+national+park+live',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=1200&q=80',
    category: 'wildlife',
    status: 'live',
    hostName: 'Explore Kenya',
  },
];

const ensureDefaultStreams = async () => {
  const count = await LiveStream.countDocuments();
  if (!count) {
    await LiveStream.insertMany(
      defaultStreams.map((stream) => ({
        ...stream,
        hostUserId: '000000000000000000000000',
      }))
    );
  }
};

const getLiveStreams = asyncHandler(async (req, res) => {
  await ensureDefaultStreams();

  const { category = '', status = '', attractionId = '', attractionName = '' } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (attractionId) {
    query.attractionId = attractionId;
  }

  if (!attractionId && attractionName) {
    query.$or = [
      { attractionName: { $regex: attractionName, $options: 'i' } },
      { locationName: { $regex: attractionName, $options: 'i' } },
    ];
  }

  const liveStreams = await LiveStream.find(query).sort({ createdAt: -1 });
  res.json(liveStreams);
});

const createLiveStream = asyncHandler(async (req, res) => {
  const { title, description, locationName, streamUrl, thumbnailUrl, category, status, attractionId } = req.body;

  if (!title || !description || !locationName || !streamUrl) {
    res.status(400);
    throw new Error('Title, description, location, and stream URL are required');
  }

  let attraction = null;
  if (attractionId) {
    attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      res.status(404);
      throw new Error('Attraction not found for this live stream');
    }
  }

  const liveStream = await LiveStream.create({
    attractionId: attraction?._id || null,
    attractionName: attraction?.name || '',
    title,
    description,
    locationName: attraction?.name || locationName,
    streamUrl,
    thumbnailUrl: thumbnailUrl || attraction?.images?.[0] || '',
    category: category || attraction?.category || 'wildlife',
    status: status || 'live',
    hostUserId: req.user._id,
    hostName: req.user.name,
  });

  res.status(201).json(liveStream);
});

const getStreamToken = asyncHandler(async (req, res) => {
  const { attractionId } = req.params;
  
  const attraction = await Attraction.findById(attractionId);
  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }

  const channelName = attractionId;
  const appId = '6feba606e4bc4a2dbff78a3f54b15369';
  // TODO: Real Agora RTC token generation (uid, role, ttl)
  // For now: placeholder for testing
  const token = `token_${channelName}_${Date.now()}`;

  res.json({
    token,
    channelName,
    appId,
  });
});

module.exports = {
  getLiveStreams,
  createLiveStream,
  getStreamToken,
};
