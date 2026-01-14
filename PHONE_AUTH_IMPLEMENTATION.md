# ShowcaseX - Phone-Based Authentication Implementation

## Summary of Changes

The authentication system has been completely migrated from email/password-based authentication to **phone number-based OTP authentication using Twilio**.

## What Changed

### 1. Authentication Method
- **Before**: Email + Password required for sign up and sign in
- **After**: Phone number + SMS OTP is the primary authentication method
- Email is now **optional** and only used for account recovery

### 2. New Files Created

#### Services
- `src/services/twilio.ts` - Twilio SMS OTP integration service
  - `sendOTP()` - Sends OTP to phone number
  - `verifyOTP()` - Verifies OTP code
  - `formatPhoneNumber()` - Formats phone numbers to E.164 format
  - `isValidPhoneNumber()` - Validates Indian phone numbers

#### Updated Services
- `src/services/auth.ts` - Enhanced with phone authentication functions
  - `sendPhoneOTP()` - Send OTP for sign up/sign in
  - `signUpWithPhone()` - Create account with phone + OTP
  - `signInWithPhone()` - Sign in with phone + OTP
  - `completePhoneSignIn()` - Complete authentication after OTP verification

#### Screens
- `src/screens/SignUpScreen.tsx` - Completely redesigned for phone-based signup
  - Phone number input with country code (+91)
  - Send OTP button with countdown timer
  - OTP input field (6 digits)
  - Email field (optional)
  - All farmer-specific fields retained
  
- `src/screens/SignInScreen.tsx` - Simplified OTP-based sign in
  - Only phone number and OTP required
  - No password field
  - Automatic resend timer (60 seconds)

#### Documentation
- `TWILIO_SETUP.md` - Complete setup guide for Twilio integration
  - Step-by-step Twilio account setup
  - Backend API implementation examples
  - Environment variable configuration
  - Security best practices
  - Troubleshooting guide

### 3. Package Dependencies Added
```json
{
  "twilio": "^latest",
  "axios": "^latest",
  "react-native-phone-number-input": "^latest"
}
```

### 4. Backup Files Created
- `src/screens/SignUpScreen.old.tsx` - Original email-based sign up
- `src/screens/SignInScreen.old.tsx` - Original email-based sign in

## Setup Required

### 1. Install Dependencies
Dependencies have already been installed. If you need to reinstall:
```bash
npm install
```

### 2. Set Up Twilio
Follow the complete guide in `TWILIO_SETUP.md`. Quick summary:

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID, Auth Token, and Verify Service SID
3. Set up a backend API (required for security)
4. Configure environment variables

### 3. Environment Variables
Create `.env` file in the project root:

```env
# Twilio API Endpoint (your backend URL)
EXPO_PUBLIC_TWILIO_API_ENDPOINT=http://localhost:3000/api
```

### 4. Backend API (Required)
You MUST set up a backend API to handle Twilio requests securely. See `TWILIO_SETUP.md` for:
- Express.js backend example
- Firebase Cloud Functions example
- Other backend options

## User Flow

### Sign Up Flow
1. User enters phone number
2. Clicks "Send OTP"
3. Receives SMS with 6-digit code
4. Enters OTP code
5. (Optional) Enters email
6. Completes profile (farmers only)
7. Account created

### Sign In Flow
1. User enters phone number
2. Clicks "Send OTP"
3. System checks if phone number exists
4. If exists, sends OTP via SMS
5. User enters OTP code
6. Authenticated and redirected to dashboard

## Security Features

✅ **Backend API Integration** - Twilio credentials never exposed in app
✅ **OTP Expiration** - Codes expire after 10 minutes (Twilio default)
✅ **Rate Limiting** - 60-second resend timer prevents spam
✅ **Phone Verification** - SMS OTP confirms phone ownership
✅ **E.164 Format** - Proper international phone number formatting

## Database Schema Updates

User profile documents in Firestore now include:
```typescript
{
  phoneNumber: string,        // E.164 format (e.g., +919876543210)
  mobileNumber: string,       // Duplicate for backward compatibility
  isPhoneVerified: boolean,   // True after OTP verification
  email?: string,             // Optional
  // ... other fields remain the same
}
```

## Testing

### Development Testing
1. Use Twilio trial account
2. Verify your test phone number in Twilio Console
3. Test with verified numbers only (trial limitation)

### Production Testing
1. Upgrade to paid Twilio account
2. Test with any valid phone number
3. Monitor costs in Twilio Console

## Cost Considerations

- **Twilio Trial**: $15 free credit
- **SMS Cost**: ~$0.0075 per message (varies by country)
- **Verify API**: $0.05 per verification attempt

## Rollback Instructions

If you need to revert to email/password authentication:

```bash
cd src/screens
mv SignUpScreen.tsx SignUpScreen.phone.tsx
mv SignUpScreen.old.tsx SignUpScreen.tsx
mv SignInScreen.tsx SignInScreen.phone.tsx
mv SignInScreen.old.tsx SignInScreen.tsx
```

## Known Limitations

1. **Backend Required**: Cannot work without a backend API for security
2. **Twilio Trial**: Limited to verified phone numbers during trial
3. **Country Code**: Currently hardcoded to India (+91) - can be extended
4. **Firebase Auth**: Uses synthetic emails internally (phone@phone.app format)

## Future Enhancements

- [ ] Multi-country support with country code selector
- [ ] Fallback to email authentication option
- [ ] WhatsApp OTP as alternative to SMS
- [ ] Phone number change functionality
- [ ] Two-factor authentication (2FA) for email users

## Support

For issues or questions:
1. Check `TWILIO_SETUP.md` for setup help
2. Review Twilio documentation: https://www.twilio.com/docs/verify
3. Check Firebase Auth documentation for user management

---

**Important**: Make sure to complete the Twilio setup (see `TWILIO_SETUP.md`) before using the app, as phone authentication will not work without proper Twilio configuration.
