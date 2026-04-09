const fs = require('fs');
const path = require('path');
const axios = require('axios');

const localEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

const cleanEnv = (value) => value?.trim();
const IS_PRODUCTION = process.env.MPESA_ENV === 'production';

const MPESA_CONFIG = {
  CONSUMER_KEY: cleanEnv(process.env.MPESA_CONSUMER_KEY),
  CONSUMER_SECRET: cleanEnv(process.env.MPESA_CONSUMER_SECRET),
  SHORTCODE: cleanEnv(process.env.MPESA_SHORTCODE) || '5369758',
  PASSKEY: cleanEnv(process.env.MPESA_PASSKEY),
  CALLBACK_URL: cleanEnv(process.env.MPESA_CALLBACK_URL),
  TRANSACTION_TYPE:
    cleanEnv(process.env.MPESA_TRANSACTION_TYPE) ||
    (cleanEnv(process.env.MPESA_SHORTCODE) === '174379' ? 'CustomerPayBillOnline' : 'CustomerBuyGoodsOnline'),
  ENDPOINT: IS_PRODUCTION
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke',
  BASE_URL:
    cleanEnv(process.env.MPESA_ENDPOINT)?.replace(/\/+$/, '') ||
    (IS_PRODUCTION ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'),
};

console.log('MPESA_CONFIG loaded:');
console.log('  BASE_URL:', MPESA_CONFIG.BASE_URL);
console.log('  SHORTCODE:', MPESA_CONFIG.SHORTCODE);
console.log('  TRANSACTION_TYPE:', MPESA_CONFIG.TRANSACTION_TYPE);
console.log('  CONSUMER_KEY:', MPESA_CONFIG.CONSUMER_KEY ? 'Set' : 'Missing');
console.log('  CONSUMER_SECRET:', MPESA_CONFIG.CONSUMER_SECRET ? 'Set' : 'Missing');
console.log('  PASSKEY:', MPESA_CONFIG.PASSKEY ? 'Set' : 'Missing');
console.log('');

const getAuthToken = async () => {
  try {
    if (!MPESA_CONFIG.CONSUMER_KEY || !MPESA_CONFIG.CONSUMER_SECRET) {
      throw new Error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET');
    }

    const authString = `${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`;
    const auth = Buffer.from(authString).toString('base64');
    const oauthUrl = `${MPESA_CONFIG.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    console.log('OAuth Request:');
    console.log('  URL:', oauthUrl);
    console.log('  Auth String (first 20 chars):', authString.substring(0, 20) + '...');
    console.log('  Base64 Auth (first 20 chars):', auth.substring(0, 20) + '...');

    const response = await axios.get(oauthUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log('OAuth Response Status:', response.status);

    if (response.status !== 200) {
      console.error('OAuth Error Response:', response.data);
      throw new Error(
        `OAuth failed with status ${response.status}. Daraja rejected the consumer key/secret for ${MPESA_CONFIG.BASE_URL}. ` +
        `Response: ${JSON.stringify(response.data)}`
      );
    }

    console.log('OAuth Success - Token received');
    return response.data.access_token;
  } catch (err) {
    console.error('OAuth Error Details:');
    console.error('  Message:', err.message);
    console.error('  Code:', err.code);

    if (err.response) {
      console.error('  Response Status:', err.response.status);
      console.error('  Response Data:', err.response.data);
      console.error('  Request Headers:', JSON.stringify(err.config?.headers, null, 2));
    }

    throw err;
  }
};

const normalizePhone = (phone) => {
  let cleaned = phone.toString().replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }

  return cleaned;
};

const stkPush = async (phoneNumber, amount, accountReference, transactionDesc, callbackUrl) => {
  try {
    console.log('\nStarting STK Push...');

    if (!MPESA_CONFIG.PASSKEY) {
      throw new Error('Missing MPESA_PASSKEY');
    }

    const token = await getAuthToken();
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');
    const normalizedPhone = normalizePhone(phoneNumber);
    const intAmount = Math.round(parseFloat(amount));
    const resolvedCallbackUrl = callbackUrl || MPESA_CONFIG.CALLBACK_URL;

    if (!resolvedCallbackUrl) {
      throw new Error('Missing MPESA_CALLBACK_URL');
    }

    console.log('STK Push Config:');
    console.log('  Timestamp:', timestamp);
    console.log('  Phone:', normalizedPhone);
    console.log('  Amount:', intAmount);
    console.log('  Shortcode:', MPESA_CONFIG.SHORTCODE);
    console.log('  Transaction Type:', MPESA_CONFIG.TRANSACTION_TYPE);
    console.log('  Callback URL:', resolvedCallbackUrl);

    const payload = {
      BusinessShortCode: MPESA_CONFIG.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: MPESA_CONFIG.TRANSACTION_TYPE,
      Amount: intAmount,
      PartyA: normalizedPhone,
      PartyB: MPESA_CONFIG.SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: resolvedCallbackUrl,
      AccountReference: String(accountReference).substring(0, 12),
      TransactionDesc: String(transactionDesc).substring(0, 13)
    };

    console.log('Sending STK Push request...');

    const response = await axios.post(
      `${MPESA_CONFIG.BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: () => true
      }
    );

    console.log('STK Response Status:', response.status);

    if (response.status !== 200) {
      console.error('STK Error:', response.data);
      throw new Error(`STK Push failed: ${JSON.stringify(response.data)}`);
    }

    console.log('STK Push Success:', response.data);
    return response.data;
  } catch (err) {
    console.error('STK Push Error:', err.message);

    if (err.response) {
      console.error('  Status:', err.response.status);
      console.error('  Data:', err.response.data);
    }

    throw new Error(`M-Pesa STK push failed: ${err.message}`);
  }
};

module.exports = {
  stkPush,
  getAuthToken,
  normalizePhone
};
