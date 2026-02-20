# 🔋 VoltCharge Backend - OTP SMS Service

Production-ready OTP delivery system using Twilio SMS API.

## ✅ Features

- ✅ **Twilio SMS Integration** - Real SMS delivery
- ✅ **Rate Limiting** - Prevents spam (3 requests per 60 seconds)
- ✅ **OTP Expiry** - 5-minute validity window
- ✅ **Error Handling** - Graceful fallbacks and detailed logging
- ✅ **Production Ready** - Environment-based configuration
- ✅ **Security** - No hardcoded credentials

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Twilio credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Get Twilio Credentials

1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Go to [Twilio Console](https://console.twilio.com)
3. Copy **Account SID** and **Auth Token**
4. Purchase a phone number with SMS capability
5. Add all values to `.env`

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Test OTP Service

```bash
npm test
```

## 📡 API Endpoints

### POST `/api/send-otp`

Send OTP to a mobile number.

**Request:**
```json
{
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "mobile": "9876543210",
  "smsMethod": "twilio"
}
```

### POST `/api/verify-otp`

Verify OTP code.

**Request:**
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "mobile": "9876543210",
  "token": "base64_encoded_token"
}
```

### POST `/api/resend-otp`

Resend OTP (same as send-otp with rate limiting).

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "Server running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "twilio": {
    "configured": true,
    "smsEnabled": true
  }
}
```

## 🔒 Security Features

- ✅ **Rate Limiting**: 3 requests per 60 seconds per phone number
- ✅ **OTP Expiry**: 5-minute validity window
- ✅ **Attempt Limiting**: 3 failed attempts lock OTP
- ✅ **Environment Variables**: No hardcoded secrets
- ✅ **Error Sanitization**: No internal details exposed

## 🛠️ Production Deployment

### Environment Variables Required

```env
NODE_ENV=production
PORT=5000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Deployment Checklist

- [ ] All environment variables set on production server
- [ ] `.env` file NOT committed to git
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Twilio account upgraded (trial accounts have limitations)
- [ ] Error logging configured
- [ ] Rate limiting tested

## 📊 Monitoring

Check server logs for:
- ✅ SMS delivery status
- ✅ Twilio message SIDs
- ✅ Rate limit violations
- ✅ Error details (development mode)

## 🐛 Troubleshooting

### OTP Not Sending

1. **Check Twilio Configuration**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Verify `twilio.configured: true`

2. **Check Environment Variables**
   ```bash
   # Should NOT show undefined
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

3. **Check Twilio Account Status**
   - Trial accounts can only send to verified numbers
   - Upgrade account for production use
   - Check account balance

4. **Check Server Logs**
   - Look for SMS send errors
   - Check Twilio error codes
   - Verify phone number format

### Common Twilio Errors

- **21211**: Invalid phone number format
- **21003**: Invalid credentials
- **20003**: Account suspended or trial expired
- **Unverified number**: Trial account limitation

## 📦 Dependencies

- `express` - Web framework
- `twilio` - SMS API client
- `cors` - CORS middleware
- `dotenv` - Environment variable management

## 📝 License

MIT
