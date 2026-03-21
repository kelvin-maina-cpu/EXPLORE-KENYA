const express = require('express');
const router = express.Router();
const { getLiveStreams, createLiveStream, getStreamToken } = require('../controllers/liveStreamController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getLiveStreams).post(protect, createLiveStream);

router.get('/streams/:attractionId/token', getStreamToken);

module.exports = router;
