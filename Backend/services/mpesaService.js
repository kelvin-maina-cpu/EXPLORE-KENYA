const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const MPESA_CONFIG = {
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  SHORTCODE: process.env.MPESA_SHORTCODE || '174379',
  PASSKEY: process.env.MPESA_PASSKEY,
  CALLBACK_URL: process.env.MPESA_CALLBACK_URL || `http://localhost:5000/api/mpesa/callback`,
  // BUG FIX: Removed trailing space from URL
  ENDPOINT: process.env.MPESA_ENDPOINT?.trim() || 'https://sandbox.safaricom.co.ke',
};

// Retry helper for flaky M-Pesa APIs
const retry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      if (!['ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'].includes(err.code)) throw err;
      console.warn(`M-Pesa auth retry ${i+1}/${maxRetries}: ${err.code}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

// Generate OAuth token with retry + timeout
const getAuthToken = async () => {
  const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
  return retry(async () => {
    const response = await axios.get(`${MPESA_CONFIG.ENDPOINT}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      },
      timeout: 10000
    });
    return response.data.access_token;
  }, 3);
};

// Helper: Normalize phone to 254XXXXXXXXX
const normalizePhone = (phone) => {
  let cleaned = phone.toString().replace(/\D/g, ''); // Remove all non-digits
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  return cleaned;
};

// STK Push (Lipa Na M-Pesa Online)
const stkPush = async (phoneNumber, amount, accountReference, transactionDesc) => {
  try {
    const token = await getAuthToken();
    
    // BUG FIX: Proper timestamp format YYYYMMDDHHmmss (14 digits)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    
    // BUG FIX: Ensure password is correctly formed
    const passwordString = `${MPESA_CONFIG.SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`;
    const password = Buffer.from(passwordString).toString('base64');
    
    // BUG FIX: Normalize phone and ensure amount is integer
    const normalizedPhone = normalizePhone(phoneNumber);
    const intAmount = Math.round(parseFloat(amount));
    
    // Validate inputs
    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      throw new Error(`Invalid phone format: ${normalizedPhone}. Expected: 2547XXXXXXXX or 2541XXXXXXXX`);
    }
    
    if (intAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Must be greater than 0.`);
    }

    const payload = {
      BusinessShortCode: MPESA_CONFIG.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: intAmount,
      PartyA: normalizedPhone,
      PartyB: MPESA_CONFIG.SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: accountReference.substring(0, 12), // Max 12 chars
      TransactionDesc: transactionDesc.substring(0, 13)      // Max 13 chars
    };

    // DEBUG: Log the exact payload (remove in production)
    console.log('=== M-PESA STK PUSH REQUEST ===');
    console.log('Timestamp:', timestamp, '(length:', timestamp.length + ')');
    console.log('Phone:', normalizedPhone);
    console.log('Amount:', intAmount);
    console.log('Shortcode:', MPESA_CONFIG.SHORTCODE);
    console.log('Callback URL:', MPESA_CONFIG.CALLBACK_URL);
    console.log('Endpoint:', MPESA_CONFIG.ENDPOINT);

    const response = await axios.post(
      `${MPESA_CONFIG.ENDPOINT}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('M-Pesa Response:', response.data);
    return response.data;
    
  } catch (err) {
    console.error('=== M-PESA ERROR DETAILS ===');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', err.response.data);
      console.error('Request Payload:', err.config?.data);
    }
    
    throw new Error(
      `M-Pesa STK push failed: ${err.response?.data?.errorMessage || err.message}`
    );
  }
};

// Callback validation & response parser (FIX: handle undefined CallbackMetadata)
const validateCallback = (body) => {
  try {
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      throw new Error('Invalid callback structure');
    }

    const items = callback.CallbackMetadata?.Item || [];
    const metadata = {};
    items.forEach(item => {
      metadata[item.Name] = item.Value;
    });

    return {
      CheckoutRequestID: callback.CheckoutRequestID,
      ResultCode: callback.ResultCode,
      ResultDesc: callback.ResultDesc,
      Amount: metadata.Amount,
      MpesaReceiptNumber: metadata.MpesaReceiptNumber,
      PhoneNumber: metadata.PhoneNumber,
      TransactionDate: metadata.TransactionDate
    };
  } catch (error) {
    console.error('Callback validation error:', error);
    throw error;
  }
};

module.exports = {
  stkPush,
  validateCallback,
  getAuthToken
};
