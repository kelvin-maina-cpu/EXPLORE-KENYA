const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesaService');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// ==========================================
// MIDDLEWARE
// ==========================================

// Idempotency middleware - prevent duplicate charges
const idempotencyMap = new Map();
const IDEMPOTENCY_WINDOW = 5 * 60 * 1000; // 5 minutes

const resolveStkCallbackUrl = () => {
  const configuredUrl = process.env.MPESA_CALLBACK_URL?.trim();

  if (!configuredUrl) {
    return undefined;
  }

  return configuredUrl.replace(/\/(callback|stk-callback)\/?$/i, '/stk-callback');
};

const checkIdempotency = (req, res, next) => {
  const key = req.headers['idempotency-key'] || req.body.idempotencyKey;
  
  if (!key) {
    // Generate one if not provided
    req.idempotencyKey = crypto.randomUUID();
    return next();
  }
  
  const existing = idempotencyMap.get(key);
  if (existing && (Date.now() - existing.timestamp) < IDEMPOTENCY_WINDOW) {
    console.log(`⚠️ Duplicate request detected: ${key}`);
    return res.status(409).json({
      success: false,
      message: 'Duplicate request detected',
      originalResponse: existing.response
    });
  }
  
  req.idempotencyKey = key;
  next();
};

// ==========================================
// STK PUSH ENDPOINTS
// ==========================================

/**
 * Test OAuth token generation using Backend/.env credentials
 * GET /api/mpesa/oauth-token
 */
router.get('/oauth-token', asyncHandler(async (req, res) => {
  try {
    const accessToken = await mpesaService.getAuthToken();

    res.json({
      success: true,
      message: 'OAuth token generated successfully using .env credentials.',
      data: {
        tokenPreview: `${accessToken.slice(0, 20)}...`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate OAuth token from .env credentials'
    });
  }
}));

/**
 * Initiate STK Push payment
 * POST /api/mpesa/stk-push
 */
router.post('/stk-push', 
  checkIdempotency,
  asyncHandler(async (req, res) => {
    const { phoneNumber, amount, bookingId, description } = req.body;

    // Validate inputs
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required'
      });
    }


    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
    }

    try {
      // Initiate STK Push
      const result = await mpesaService.stkPush(
        phoneNumber,
        amount,
        bookingId ? `BK${bookingId.slice(-8)}` : 'EXPLOREKENYA',
        description || 'Explore Kenya Payment',
        resolveStkCallbackUrl()
      );

      // Create transaction record
      const transaction = new Transaction({
        type: 'stk_push',
        booking: bookingId,
        idempotencyKey: req.idempotencyKey,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        phoneNumber: mpesaService.normalizePhone(phoneNumber),
        amount: parseFloat(amount),
        status: 'pending', // pending, processing, completed, failed
        description: description || 'Explore Kenya Payment',
        metadata: {
          rawResponse: result
        }
      });

      await transaction.save();

      // Update booking with pending payment
      if (booking) {
        booking.paymentStatus = 'pending';
        booking.pendingTransaction = transaction._id;
        await booking.save();
      }

      // Store idempotency response
      idempotencyMap.set(req.idempotencyKey, {
        timestamp: Date.now(),
        response: { transactionId: transaction._id, checkoutRequestId: result.checkoutRequestId }
      });

      res.status(200).json({
        success: true,
        message: 'STK Push initiated. Check your phone to complete payment.',
        data: {
          transactionId: transaction._id,
          checkoutRequestId: result.checkoutRequestId,
          merchantRequestId: result.merchantRequestId,
          customerMessage: result.customerMessage
        }
      });

    } catch (error) {
      console.error('STK Push initiation failed:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate payment'
      });
    }
  })
);

/**
 * Query transaction status (manual fallback)
 * GET /api/mpesa/query/:checkoutRequestId
 */
router.get('/query/:checkoutRequestId',
  asyncHandler(async (req, res) => {
    const { checkoutRequestId } = req.params;

    try {
      const status = await mpesaService.queryTransactionStatus(checkoutRequestId);
      
      // Update transaction in database
      await Transaction.findOneAndUpdate(
        { checkoutRequestId },
        {
          status: status.success ? 'completed' : 'failed',
          resultCode: status.resultCode,
          resultDesc: status.resultDesc,
          mpesaReceiptNumber: status.mpesaReceiptNumber,
          completedAt: status.success ? new Date() : null
        }
      );

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  })
);

// ==========================================
// CALLBACK ENDPOINTS (Called by Safaricom)
// ==========================================

/**
 * STK Push Callback
 * POST /api/mpesa/stk-callback
 * 
 * This is called by Safaricom when customer completes/cancels payment
 */
router.post('/stk-callback', asyncHandler(async (req, res) => {
  console.log('📥 STK Callback received:', JSON.stringify(req.body, null, 2));

  try {
    // Validate callback signature if configured
    const signature = req.headers['x-mpesa-signature'];
    const timestamp = req.headers['x-mpesa-timestamp'];
    
    if (process.env.MPESA_CALLBACK_SECRET) {
      mpesaService.validateCallbackSignature(req.body, signature, timestamp);
    }

    // Parse callback
    const callback = mpesaService.parseStkCallback(req.body);

    // Find transaction
    const transaction = await Transaction.findOne({
      checkoutRequestId: callback.checkoutRequestId
    });

    if (!transaction) {
      console.error('⚠️ Transaction not found:', callback.checkoutRequestId);
      // Still return success to M-Pesa to stop retries
      return res.status(200).json({ 
        ResultCode: 0, 
        ResultDesc: 'Accepted - Transaction not found but acknowledged' 
      });
    }

    // Update transaction
    transaction.status = callback.isSuccess ? 'completed' : 'failed';
    transaction.resultCode = callback.resultCode;
    transaction.resultDesc = callback.resultDesc;
    transaction.mpesaReceiptNumber = callback.mpesaReceiptNumber;
    transaction.phoneNumber = callback.phoneNumber || transaction.phoneNumber;
    transaction.completedAt = callback.isSuccess ? new Date() : null;
    transaction.callbackReceivedAt = new Date();
    transaction.rawCallback = req.body;

    await transaction.save();

    // If successful, update booking
    if (callback.isSuccess && transaction.booking) {
      const booking = await Booking.findById(transaction.booking);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.mpesaReceiptNumber = callback.mpesaReceiptNumber;
        booking.paidAt = new Date();
        booking.amountPaid = callback.amount || transaction.amount;
        booking.transaction = transaction._id;
        await booking.save();

        // TODO: Send confirmation email/SMS
        console.log(`✅ Booking ${booking._id} marked as paid. Receipt: ${callback.mpesaReceiptNumber}`);
      }
    }

    // IMPORTANT: Always return success to M-Pesa
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('🔴 STK Callback processing error:', error);
    // Still return 200 to prevent M-Pesa retries, but log error
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted with errors logged' });
  }
}));

