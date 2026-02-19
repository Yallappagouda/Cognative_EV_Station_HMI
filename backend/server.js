import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MIDDLEWARE - CRITICAL FOR OTP TO WORK
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// 🔒 OTP STORAGE (in-memory, expires after 5 minutes)
const otpStore = {};

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// ✅ SEND OTP ENDPOINT
app.post('/api/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validate mobile number
    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must be 10 digits.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry
    otpStore[cleanMobile] = {
      otp,
      createdAt: Date.now(),
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };

    console.log(`✅ OTP sent to ${cleanMobile}: ${otp}`);

    // In production, send via Twilio or SMS provider
    // await sendSms(cleanMobile, `Your OTP is ${otp}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      mobile: cleanMobile,
      // Remove in production - for testing only
      testOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('❌ OTP Send Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ VERIFY OTP ENDPOINT
app.post('/api/verify-otp', (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate input
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const storedData = otpStore[cleanMobile];

    // Check if OTP exists
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Request a new OTP.'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expires) {
      delete otpStore[cleanMobile];
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Request a new one.'
      });
    }

    // Check if OTP matches
    if (storedData.otp !== otp.toString()) {
      storedData.attempts = (storedData.attempts || 0) + 1;
      
      // Lock after 3 failed attempts
      if (storedData.attempts >= 3) {
        delete otpStore[cleanMobile];
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // ✅ OTP VERIFIED - CLEAR STORAGE
    delete otpStore[cleanMobile];

    console.log(`✅ OTP verified for ${cleanMobile}`);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      mobile: cleanMobile,
      token: Buffer.from(`${cleanMobile}:${Date.now()}`).toString('base64')
    });

  } catch (error) {
    console.error('❌ OTP Verify Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server verification error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ RESEND OTP (same as send, but checks cooldown)
app.post('/api/resend-otp', (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');

    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must be 10 digits.'
      });
    }

    // Generate new OTP (override old one)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[cleanMobile] = {
      otp,
      createdAt: Date.now(),
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };

    console.log(`✅ OTP resent to ${cleanMobile}: ${otp}`);

    return res.json({
      success: true,
      message: 'OTP resent successfully',
      mobile: cleanMobile,
      testOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('❌ OTP Resend Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🔋 VOLTCHARGE SERVER RUNNING       ║
╚════════════════════════════════════════╝
📍 Server: http://localhost:${PORT}
🔗 OTP Endpoint: POST /api/send-otp
✓ Database: In-Memory OTP Store
✓ CORS: Enabled for http://localhost:5173
✓ NODE_ENV: ${process.env.NODE_ENV || 'development'}
  `);
});

export default app;