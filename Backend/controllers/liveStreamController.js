const crypto = require('crypto');
const { RtcRole, RtcTokenBuilder } = require('agora-access-token');
const asyncHandler = require('express-async-handler');
const LiveStream = require('../models/LiveStream');
const Attraction = require('../models/Attraction');

const AGORA_APP_ID = process.env.AGORA_APP_ID || '6feba606e4bc4a2dbff78a3f54b15369';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';
const AGORA_TOKEN_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);

const defaultStreams = [
  {
    attractionName: 'Maasai Mara National Reserve',
    title: 'Maasai Mara Sunset Watch',
    description: 'Track evening wildlife movement and scenic skies near the reserve.',
    locationName: 'Maasai Mara National Reserve',
    streamUrl: 'https://www.youtube.com/results?search_query=maasai+mara+live',
    channelName: 'sample-maasai-mara-live',
    playbackType: 'external',
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
    channelName: 'sample-nairobi-park-live',
    playbackType: 'external',
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

const buildChannelName = (title, attractionId) => {
  const slug = String(title || attractionId || 'kenya-live')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return `${slug || 'kenya-live'}-${crypto.randomBytes(4).toString('hex')}`;
};

const buildRtcToken = (channelName, uid, role) => {
  if (!AGORA_APP_CERTIFICATE) {
    return null;
  }

  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + AGORA_TOKEN_TTL_SECONDS;
  return RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};

const createRtcUid = () => crypto.randomInt(1, 2147483647);

const serializeStreamSession = (stream, uid, role = RtcRole.SUBSCRIBER) => ({
  streamId: String(stream._id),
  appId: stream.agoraAppId || AGORA_APP_ID,
  token: buildRtcToken(stream.channelName, uid, role),
  channelName: stream.channelName,
  uid,
});

const isPlayableLiveStream = (stream) => {
  if (!stream) {
    return false;
  }

  if (stream.playbackType === 'external') {
    return Boolean(stream.streamUrl);
  }

  return stream.playbackType === 'agora' && stream.agoraAppId === AGORA_APP_ID;
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
  } else {
    query.status = 'live';
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
  res.json(liveStreams.filter(isPlayableLiveStream));
});

const getLiveStreamById = asyncHandler(async (req, res) => {
  const liveStream = await LiveStream.findById(req.params.id);

  if (!liveStream) {
    res.status(404);
    throw new Error('Live stream not found');
  }

  if (!isPlayableLiveStream(liveStream)) {
    res.status(404);
    throw new Error('Live stream is unavailable');
  }

  res.json(liveStream);
});

const createLiveStream = asyncHandler(async (req, res) => {
  const { title, description, locationName, thumbnailUrl, category, status, attractionId } = req.body;

  if (!title || !description || !locationName) {
    res.status(400);
    throw new Error('Title, description, and location are required');
  }

  let attraction = null;
  if (attractionId) {
    attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      res.status(404);
      throw new Error('Attraction not found for this live stream');
    }
  }

  const channelName = buildChannelName(title, attractionId);

  const liveStream = await LiveStream.create({
    attractionId: attraction?._id || null,
    attractionName: attraction?.name || '',
    title,
    description,
    locationName: attraction?.name || locationName,
    streamUrl: '',
    channelName,
    playbackType: 'agora',
    agoraAppId: AGORA_APP_ID,
    agoraToken: '',
    thumbnailUrl: thumbnailUrl || attraction?.images?.[0] || '',
    category: category || attraction?.category || 'wildlife',
    status: status || 'live',
    viewerCount: 0,
    hostUserId: req.user._id,
    hostName: req.user.name,
    startedAt: new Date(),
    endedAt: null,
  });

  res.status(201).json({
    ...liveStream.toObject(),
    session: serializeStreamSession(liveStream, createRtcUid(), RtcRole.PUBLISHER),
  });
});

const stopLiveStream = asyncHandler(async (req, res) => {
  const liveStream = await LiveStream.findById(req.params.id);

  if (!liveStream) {
    res.status(404);
    throw new Error('Live stream not found');
  }

  if (String(liveStream.hostUserId) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the host can stop this live stream');
  }

  liveStream.status = 'ended';
  liveStream.endedAt = new Date();
  liveStream.viewerCount = 0;
  await liveStream.save();

  res.json(liveStream);
});

const getStreamSession = asyncHandler(async (req, res) => {
  const liveStream = await LiveStream.findById(req.params.id);
  const requestedRole = String(req.query.role || 'subscriber').toLowerCase();
  const rtcRole = requestedRole === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const requestedUid = Number(req.query.uid);
  const uid = Number.isInteger(requestedUid) && requestedUid > 0 ? requestedUid : createRtcUid();

  if (!liveStream) {
    res.status(404);
    throw new Error('Live stream not found');
  }

  if (!isPlayableLiveStream(liveStream)) {
    res.status(404);
    throw new Error('Live stream is unavailable');
  }

  if (liveStream.playbackType !== 'agora') {
    res.status(400);
    throw new Error('This stream does not support in-app playback');
  }

  res.json({
    ...serializeStreamSession(liveStream, uid, rtcRole),
    status: liveStream.status,
    title: liveStream.title,
    role: requestedRole,
  });
});

const updateViewerPresence = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const liveStream = await LiveStream.findById(req.params.id);

  if (!liveStream) {
    res.status(404);
    throw new Error('Live stream not found');
  }

  if (action === 'join') {
    liveStream.viewerCount += 1;
  } else if (action === 'leave') {
    liveStream.viewerCount = Math.max(0, liveStream.viewerCount - 1);
  } else {
    res.status(400);
    throw new Error('Invalid viewer action');
  }

  await liveStream.save();
  res.json({ viewerCount: liveStream.viewerCount });
});

module.exports = {
  getLiveStreams,
  getLiveStreamById,
  createLiveStream,
  stopLiveStream,
  getStreamSession,
  updateViewerPresence,
};
