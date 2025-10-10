const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api'; // Direct backend URL
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlVzZXIiXSwicGVybWlzc2lvbnMiOlsiUkVBRF9VU0VSUyIsIlZJRVdfUkVQT1JUUyJdLCJpYXQiOjE3NjAwODg2MjQsImV4cCI6MTc2MDE3NTAyNH0.u22MzoUZi5bVthzhYX8CZt_Ls7kpR4cSiJKxrocyEHs';

async function testDashboardAPIs() {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🧪 Testing Dashboard APIs...\n');

    // Test stats endpoint
    console.log('1. Testing /dashboard/stats');
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats`, { headers });
    console.log('✅ Stats:', JSON.stringify(statsResponse.data, null, 2));

    // Test activities endpoint
    console.log('\n2. Testing /dashboard/activities');
    const activitiesResponse = await axios.get(`${BASE_URL}/dashboard/activities?limit=5`, { headers });
    console.log('✅ Activities:', JSON.stringify(activitiesResponse.data, null, 2));

    // Test chart data endpoint
    console.log('\n3. Testing /dashboard/chart-data');
    const chartResponse = await axios.get(`${BASE_URL}/dashboard/chart-data?period=week`, { headers });
    console.log('✅ Chart Data:', JSON.stringify(chartResponse.data, null, 2));

    // Test quick stats endpoint
    console.log('\n4. Testing /dashboard/quick-stats');
    const quickStatsResponse = await axios.get(`${BASE_URL}/dashboard/quick-stats`, { headers });
    console.log('✅ Quick Stats:', JSON.stringify(quickStatsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboardAPIs();