# Phone OTP Authentication Migration Guide

## Overview

The authentication system has been migrated from email/password to phone number-based OTP authentication. This document explains the changes and how to set up the new system.

## Architecture

### Backend (auth folder)
- **Location:** `c:\Users\Sohom Roy\OneDrive\Desktop\wholerepo\auth\`
- **Technology:** Node.js + Express + Firebase Admin SDK
- **Purpose:** Handles OTP generation, verification, and user management

### Frontend (ShowcaseX-clean)
- **Technology:** React Native + Expo
- **Purpose:** Sends API requests to backend for authentication

## Setup Instructions

### 1. Backend Setup

Navigate to the auth backend folder:
```bash
cd "c:\Users\Sohom Roy\OneDrive\Desktop\wholerepo\auth"
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
```bash
# Copy .env.example to .env
copy .env.example .env
```

Edit `.env` file:
```env
PORT=3000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_PATH=./serviceAccountKey.json
NODE_ENV=development

# For Expo development - allow all origins
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Get Firebase service account key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json` in the `auth` folder

Enable Phone Authentication in Firebase:
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Phone** provider

Start the backend server:
```bash
# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm run build
npm start
```

The server will run on `http://localhost:3000`

### 2. Frontend Setup

Update the API URL in the frontend:

Edit `src\services\auth.ts` and update the API_URL:
```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api/auth'  // For local development
  : 'https://your-production-api.com/api/auth';  // For production
```

For testing on physical device or emulator, use your computer's local IP:
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api/auth'  // Replace with your local IP
  : 'https://your-production-api.com/api/auth';
```

### 3. Find Your Local IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your active network adapter.

### 4. Test the Setup

1. Start the backend server:
```bash
cd auth
npm run dev
```

2. Start the Expo app:
```bash
cd ShowcaseX-clean
npm start
```

3. Test OTP flow:
   - Open the app
   - Go to Sign Up or Sign In
   - Enter a phone number (Indian format: 10 digits starting with 6-9)
   - Click "Send OTP"
   - Check the backend console for the OTP (in development mode)
   - Enter the OTP and complete authentication

## Changes Made

### Backend Files Created
- `auth/src/server.ts` - Express server setup
- `auth/src/config/firebase.ts` - Firebase Admin SDK initialization
- `auth/src/controllers/authController.ts` - OTP send/verify logic
- `auth/src/routes/authRoutes.ts` - API routes
- `auth/src/utils/responseHandler.ts` - Response utilities
- `auth/package.json` - Dependencies
- `auth/README.md` - Backend documentation

### Frontend Files Modified
- `src/services/auth.ts` - Updated to use phone OTP instead of email/password
- `src/screens/SignUpScreen.tsx` - Phone number + OTP fields
- `src/screens/SignInScreen.tsx` - Phone number + OTP fields

### Key Changes in Frontend

**SignUpScreen:**
- Removed: Email, Password, Confirm Password fields
- Added: Phone Number field with "Send OTP" button
- Added: OTP input field (appears after OTP is sent)
- Added: OTP timer (5 minutes countdown)
- Removed: Google Sign-In button

**SignInScreen:**
- Removed: Email, Password fields
- Added: Phone Number field with "Send OTP" button
- Added: OTP input field
- Added: OTP timer

**auth.ts service:**
- Removed: `signUp()`, `signIn()` with email/password
- Added: `sendOTP()` - Sends OTP to phone number
- Added: `verifyOTP()` - Verifies OTP and authenticates user
- Updated: Profile fetch/save to use backend API

## API Endpoints

### Send OTP
```
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}
```

### Verify OTP
```
POST http://localhost:3000/api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "otp": "123456",
  "userData": {
    "fullName": "John Doe",
    "state": "Maharashtra",
    "district": "Mumbai",
    "role": "farmer",
    "farmerType": "small",
    "landSize": "2"
  }
}
```

### Get User Profile
```
GET http://localhost:3000/api/auth/profile/:uid
```

### Update User Profile
```
PUT http://localhost:3000/api/auth/profile/:uid
Content-Type: application/json

{
  "userData": {
    "fullName": "John Smith",
    "state": "Karnataka"
  }
}
```

## Phone Number Format

The system accepts Indian phone numbers in the following formats:
- `9876543210` (10 digits, will be converted to +91 format)
- `919876543210` (11 digits with country code)
- `+919876543210` (E.164 format - recommended)

Valid first digit: 6, 7, 8, or 9

## Security Features

- **OTP Expiration:** OTPs expire after 5 minutes
- **Attempt Limiting:** Maximum 3 verification attempts per OTP
- **Rate Limiting:** Prevents abuse with configurable limits
- **Phone Validation:** Validates Indian phone number format
- **CORS Protection:** Configurable allowed origins

## Development Notes

1. **OTP in Development Mode:**
   - In development, OTP is logged to the backend console
   - OTP is also included in the API response for testing
   - In production, only send OTP via SMS service

2. **OTP Storage:**
   - Currently stored in memory (Map)
   - For production, use Redis or similar for persistence

3. **SMS Integration:**
   - Integrate Twilio, AWS SNS, or other SMS service in production
   - Update `authController.ts` to send actual SMS

## Production Deployment

### Backend Deployment Options

**Option 1: Traditional Hosting (Heroku, DigitalOcean, AWS)**
```bash
cd auth
npm run build
npm start
```

**Option 2: Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY serviceAccountKey.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Option 3: Serverless (AWS Lambda, Google Cloud Functions)**
- Modify to use serverless framework
- Deploy functions for each endpoint

### Update Frontend for Production

In `src/services/auth.ts`:
```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api/auth'
  : 'https://your-production-backend.com/api/auth';
```

## Troubleshooting

### "Cannot connect to backend"
- Ensure backend server is running
- Check API_URL in `src/services/auth.ts`
- Verify firewall allows connections on port 3000
- For physical device testing, use local IP instead of localhost

### "OTP not received"
- Check backend console for OTP (development mode)
- Verify phone number format (10 digits, starting with 6-9)
- Check backend logs for errors

### "Firebase Admin not initialized"
- Ensure `serviceAccountKey.json` exists in auth folder
- Verify `FIREBASE_PRIVATE_KEY_PATH` in `.env`
- Check Firebase project ID is correct

### "CORS error"
- Update `ALLOWED_ORIGINS` in backend `.env`
- For Expo development, use `*` to allow all origins
- For production, specify exact frontend URLs

## Migration Checklist

- [x] Backend server created with OTP endpoints
- [x] Firebase Admin SDK configured
- [x] SignUpScreen updated for phone OTP
- [x] SignInScreen updated for phone OTP
- [x] auth.ts service updated
- [x] Google Sign-In removed (not needed for OTP flow)
- [ ] Update Firebase security rules (if needed)
- [ ] Test complete signup flow
- [ ] Test complete signin flow
- [ ] Test profile update
- [ ] Deploy backend to production
- [ ] Integrate SMS service for production
- [ ] Update frontend API_URL for production

## Support

For issues or questions:
1. Check backend console logs
2. Check frontend console logs
3. Verify all environment variables are set correctly
4. Ensure Firebase phone authentication is enabled

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Express.js Documentation](https://expressjs.com/)
- [Expo Documentation](https://docs.expo.dev/)
