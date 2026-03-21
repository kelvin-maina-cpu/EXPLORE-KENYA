const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createBooking, getMyBookings } = require('../controllers/bookingController');

router.use(protect); // All routes protected

router.route('/').post(createBooking);
router.route('/my').get(getMyBookings);

module.exports = router;
