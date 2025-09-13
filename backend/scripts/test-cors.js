const axios = require('axios');

const testCORS = async () => {
  const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
  
  console.log('🧪 Testing CORS Configuration...\n');
  
  // Test 1: Health endpoint
  try {
    console.log('Test 1: Health Check');
    const response = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check passed:', response.data.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: CORS test endpoint
  try {
    console.log('\nTest 2: CORS Test Endpoint');
    const response = await axios.get(`${baseURL}/api/cors-test`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ CORS test passed:', response.data.message);
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }
  
  // Test 3: Preflight request simulation
  try {
    console.log('\nTest 3: OPTIONS Preflight Request');
    const response = await axios.options(`${baseURL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ Preflight request passed');
  } catch (error) {
    console.log('❌ Preflight request failed:', error.message);
  }
  
  console.log('\n📋 CORS Test Summary:');
  console.log('- Make sure your backend is running on port 5000');
  console.log('- Make sure your frontend is running on port 3000');
  console.log('- Check server logs for CORS debug information');
};

// Run the test
testCORS().catch(console.error);