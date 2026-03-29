const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Type
  type: {
    type: String,
    enum: ['stk_push', 'c2b', 'b2c', 'refund'],
    required: true
  },
  
  // References
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Idempotency
  idempotencyKey: {
    type: String,
    index: true,
    unique: true,
    sparse: true
  },
  
  // M-Pesa Fields
  checkoutRequestId: {
    type: String,
    index: true
  },
  merchantRequestId: String,
  mpesaReceiptNumber: {
    type: String,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  resultCode: String,
  resultDesc: String,
  
  // C2B Specific
  billRefNumber: String,
  transactionDate: Date,
  thirdPartyTransId: String,
  
  // Description
  description: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  callbackReceivedAt: Date,
  
  // Raw Data (for debugging)
  rawCallback: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Refund tracking
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String,
  originalTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Polling
  pollAttempts: {
    type: Number,
    default: 0
  }
});

// Indexes for common queries
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ phoneNumber: 1, createdAt: -1 });
transactionSchema.index({ booking: 1, status: 1 });

// Methods
transactionSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

transactionSchema.methods.canRefund = function() {
  return this.status === 'completed' && !this.refundedAt;
};

module.exports = mongoose.model('Transaction', transactionSchema);

