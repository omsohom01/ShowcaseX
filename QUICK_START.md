# 🚀 Quick Start Guide - Phone OTP Authentication

## 5-Minute Setup (Development)

### Prerequisites
- Node.js installed
- Twilio account (free trial)
- React Native environment ready

---

## Step 1: Get Twilio Credentials (2 minutes)

1. Go to https://www.twilio.com/try-twilio
2. Sign up (free $15 credit)
3. Copy from Console Dashboard:
   - Account SID
   - Auth Token
4. Go to "Verify" → "Create Service"
   - Name it "ShowcaseX"
   - Copy Service SID

---

## Step 2: Create Backend API (2 minutes)

**Create `showcasex-auth-api/server.js`:**

```javascript
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your credentials
const client = twilio('YOUR_ACCOUNT_SID', 'YOUR_AUTH_TOKEN');
const VERIFY_SID = 'YOUR_VERIFY_SERVICE_SID';

app.post('/api/send-otp', async (req, res) => {
  try {
    const verification = await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: req.body.phoneNumber, channel: 'sms' });
    res.json({ success: true, sid: verification.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: req.body.phoneNumber, code: req.body.code });
    res.json({ success: true, valid: check.status === 'approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));
```

**Install & Run:**
```bash
cd showcasex-auth-api
npm install express twilio cors
node server.js
```

---

## Step 3: Configure App (1 minute)

**Create `.env` in ShowcaseX-clean:**
```env
EXPO_PUBLIC_TWILIO_API_ENDPOINT=http://localhost:3000/api
```

**Add to `.gitignore`:**
```
.env
```

---

## Step 4: Test (30 seconds)

```bash
# Start app
cd ShowcaseX-clean
npm start
```

1. Press "Sign Up"
2. Enter your phone number (must verify in Twilio Console first for trial)
3. Click "Send OTP"
4. Check SMS
5. Enter 6-digit code
6. Done! ✅

---

## Verify Phone Number (Trial Only)

For Twilio trial, verify test numbers:

1. Twilio Console → Phone Numbers → Verified Caller IDs
2. Click "Add new"
3. Enter your test phone number
4. Verify via call/SMS

---

## Troubleshooting

**"Backend not responding"**
```bash
# Check if backend is running
curl http://localhost:3000/api/send-otp
```

**"OTP not received"**
- Check Twilio Console → Messaging → Logs
- Verify phone number (trial accounts only)
- Check SMS credit balance

**"Invalid credentials"**
- Double-check Account SID, Auth Token, Service SID
- Ensure no extra spaces in credentials

---

## Production Deployment

### Deploy Backend (Choose One)

**Heroku:**
```bash
cd showcasex-auth-api
heroku create
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
heroku config:set TWILIO_VERIFY_SERVICE_SID=xxx
git push heroku main
```

**Vercel:**
```bash
cd showcasex-auth-api
vercel
# Add env vars in dashboard
```

### Update App Config

**.env:**
```env
EXPO_PUBLIC_TWILIO_API_ENDPOINT=https://your-api.herokuapp.com/api
```

---

## Cost Calculator

| Users/Month | SMS Cost | Verify Cost | Total |
|-------------|----------|-------------|-------|
| 100 | $1.50 | $10 | ~$12 |
| 1,000 | $15 | $100 | ~$115 |
| 10,000 | $150 | $1,000 | ~$1,150 |

*Assumes 2 SMS per user (signup + signin)*

---

## Next Steps

- ✅ Test with multiple phone numbers
- ✅ Deploy backend to production
- ✅ Upgrade Twilio account (remove trial limits)
- ✅ Add error tracking (Sentry)
- ✅ Monitor SMS costs
- ✅ Read full documentation

---

## Full Documentation

- **Complete Setup**: `TWILIO_SETUP.md`
- **Implementation Details**: `PHONE_AUTH_IMPLEMENTATION.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

**Done in 5 minutes!** 🎉

Now you have phone-based OTP authentication working in development.

For production: Deploy backend and update environment variables.
