#!/usr/bin/env node
/**
 * Test script for Signup and Login
 * Run with: node test_auth.js
 * 
 * Make sure VITE_API_BASE is set or update API_URL below
 */

const API_URL = process.env.VITE_API_BASE || process.env.API_BASE_URL || 'http://localhost:8000';

// Test credentials
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123456';
const TEST_NAME = 'Test User';

async function testSignup() {
  console.log('\n🧪 TESTING SIGNUP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  console.log(`Name: ${TEST_NAME}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
      })
    });

    const data = await response.json();
    
    console.log(`\nStatus: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.access_token) {
      console.log('✅ SIGNUP SUCCESS!');
      console.log(`   Access Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`   User ID: ${data.user?.id}`);
      return { success: true, token: data.access_token, email: TEST_EMAIL };
    } else if (data.requires_confirmation) {
      console.log('✅ SIGNUP SUCCESS (Email confirmation required)');
      console.log(`   Message: ${data.message}`);
      return { success: true, requiresConfirmation: true, email: TEST_EMAIL };
    } else {
      console.log('❌ SIGNUP FAILED');
      console.log(`   Error: ${data.detail || data.message}`);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ SIGNUP ERROR');
    console.log(`   ${error.message}`);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
      console.log('   ⚠️  Backend not reachable. Check if backend is running.');
    }
    return { success: false, error: error.message };
  }
}

async function testLogin(email, password) {
  console.log('\n🧪 TESTING LOGIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();
    
    console.log(`\nStatus: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.access_token) {
      console.log('✅ LOGIN SUCCESS!');
      console.log(`   Access Token: ${data.access_token.substring(0, 20)}...`);
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   User Email: ${data.user?.email}`);
      console.log(`   Onboarding Completed: ${data.user?.onboarding_completed || false}`);
      return { success: true, token: data.access_token, user: data.user };
    } else {
      console.log('❌ LOGIN FAILED');
      console.log(`   Error: ${data.detail || data.message}`);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ LOGIN ERROR');
    console.log(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAuthMe(token) {
  console.log('\n🧪 TESTING /auth/me');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ AUTH/ME SUCCESS!');
      return { success: true };
    } else {
      console.log('❌ AUTH/ME FAILED');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ AUTH/ME ERROR');
    console.log(`   ${error.message}`);
    return { success: false };
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 AUTHENTICATION TEST SUITE');
  console.log('====================================================');
  console.log(`Testing against: ${API_URL}`);
  console.log('====================================================');
  
  // Test 1: Signup
  const signupResult = await testSignup();
  
  if (signupResult.success && !signupResult.requiresConfirmation) {
    // Wait a moment before login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Login
    const loginResult = await testLogin(TEST_EMAIL, TEST_PASSWORD);
    
    if (loginResult.success && loginResult.token) {
      // Wait a moment before auth/me
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 3: Verify token
      await testAuthMe(loginResult.token);
    }
  } else if (signupResult.requiresConfirmation) {
    console.log('\n⚠️  Email confirmation required - cannot test login');
    console.log('   Please check email and confirm account first');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST SUITE COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run tests
runTests().catch(console.error);

