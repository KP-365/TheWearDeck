/**
 * Browser Console Test for Signup and Login
 * 
 * TO USE:
 * 1. Go to: https://theweardeck.vercel.app
 * 2. Open Browser Console (F12 → Console tab)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * This will test signup and login using your deployed frontend's API configuration
 */

(async function testAuth() {
  console.log('🧪 STARTING AUTHENTICATION TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Generate unique test credentials
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Test User';
  
  console.log(`\n📧 Test Email: ${testEmail}`);
  console.log(`🔑 Test Password: ${testPassword}`);
  console.log(`👤 Test Name: ${testName}`);
  
  // Get API URL from the page (if available)
  let apiUrl;
  try {
    // Try to get from window or import API
    if (window.API_URL) {
      apiUrl = window.API_URL;
    } else {
      // Try to read from environment
      apiUrl = import.meta?.env?.VITE_API_BASE || 'https://your-backend.onrender.com';
      console.log('⚠️  Please update API_URL with your actual backend URL');
    }
  } catch (e) {
    apiUrl = 'https://your-backend.onrender.com';
    console.log('⚠️  Please update API_URL below with your actual backend URL');
  }
  
  console.log(`\n🔗 API URL: ${apiUrl}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // TEST 1: SIGNUP
  console.log('\n\n📝 TEST 1: SIGNUP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const signupResponse = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName
      })
    });
    
    const signupData = await signupResponse.json();
    console.log(`Status: ${signupResponse.status}`);
    console.log('Response:', signupData);
    
    if (signupResponse.ok && signupData.access_token) {
      console.log('✅ SIGNUP SUCCESS!');
      console.log(`   Token: ${signupData.access_token.substring(0, 30)}...`);
      console.log(`   User ID: ${signupData.user?.id}`);
      
      // Wait before login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TEST 2: LOGIN
      console.log('\n\n🔐 TEST 2: LOGIN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        const loginResponse = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword
          })
        });
        
        const loginData = await loginResponse.json();
        console.log(`Status: ${loginResponse.status}`);
        console.log('Response:', loginData);
        
        if (loginResponse.ok && loginData.access_token) {
          console.log('✅ LOGIN SUCCESS!');
          console.log(`   Token: ${loginData.access_token.substring(0, 30)}...`);
          console.log(`   User ID: ${loginData.user?.id}`);
          console.log(`   Email: ${loginData.user?.email}`);
          console.log(`   Onboarding: ${loginData.user?.onboarding_completed || false}`);
          
          // TEST 3: VERIFY TOKEN
          console.log('\n\n🔍 TEST 3: VERIFY TOKEN (/auth/me)');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          try {
            const meResponse = await fetch(`${apiUrl}/auth/me`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.access_token}`
              }
            });
            
            const meData = await meResponse.json();
            console.log(`Status: ${meResponse.status}`);
            console.log('Response:', meData);
            
            if (meResponse.ok) {
              console.log('✅ TOKEN VERIFICATION SUCCESS!');
            } else {
              console.log('❌ TOKEN VERIFICATION FAILED');
            }
          } catch (meError) {
            console.log('❌ TOKEN VERIFICATION ERROR');
            console.log(`   ${meError.message}`);
          }
          
        } else {
          console.log('❌ LOGIN FAILED');
          console.log(`   Error: ${loginData.detail || loginData.message}`);
        }
      } catch (loginError) {
        console.log('❌ LOGIN ERROR');
        console.log(`   ${loginError.message}`);
      }
      
    } else if (signupData.requires_confirmation) {
      console.log('✅ SIGNUP SUCCESS (Email confirmation required)');
      console.log(`   Message: ${signupData.message}`);
      console.log('\n⚠️  Cannot test login - email confirmation required');
    } else {
      console.log('❌ SIGNUP FAILED');
      console.log(`   Error: ${signupData.detail || signupData.message}`);
    }
  } catch (signupError) {
    console.log('❌ SIGNUP ERROR');
    console.log(`   ${signupError.message}`);
    
    if (signupError.message.includes('Failed to fetch') || signupError.message.includes('NetworkError')) {
      console.log('\n⚠️  NETWORK ERROR - Check:');
      console.log('   1. Is backend deployed and running?');
      console.log('   2. Is CORS configured correctly?');
      console.log('   3. Is API URL correct?');
    }
  }
  
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST SUITE COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();

