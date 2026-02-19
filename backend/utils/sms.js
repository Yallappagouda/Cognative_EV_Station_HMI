import { twilioClient, isTwilioConfigured } from '../config/twilio.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ✅ SANITIZE PHONE NUMBER
 * Removes all non-numeric characters
 * Format: 9876543210 → +919876543210
 */
export const sanitizePhoneNumber = (phone, countryCode = '91') => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error(`Invalid phone length: ${cleaned.length}. Expected 10-15 digits.`);
  }

  // Remove country code if already included
  let finalNumber = cleaned;
  if (cleaned.startsWith(countryCode)) {
    finalNumber = cleaned.slice(countryCode.length);
  }

  // Validate 10-digit number
  if (finalNumber.length !== 10) {
    throw new Error(`Invalid phone format. Expected 10 digits, got ${finalNumber.length}`);
  }

  // Format with country code
  return `+${countryCode}${finalNumber}`;
};

/**
 * ✅ SEND OTP VIA SMS
 * Uses Twilio API with fallback for dev mode
 */
export const sendOtpSms = async (phoneNumber, otp) => {
  try {
    // Validate phone number format
    const formattedPhone = sanitizePhoneNumber(phoneNumber);
    console.log(`📱 Attempting to send SMS to: ${formattedPhone}`);

    // ✅ CHECK IF TWILIO IS CONFIGURED
    if (!isTwilioConfigured) {
      console.warn('⚠️  Twilio not configured - returning OTP in response');
      return {
        success: true,
        method: 'fallback',
        message: 'SMS fallback mode (development)',
        phone: formattedPhone,
        otp: process.env.SHOW_OTP_IN_RESPONSE === 'true' ? otp : undefined
      };
    }

    // ✅ SEND VIA TWILIO
    const message = await twilioClient.messages.create({
      body: `Your VoltCharge OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ SMS sent successfully`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   To: ${message.to}`);
    console.log(`   Status: ${message.status}`);

    return {
      success: true,
      method: 'twilio',
      message: 'OTP sent successfully',
      phone: formattedPhone,
      sid: message.sid,
      status: message.status
      // DON'T return OTP in production
    };

  } catch (error) {
    console.error('❌ SMS Send Error:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      details: error.details
    });

    // ✅ DETAILED ERROR MESSAGES FOR DEBUGGING
    let errorReason = 'Failed to send SMS';

    if (error.code === 21211 || error.message.includes('invalid')) {
      errorReason = 'Invalid phone number format';
    } else if (error.code === 21003 || error.message.includes('account')) {
      errorReason = 'Invalid Twilio credentials';
    } else if (error.code === 20003 || error.message.includes('suspended')) {
      errorReason = 'Twilio account suspended or trial expired';
    } else if (error.message.includes('unverified')) {
      errorReason = 'Number not verified on Twilio trial account';
    }

    throw {
      type: 'SMS_ERROR',
      message: errorReason,
      twilioCode: error.code,
      twilioMessage: error.message,
      originalError: process.env.NODE_ENV === 'development' ? error : null
    };
  }
};

/**
 * ✅ FORMAT ERROR RESPONSE FOR FRONTEND
 */
export const formatSmsError = (error) => {
  if (error.type === 'SMS_ERROR') {
    return {
      success: false,
      message: error.message,
      code: error.twilioCode,
      hint: getErrorHint(error.message)
    };
  }
  return {
    success: false,
    message: 'Failed to send OTP',
    error: error.message
  };
};

/**
 * ✅ HELPFUL ERROR HINTS FOR USERS
 */
const getErrorHint = (message) => {
  if (message.includes('Invalid phone')) {
    return 'Please check your phone number and try again';
  }
  if (message.includes('verified')) {
    return 'Contact Twilio support to verify your phone number on trial account';
  }
  if (message.includes('credentials') || message.includes('suspended')) {
    return 'Server configuration issue - please contact support';
  }
  return 'Please try again or contact support';
};