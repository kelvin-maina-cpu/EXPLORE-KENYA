const axios = require('axios');

// Config - Update w/ your local/ngrok URL
const BASE_URL = 'http://localhost:5000/api'; // Change to ngrok for full callback testing

async function testMpesaFlow() {
  console.log('🧪 M-Pesa Sandbox Testing...\n');

  try {
    // 1. STK Push
    console.log('1️⃣ STK Push...');
    const stkRes = await axios.post(`${BASE_URL}/mpesa/stk-push`, {
      phoneNumber: '254708374149', // Sandbox test phone
      amount: 1,
      bookingId: 'test-bk-123',
      description: 'Sandbox test'
    });
    console.log('✅ STK:', stkRes.data.data);
    const checkoutId = stkRes.data.data.checkoutRequestId;

    // 2. Wait for sandbox auto-complete (~10s)
    console.log('⏳ Waiting 15s for payment...\n');
    await new Promise(r => setTimeout(r, 15000));

    // 3. Query status
    console.log('2️⃣ Query status...');
    const queryRes = await axios.get(`${BASE_URL}/mpesa/query/${checkoutId}`);
    console.log('✅ Status:', queryRes.data.data);

    // 4. Debug callbacks/DB
    console.log('\n3️⃣ Debug transactions...');
    const debugRes = await axios.get(`${BASE_URL}/mpesa/debug-callbacks`);
    console.log('DB:', debugRes.data);

    console.log('\n🎉 SUCCESS! Check MongoDB Transactions/Bookings.');
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

testMpesaFlow();

