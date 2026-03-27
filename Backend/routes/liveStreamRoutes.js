const express = require('express');
const router = express.Router();
const {
  getLiveStreams,
  getLiveStreamById,
  createLiveStream,
  stopLiveStream,
  getStreamSession,
  updateViewerPresence,
} = require('../controllers/liveStreamController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getLiveStreams).post(protect, createLiveStream);
router.route('/:id').get(getLiveStreamById).patch(protect, stopLiveStream);
router.get('/:id/session', getStreamSession);
router.post('/:id/viewers', updateViewerPresence);

module.exports = router;
