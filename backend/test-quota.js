const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testQuotaSystem() {
  try {
    console.log('🚀 Testing Quota System...\n');

    // 1. Login to get token
    console.log('1. Attempting login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }).catch(err => {
      console.log('Login failed, trying with different credentials...');
      return axios.post(`${BASE_URL}/auth/login`, {
        username: 'testuser',
        password: 'password123'
      });
    });

    if (!loginResponse.data.access_token) {
      console.log('❌ Login failed. Let\'s try to register a new user...');
      
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'quotatest',
        password: 'password123',
        email: 'quotatest@example.com'
      });
      
      console.log('✅ User registered successfully');
      
      // Login with new user
      const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'quotatest',
        password: 'password123'
      });
      
      token = newLoginResponse.data.access_token;
    } else {
      token = loginResponse.data.access_token;
    }

    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // 2. Check quota status
    console.log('2. Checking quota status...');
    const quotaResponse = await axios.get(`${BASE_URL}/quota/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Quota Status:', quotaResponse.data);
    console.log();

    // 3. Test lookup API with quota
    console.log('3. Testing lookup API with quota checking...');
    const lookupResponse = await axios.post(`${BASE_URL}/lookup/query`, {
      colName: 'uid',
      values: ['test123'],
      page: 1,
      limit: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Lookup API call successful');
    console.log('Response:', lookupResponse.data);
    console.log();

    // 4. Check quota status after API call
    console.log('4. Checking quota status after API call...');
    const quotaAfterResponse = await axios.get(`${BASE_URL}/quota/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Updated Quota Status:', quotaAfterResponse.data);
    console.log();

    console.log('🎉 Quota system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('✅ Quota limit working! API returned 429 Too Many Requests');
    }
  }
}

testQuotaSystem();