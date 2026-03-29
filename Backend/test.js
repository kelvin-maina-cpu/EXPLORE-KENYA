const axios = require('axios');

async function test() {
  try {
    console.log('🧪 Testing M-Pesa STK Push...\n');

    const response = await axios.post('http://localhost:5000/api/mpesa/stk-push', {
      phoneNumber: '254708374149',
      amount: 1,
      description: 'Standalone Test'
      // ❌ Removed: bookingId: 'test-001'
    });

    console.log('✅ Success:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

test();
