const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const mpesaService = require('../services/mpesaService');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { attractionId, package, date, participants, phoneNumber, totalAmount, paymentMethod } = req.body;

  // Validate required fields
  if (!attractionId || !package || !date || !totalAmount || !paymentMethod) {
    res.status(400);
    throw new Error('Missing required booking fields');
  }

  // Create booking record (payment pending)
  const booking = new Booking({
    userId: req.user._id,
    attractionId,
    package,
    date: new Date(date),
    participants: parseInt(participants) || 1,
    paymentMethod,
    totalAmount: parseFloat(totalAmount),
    phoneNumber,
  });

  const savedBooking = await booking.save();

  // If M-Pesa payment, initiate STK push
  if (paymentMethod === 'mpesa') {
    try {
      const stkResult = await mpesaService.stkPush(
        phoneNumber,
        totalAmount,
        savedBooking.bookingCode,
        `Booking ${savedBooking._id} - ${package}`
      );

      // Link STK to booking
      savedBooking.mpesaCheckoutId = stkResult.CheckoutRequestID;
      await savedBooking.save();

      res.status(201).json({
        success: true,
        message: 'STK Push sent! Check your phone.',
        data: {
          booking: savedBooking,
          checkoutRequestId: stkResult.CheckoutRequestID
        }
      });
    } catch (mpesaError) {
      // Booking created but payment failed - user can retry
      console.error('M-Pesa initiation failed:', mpesaError.message);
      res.status(201).json({
        success: true,
        message: `Booking created (ID: ${savedBooking._id}). M-Pesa failed: ${mpesaError.message}. Retry payment.`,
        data: { booking: savedBooking }
      });
    }
  } else {
    // Card/other - mark as paid or handle separately
    savedBooking.paymentStatus = 'paid';
    savedBooking.amountPaid = totalAmount;
    savedBooking.paidAt = new Date();
    await savedBooking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: savedBooking
    });
  }
});

// @desc    Get my bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .populate('attractionId', 'name location price')
    .populate('transaction')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

module.exports = {
  createBooking,
  getMyBookings
};