// ==========================================
// C2B CALLBACKS (For Till Number payments)
// ==========================================

/**
 * C2B Validation URL
 * POST /api/mpesa/validation
 * 
 * Called before payment completes - can accept/reject
 */
router.post('/validation', asyncHandler(async (req, res) => {
  console.log('📥 C2B Validation:', JSON.stringify(req.body, null, 2));

  try {
    const data = mpesaService.parseC2BCallback(req.body);
    
    // Validate the payment (e.g., check if billRefNumber exists)
    const isValid = await validatePaymentReference(data.billRefNumber, data.transAmount);
    
    if (isValid) {
      // Accept payment
      res.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
        ThirdPartyTransID: crypto.randomUUID().slice(0, 20) // Optional tracking ID
      });
    } else {
      // Reject payment
      res.json({
        ResultCode: 1,
        ResultDesc: 'Rejected - Invalid reference or amount'
      });
    }
  } catch (error) {
    console.error('Validation error:', error);
    // Accept anyway to avoid blocking legitimate payments
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}));

/**
 * C2B Confirmation URL
 * POST /api/mpesa/confirmation
 * 
 * Called after payment successfully completes
 */
router.post('/confirmation', asyncHandler(async (req, res) => {
  console.log('📥 C2B Confirmation:', JSON.stringify(req.body, null, 2));

  try {
    const data = mpesaService.parseC2BCallback(req.body);

    // Create transaction record
    const transaction = new Transaction({
      type: 'c2b',
      status: 'completed',
      mpesaReceiptNumber: data.transId,
      phoneNumber: data.msisdn,
      amount: parseFloat(data.transAmount),
      billRefNumber: data.billRefNumber,
      transactionDate: parseMpesaDate(data.transTime),
      thirdPartyTransId: data.thirdPartyTransId,
      rawCallback: req.body,
      completedAt: new Date()
    });

    await transaction.save();

    // Try to match with booking
    if (data.billRefNumber) {
      const booking = await Booking.findOne({
        $or: [
          { _id: data.billRefNumber.match(/[a-f0-9]{24}/)?.[0] }, // If full ID
          { bookingCode: data.billRefNumber }, // If using short code
          { mpesaBillRef: data.billRefNumber }
        ]
      });

      if (booking) {
        booking.paymentStatus = 'paid';
        booking.mpesaReceiptNumber = data.transId;
        booking.paidAt = new Date();
        booking.amountPaid = parseFloat(data.transAmount);
        booking.transaction = transaction._id;
        await booking.save();

        transaction.booking = booking._id;
        await transaction.save();
      }
    }

    // Always return success
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('Confirmation error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}));

// ==========================================
// ADMIN/UTILITY ENDPOINTS
// ==========================================

/**
 * Register C2B URLs (Admin only - run once)
 * POST /api/mpesa/register-c2b
 */
router.post('/register-c2b', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication middleware
  try {
    const result = await mpesaService.registerC2BUrls();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}));

/**
 * Get transaction status by ID
 * GET /api/mpesa/transaction/:id
 */
router.get('/transaction/:id', asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('booking', 'title date status');
    
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }
  
  res.json({ success: true, data: transaction });
}));

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function validatePaymentReference(billRefNumber, amount) {
  // Implement your validation logic
  // e.g., check if booking exists and amount matches
  if (!billRefNumber) return false;
  
  const booking = await Booking.findOne({
    $or: [
      { bookingCode: billRefNumber },
      { mpesaBillRef: billRefNumber }
    ]
  });
  
  if (!booking) return false;
  if (booking.paymentStatus === 'paid') return false; // Already paid
  
  // Optional: validate amount matches expected
  // if (Math.abs(booking.totalAmount - parseFloat(amount)) > 1) return false;
  
  return true;
}

function parseMpesaDate(mpesaDateStr) {
  // M-Pesa format: YYYYMMDDHHmmss
  if (!mpesaDateStr || mpesaDateStr.length !== 14) return new Date();
  
  const year = mpesaDateStr.slice(0, 4);
  const month = mpesaDateStr.slice(4, 6) - 1; // 0-indexed
  const day = mpesaDateStr.slice(6, 8);
  const hour = mpesaDateStr.slice(8, 10);
  const minute = mpesaDateStr.slice(10, 12);
  const second = mpesaDateStr.slice(12, 14);
  
  return new Date(year, month, day, hour, minute, second);
}

module.exports = router;

