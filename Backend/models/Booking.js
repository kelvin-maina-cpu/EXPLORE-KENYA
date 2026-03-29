const mongoose = require('mongoose');

const generateBookingCode = () => `BK${Math.floor(100000 + Math.random() * 900000)}`;
const generateBookingRef = () => `BOOK-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

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
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0
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
  bookingCode: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesaBillRef: String,
  mpesaReceiptNumber: {
    type: String
  },
  mpesaCheckoutId: {
    type: String
  },
  pendingTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  paidAt: Date
}, { timestamps: true });

// Generate booking code before saving
bookingSchema.pre('save', function() {
  if (this.isNew) {
    if (!this.bookingCode) {
      this.bookingCode = generateBookingCode();
    }

    if (!this.bookingRef) {
      this.bookingRef = generateBookingRef();
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);


