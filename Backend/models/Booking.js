const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  },
  package: {
    type: String,
    required: true,
    enum: ['day-tour', 'safari', 'cultural-experience', 'accommodation', 'custom']
  },
  date: {
    type: Date,
    required: true
  },
  participants: {
    type: Number,
    min: 1,
    default: 1
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card'],
    required: true
  },
  phoneNumber: {
    type: String
  },
  bookingRef: {
    type: String,
    unique: true
  },
  mpesaReceiptNumber: {
    type: String
  },
  mpesaCheckoutId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

