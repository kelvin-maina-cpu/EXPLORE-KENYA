const axios = require('axios');
require('dotenv').config();

async function debugTest() {
  console.log('🔍 Checking configuration...\n');
  
  // Check env vars
  console.log('MPESA_ENDPOINT:', process.env.MPESA_ENDPOINT);
  console.log('MPESA_SHORTCODE:', process.env.MPESA_SHORTCODE);
  console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL);
  console.log('');
  
  try {
    // Test 1: Get Auth Token
    console.log('1️⃣ Testing OAuth...');
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const authResponse = await axios.get(
      `${process.env.MPESA_ENDPOINT}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000
      }
    );
    console.log('✅ Auth Token:', authResponse.data.access_token.substring(0, 20) + '...\n');
    
    // Test 2: Prepare STK Push
    console.log('2️⃣ Preparing STK Push...');
    const token = authResponse.data.access_token;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    
    console.log('Timestamp:', timestamp, '(length:', timestamp.length + ')');
    
    const passwordString = `${shortcode}${passkey}${timestamp}`;
    const password = Buffer.from(passwordString).toString('base64');
    console.log('Password generated:', password.substring(0, 20) + '...\n');
    
    // Test 3: Send STK Push
    console.log('3️⃣ Sending STK Push...');
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: 1,
      PartyA: "254708374149",
      PartyB: shortcode,
      PhoneNumber: "254708374149",
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "TEST",
      TransactionDesc: "Test"
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');
    console.log('URL:', `${process.env.MPESA_ENDPOINT}/mpesa/stkpush/v1/processrequest`);
    console.log('');
    
    const response = await axios.post(
      `${process.env.MPESA_ENDPOINT}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      }
    );
    
    console.log('✅ SUCCESS:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request URL:', error.config?.url);
    console.error('Request Data:', error.config?.data);
  }
}

debugTest();
