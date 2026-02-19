import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// ✅ VALIDATE TWILIO CREDENTIALS ON STARTUP
const validateTwilioConfig = () => {
  const required = {
    SID: process.env.TWILIO_ACCOUNT_SID,
    TOKEN: process.env.TWILIO_AUTH_TOKEN,
    PHONE: process.env.TWILIO_PHONE_NUMBER
  };

  const missing = Object.entries(required)
    .filter(([_, val]) => !val)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(`
⚠️  TWILIO INCOMPLETE CONFIGURATION
Missing: ${missing.join(', ')}

📝 Setup Instructions:
1. Go to https://console.twilio.com
2. Copy Account SID and Auth Token
3. Get a Twilio Phone Number with SMS capability
4. Add to .env file:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_PHONE_NUMBER=+1234567890

⚠️  SMS WILL NOT WORK until credentials are added.
    OTP will be shown in response for testing.
    `);
    return false;
  }

  console.log(`
✅ TWILIO CONFIGURATION VALID
├─ Account SID: ${process.env.TWILIO_ACCOUNT_SID.slice(0, 8)}...
├─ Phone: ${process.env.TWILIO_PHONE_NUMBER}
└─ SMS Status: ENABLED
  `);

  return true;
};

// ✅ INITIALIZE TWILIO CLIENT
let twilioClient = null;
let isTwilioConfigured = false;

try {
  isTwilioConfigured = validateTwilioConfig();
  
  if (isTwilioConfigured) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized successfully\n');
  } else {
    console.log('⚠️  Twilio client will not send real SMS\n');
  }
} catch (error) {
  console.error('❌ Twilio initialization error:', error.message);
  isTwilioConfigured = false;
}

// ✅ EXPORT CONFIG
export { twilioClient, isTwilioConfigured };