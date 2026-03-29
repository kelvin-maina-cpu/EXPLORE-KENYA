const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const mpesaService = require('../services/mpesaService');

// Poll pending transactions every 30 seconds
const startPoller = () => {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Find pending transactions older than 30 seconds, younger than 5 minutes
      const pendingTransactions = await Transaction.find({
        status: 'pending',
        type: 'stk_push',
        createdAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
          $lte: new Date(Date.now() - 30 * 1000)      // 30 sec ago
        },
        'pollAttempts': { $lt: 10 } // Max 10 attempts
      });

      for (const tx of pendingTransactions) {
        try {
          console.log(`🔄 Polling status for ${tx.checkoutRequestId}`);
          
          const status = await mpesaService.queryTransactionStatus(tx.checkoutRequestId);
          
          tx.pollAttempts = (tx.pollAttempts || 0) + 1;
          
          if (status.success) {
            tx.status = 'completed';
            tx.mpesaReceiptNumber = status.mpesaReceiptNumber;
            tx.resultCode = status.resultCode;
            tx.completedAt = new Date();
            
            // Update booking
            if (tx.booking) {
              const Booking = require('../models/Booking');
              await Booking.findByIdAndUpdate(tx.booking, {
                paymentStatus: 'paid',
                mpesaReceiptNumber: status.mpesaReceiptNumber,
                paidAt: new Date()
              });
            }
          } else if (status.resultCode !== '0' && tx.pollAttempts >= 5) {
            // Mark as failed after 5 failed attempts
            tx.status = 'failed';
            tx.resultCode = status.resultCode;
            tx.resultDesc = status.resultDesc;
          }
          
          await tx.save();
          
        } catch (error) {
          console.error(`Polling error for ${tx._id}:`, error.message);
          tx.pollAttempts = (tx.pollAttempts || 0) + 1;
          await tx.save();
        }
      }
    } catch (error) {
      console.error('Poller error:', error);
    }
  });
  
  console.log('✅ Payment status poller started');
};

module.exports = { startPoller };

