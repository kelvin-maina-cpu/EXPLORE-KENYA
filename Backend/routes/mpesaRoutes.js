const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesaService');
const Booking = require('../models/Booking');
const asyncHandler = require('express-async-handler');

// M-Pesa STK Push Callback (POST from Safaricom)
router.post('/callback', asyncHandler(async (req, res) => {
  try {
    const validation = mpesaService.validateCallback(req.body, req.headers);
    
    if (validation.ResultCode === 0) {
      // Success - Update booking status - FIXED: use mpesaCheckoutId
      const booking = await Booking.findOne({ 
        mpesaCheckoutId: validation.CheckoutRequestID 
      });
      
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.mpesaReceiptNumber = validation.MpesaReceiptNumber;
        await booking.save();
        
        console.log(`✅ Booking ${booking._id} paid: ${validation.MpesaReceiptNumber}`);
      }
    }
    
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
}));

module.exports = router;
