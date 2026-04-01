const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });

async function testOAuth() {
  const key = process.env.MPESA_CONSUMER_KEY?.trim();
  const secret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const endpoint = process.env.MPESA_ENDPOINT?.trim() || 'https://sandbox.safaricom.co.ke';

  console.log('Testing OAuth...\n');
  console.log('Endpoint:', endpoint);
  console.log('Key Length:', key?.length);
  console.log('Secret Length:', secret?.length);
  console.log('Key Preview:', key ? `${key.substring(0, 10)}...` : 'Missing');
  console.log('Secret Preview:', secret ? `${secret.substring(0, 10)}...` : 'Missing');
  console.log('');

  if (!key || !secret) {
    console.error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in .env');
    process.exit(1);
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = `${endpoint.replace(/\/+$/, '')}/oauth/v1/generate?grant_type=client_credentials`;

  console.log('Request URL:', url);
  console.log('Authorization Prefix:', `${auth.substring(0, 20)}...`);
  console.log('');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status !== 200) {
      console.error('\nOAuth request was rejected by Safaricom.');
      process.exit(1);
    }

    console.log('\nOAuth succeeded.');
    console.log('Access Token Preview:', `${response.data.access_token.substring(0, 20)}...`);
    console.log('Expires In:', response.data.expires_in);
  } catch (error) {
    console.error('OAuth request failed before a usable response was returned.');
    console.error('Message:', error.message);
    console.error('Code:', error.code);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }

    process.exit(1);
  }
}

testOAuth();
