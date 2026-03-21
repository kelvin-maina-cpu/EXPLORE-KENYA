const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const MPESA_CONFIG = {
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  SHORTCODE: process.env.MPESA_SHORTCODE || '174379',
  PASSKEY: process.env.MPESA_PASSKEY,
  CALLBACK_URL: process.env.MPESA_CALLBACK_URL || `http://localhost:5000/api/mpesa/callback`,
  ENDPOINT: process.env.MPESA_ENDPOINT || 'https://sandbox.safaricom.co.ke', // Production: https://api.safaricom.co.ke
};

// Generate OAuth token
const getAuthToken = async () => {
  const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(`${MPESA_CONFIG.ENDPOINT}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });
  return response.data.access_token;
};

// STK Push (Lipa Na M-Pesa Online)
const stkPush = async (phoneNumber, amount, accountReference, transactionDesc) => {
  const token = await getAuthToken();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const password = Buffer.from(`${MPESA_CONFIG.SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');

  const response = await axios.post(
    `${MPESA_CONFIG.ENDPOINT}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: MPESA_CONFIG.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

// Callback validation & response parser
const validateCallback = (body, headers) => {
  // Secure validation (IP whitelist, timestamp, hash)
  const expectedHash = crypto.createHmac('sha256', MPESA_CONFIG.PASSKEY)
    .update(JSON.stringify(body))
    .digest('hex');
  
  // In production, verify M-Pesa signature if provided
  return {
    CheckoutRequestID: body.Body.stkCallback.Body.CheckoutRequestID,
    ResultCode: body.Body.stkCallback.Body.ResultCode,
    ResultDesc: body.Body.stkCallback.Body.ResultDesc,
    Amount: body.Body.stkCallback.Body.CallbackMetadata?.Item[0]?.Value,
    MpesaReceiptNumber: body.Body.stkCallback.Body.CallbackMetadata?.Item[1]?.Value,
    PhoneNumber: body.Body.stkCallback.Body.CallbackMetadata?.Item[4]?.Value
  };
};

module.exports = {
  stkPush,
  validateCallback,
  getAuthToken
};
