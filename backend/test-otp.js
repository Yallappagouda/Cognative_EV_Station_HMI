import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

console.log(`
╔════════════════════════════════════════╗
║     🧪 OTP SYSTEM TEST SUITE           ║
╚════════════════════════════════════════╝

Testing: ${BASE_URL}
`);

// ✅ TEST 1: HEALTH CHECK
async function testHealth() {
  console.log('\n📍 TEST 1: Health Check');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    console.log('✅ Status:', data.status);
    console.log('✅ Twilio:', data.twilio.configured ? 'Configured' : 'Fallback Mode');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// ✅ TEST 2: SEND OTP
async function testSendOtp(mobile = '9876543210') {
  console.log(`\n📱 TEST 2: Send OTP to ${mobile}`);
  try {
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    const data = await res.json();
    
    if (data.success) {
      console.log('✅ OTP sent successfully');
      console.log('   Method:', data.smsMethod);
      if (data.testOtp) console.log('   Test OTP:', data.testOtp);
      return data.testOtp;
    } else {
      console.error('❌ Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// ✅ TEST 3: INVALID OTP
async function testInvalidOtp(mobile = '9876543210') {
  console.log(`\n🔐 TEST 3: Verify Invalid OTP`);
  try {
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp: '000000' })
    });
    const data = await res.json();
    
    if (!data.success) {
      console.log('✅ Invalid OTP rejected:', data.message);
      return true;
    } else {
      console.error('❌ Should have failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// ✅ TEST 4: VERIFY OTP
async function testVerifyOtp(mobile = '9876543210', otp = null) {
  if (!otp) {
    console.log('⏭️  SKIPPING - No OTP to verify');
    return false;
  }

  console.log(`\n✅ TEST 4: Verify OTP ${otp}`);
  try {
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    const data = await res.json();
    
    if (data.success) {
      console.log('✅ OTP verified successfully');
      console.log('   Token:', data.token.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ Error:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// ✅ RUN ALL TESTS
async function runTests() {
  try {
    const health = await testHealth();
    if (!health) {
      console.error('\n❌ Server not running. Start with: npm run dev');
      process.exit(1);
    }

    const otp = await testSendOtp('9876543210');
    await testInvalidOtp('9876543210');
    await testVerifyOtp('9876543210', otp);

    console.log(`
╔════════════════════════════════════════╗
║     ✅ TESTS COMPLETE                  ║
╚════════════════════════════════════════╝
    `);
    process.exit(0);
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  }
}

runTests();