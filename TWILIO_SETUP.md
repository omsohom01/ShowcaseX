# Twilio SMS OTP Authentication Setup Guide

This guide will help you set up Twilio for SMS-based OTP authentication in your ShowcaseX application.

## Overview

The application now uses phone number-based authentication with SMS OTP verification powered by Twilio. Users sign up and sign in using only their phone number, and email is optional.

## Prerequisites

- A Twilio account (free trial or paid)
- Node.js and npm installed
- Access to your project's environment variables

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free Twilio account
3. Verify your email and phone number
4. Complete the getting started wizard

## Step 2: Get Your Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. From the dashboard, you'll see:
   - **Account SID** - Your unique account identifier
   - **Auth Token** - Your authentication token (click "Show" to reveal it)
3. Save these credentials securely - you'll need them later

## Step 3: Create a Twilio Verify Service

Twilio Verify is a service specifically designed for OTP verification:

1. In the Twilio Console, navigate to **Explore Products** → **Verify**
2. Click **Create Service**
3. Give your service a friendly name (e.g., "ShowcaseX Auth")
4. Click **Create**
5. Copy the **Service SID** (starts with "VA...")

## Step 4: Set Up Backend API (IMPORTANT)

⚠️ **Security Note**: You should NEVER expose your Twilio credentials directly in your React Native app. Instead, create a backend API that handles Twilio calls.

### Option A: Create a Simple Express.js Backend

Create a new Node.js/Express backend project:

```bash
mkdir showcasex-auth-api
cd showcasex-auth-api
npm init -y
npm install express twilio cors dotenv
```

Create `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
PORT=3000
```

Create `server.js`:

```javascript
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });

    res.json({ 
      success: true, 
      sid: verification.sid,
      status: verification.status 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code 
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        error: 'Phone number and code are required' 
      });
    }

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    res.json({ 
      success: true, 
      valid: verificationCheck.status === 'approved',
      status: verificationCheck.status 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth API server running on port ${PORT}`);
});
```

Start your backend:

```bash
node server.js
```

### Option B: Use Firebase Cloud Functions

Alternatively, deploy the same logic as Firebase Cloud Functions:

```bash
npm install firebase-functions firebase-admin twilio
```

See Firebase documentation for deploying functions.

### Option C: Use Other Backend Services

You can also use:
- AWS Lambda + API Gateway
- Google Cloud Functions
- Vercel Serverless Functions
- Netlify Functions

## Step 5: Configure Your React Native App

### Update Environment Variables

Create or update `.env` file in your React Native project root:

```env
# Twilio API Endpoint (your backend URL)
EXPO_PUBLIC_TWILIO_API_ENDPOINT=http://localhost:3000/api

# For production, use your deployed backend URL:
# EXPO_PUBLIC_TWILIO_API_ENDPOINT=https://your-api.com/api

# Direct Twilio Credentials (ONLY FOR TESTING - NOT RECOMMENDED)
# EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
# EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token
# EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

### Update app.config.js

Add environment variables to your Expo config:

```javascript
export default {
  // ... other config
  extra: {
    twilioApiEndpoint: process.env.EXPO_PUBLIC_TWILIO_API_ENDPOINT,
  },
};
```

## Step 6: Test Your Setup

1. Start your backend API server:
   ```bash
   cd showcasex-auth-api
   node server.js
   ```

2. Start your React Native app:
   ```bash
   cd ShowcaseX-clean
   npm start
   ```

3. Test the sign-up flow:
   - Enter a valid phone number (must be verified in Twilio during trial)
   - Click "Send OTP"
   - Check your phone for the SMS
   - Enter the 6-digit OTP code
   - Complete sign-up

## Step 7: Production Deployment

### Deploy Your Backend

Deploy your authentication backend to a production service:

1. **Heroku**:
   ```bash
   heroku create showcasex-auth
   heroku config:set TWILIO_ACCOUNT_SID=xxx
   heroku config:set TWILIO_AUTH_TOKEN=xxx
   heroku config:set TWILIO_VERIFY_SERVICE_SID=xxx
   git push heroku main
   ```

2. **Vercel**:
   ```bash
   vercel
   # Add environment variables in Vercel dashboard
   ```

3. **AWS/GCP**: Follow their respective deployment guides

### Update Production Environment Variables

Update your `.env` file for production:

```env
EXPO_PUBLIC_TWILIO_API_ENDPOINT=https://your-production-api.com/api
```

## Troubleshooting

### Issue: "Phone number not verified"

**Solution**: During Twilio trial, you can only send SMS to verified phone numbers. Either:
- Verify your test phone number in Twilio Console → Phone Numbers → Verified Caller IDs
- Upgrade to a paid Twilio account

### Issue: "Network error"

**Solution**: 
- Ensure your backend API is running and accessible
- Check that `EXPO_PUBLIC_TWILIO_API_ENDPOINT` is correctly set
- Verify CORS is enabled on your backend

### Issue: "Invalid credentials"

**Solution**:
- Double-check your Account SID, Auth Token, and Verify Service SID
- Ensure environment variables are loaded correctly
- Restart your backend server after changing `.env`

### Issue: "Rate limit exceeded"

**Solution**:
- Twilio has rate limits on trial accounts
- Wait a few minutes before trying again
- Consider implementing rate limiting on your backend

## Security Best Practices

1. ✅ **Never expose Twilio credentials in your app** - Always use a backend API
2. ✅ **Use HTTPS** for your backend API in production
3. ✅ **Implement rate limiting** to prevent SMS spam
4. ✅ **Validate phone numbers** before sending OTP
5. ✅ **Set OTP expiration** (Twilio default is 10 minutes)
6. ✅ **Monitor usage** in Twilio Console to avoid unexpected charges

## Costs

- **Trial Account**: $15 free credit, can only send to verified numbers
- **Pay-as-you-go**: ~$0.0075 per SMS (varies by country)
- **Twilio Verify**: $0.05 per verification attempt

## Additional Resources

- [Twilio Verify Documentation](https://www.twilio.com/docs/verify/api)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Twilio Console](https://console.twilio.com/)

## Support

If you encounter issues:
1. Check the [Twilio Status Page](https://status.twilio.com/)
2. Review [Twilio Error Codes](https://www.twilio.com/docs/api/errors)
3. Contact Twilio Support for account-specific issues

---

**Note**: The authentication flow now uses phone numbers as the primary identifier. Email is optional and only used for account recovery purposes.
