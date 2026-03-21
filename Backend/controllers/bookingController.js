const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Attraction = require('../models/Attraction');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const mpesaService = require('../services/mpesaService');

const createBooking = asyncHandler(async (req, res) => {
  const { attractionId, package: pkg, date, participants, paymentMethod, totalAmount, phoneNumber } = req.body;

  const attraction = await Attraction.findById(attractionId);
  if (!attraction) {
    res.status(404);
    throw new Error('Attraction not found');
  }

  // Calculate total (sandbox test: fixed KES 100)
  // Validate/format Kenyan phone robustly
  let formattedPhone = phoneNumber?.trim();
  if (formattedPhone) {
    formattedPhone = formattedPhone.replace(/[^0-9+]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1') || formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone;
    }
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      res.status(400);
      throw new Error('Invalid Kenyan phone. Use +2547xxxxxxxx, 07xxxxxxxx or 2547xxxxxxxx');
    }
  } else {
    res.status(400);
    throw new Error('Phone number required for booking');
  }

  const participantCount = Math.max(1, Number(participants) || 1);
  const baseAmount = Math.max(0, Number(totalAmount) || 0);
  const finalAmount = Math.round(baseAmount * participantCount);

  const bookingRef = `EK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

  const booking = await Booking.create({
    userId: req.user._id,
    attractionId,
    package: pkg,
    date,
    participants: participantCount,
    paymentMethod,
    totalAmount: finalAmount,
    phoneNumber: formattedPhone,
    mpesaCheckoutId: '',
    bookingRef,
    paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending'
  });

  let mpesaResponse = null;
  let message = 'Booking created successfully.';

  if (paymentMethod === 'mpesa') {
    mpesaResponse = await mpesaService.stkPush(
      formattedPhone,
      finalAmount,
      `EXPLORE_${booking._id.toString().slice(-8)}`,
      `Booking ${pkg} for ${attraction.name}`
    );

    if (mpesaResponse.ResponseCode !== '0') {
      res.status(400);
      throw new Error(`M-Pesa STK push failed: ${mpesaResponse.ResponseDescription}`);
    }

    // Store CheckoutRequestID for callback matching
    booking.mpesaCheckoutId = mpesaResponse.CheckoutRequestID;
    await booking.save();

    message = 'Booking created! Check M-Pesa for payment prompt.';
  } else if (paymentMethod === 'card') {
    message = 'Card payment confirmed for this booking.';
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate('attractionId', 'name location description')
    .populate('userId', 'name email');

  res.status(201).json({
    ...populatedBooking.toObject(),
    mpesaRequest: mpesaResponse || null,
    message
  });
});

// @desc    Get user bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .populate('attractionId', 'name location description images')
    .sort({ createdAt: -1 });

  res.json(bookings);
});

module.exports = {
  createBooking,
  getMyBookings
};
