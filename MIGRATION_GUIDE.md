# Migration Guide: Email Auth → Phone OTP Auth

This guide helps you migrate your existing ShowcaseX app from email/password authentication to phone number OTP authentication.

## For Existing Users

### What This Means for Users

**Before**: Users logged in with email and password
**After**: Users log in with phone number and OTP (SMS code)

### User Data Migration

Existing user accounts are preserved, but users will need to:

1. **Add their phone number** to their profile
2. **Verify their phone** via OTP when first signing in with the new system

### Migration Strategy Options

#### Option 1: Soft Migration (Recommended)
Allow both authentication methods temporarily:

1. Keep old SignUpScreen/SignInScreen available
2. Add phone number field to existing user profiles
3. Gradually encourage users to add phone numbers
4. Eventually phase out email/password

To implement:
```bash
# Keep both versions available
# Current files: SignUpScreen.tsx (phone), SignInScreen.tsx (phone)
# Old files: SignUpScreen.old.tsx (email), SignInScreen.old.tsx (email)

# You can create a choice screen to let users pick their auth method
```

#### Option 2: Hard Migration (Clean Break)
Force all users to phone authentication:

1. ✅ Current implementation (already done)
2. Send notification to existing users about the change
3. Require phone number verification on next login
4. Migrate existing email-based accounts to phone-based

### Backend Migration Script

Run this script to add phone numbers to existing users:

```javascript
// migration-script.js
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function migrateUsers() {
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    // Check if user has mobileNumber but not phoneNumber
    if (userData.mobileNumber && !userData.phoneNumber) {
      // Format to E.164 if needed
      const phoneNumber = userData.mobileNumber.startsWith('+') 
        ? userData.mobileNumber 
        : `+91${userData.mobileNumber}`;
      
      await doc.ref.update({
        phoneNumber: phoneNumber,
        isPhoneVerified: false, // Require verification on next login
      });
      
      console.log(`Migrated user ${doc.id}: ${phoneNumber}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateUsers().catch(console.error);
```

Run with:
```bash
node migration-script.js
```

## For Developers

### Files Changed

1. **New Files**:
   - `src/services/twilio.ts` - Twilio integration
   - `TWILIO_SETUP.md` - Setup guide
   - `PHONE_AUTH_IMPLEMENTATION.md` - Implementation docs
   - `.env.example` - Updated with Twilio vars

2. **Modified Files**:
   - `src/screens/SignUpScreen.tsx` - Phone-based signup
   - `src/screens/SignInScreen.tsx` - OTP-based signin
   - `src/services/auth.ts` - Phone auth functions added

3. **Backup Files**:
   - `src/screens/SignUpScreen.old.tsx` - Original email signup
   - `src/screens/SignInScreen.old.tsx` - Original email signin

### Database Schema Changes

**Before**:
```typescript
{
  email: string,
  mobileNumber?: string,
  fullName: string,
  // ...
}
```

**After**:
```typescript
{
  phoneNumber: string,      // Primary identifier (E.164 format)
  mobileNumber: string,     // Kept for compatibility
  isPhoneVerified: boolean, // New field
  email?: string,           // Now optional
  fullName: string,
  // ...
}
```

### Environment Variables

Add to your `.env`:
```env
EXPO_PUBLIC_TWILIO_API_ENDPOINT=http://localhost:3000/api
```

### Backend Setup Required

⚠️ **IMPORTANT**: You must set up a backend API before this works.

See `TWILIO_SETUP.md` for complete instructions.

Quick setup:
```bash
# Create backend
mkdir showcasex-auth-api
cd showcasex-auth-api
npm init -y
npm install express twilio cors dotenv

# Copy server code from TWILIO_SETUP.md
# Start server
node server.js
```

### Testing Checklist

- [ ] Backend API is running
- [ ] Twilio credentials are configured
- [ ] Test phone number is verified in Twilio (if using trial)
- [ ] Environment variables are set
- [ ] Sign up with new phone number works
- [ ] OTP is received via SMS
- [ ] Sign in with phone number works
- [ ] Existing users can be migrated

### Rollback Plan

If something goes wrong:

```bash
cd src/screens

# Restore email auth
mv SignUpScreen.tsx SignUpScreen.phone.tsx
mv SignUpScreen.old.tsx SignUpScreen.tsx
mv SignInScreen.tsx SignInScreen.phone.tsx
mv SignInScreen.old.tsx SignInScreen.tsx

# Restart app
npm start
```

## Common Migration Issues

### Issue 1: Existing Users Can't Sign In

**Problem**: Users with email accounts can't use phone auth

**Solution**: 
1. Add a "Link Phone Number" feature to profile screen
2. Allow users to verify and link their phone
3. Or provide a migration flow on first sign-in

### Issue 2: Duplicate Accounts

**Problem**: User creates new account with phone instead of linking

**Solution**:
1. Check for existing email when user signs up with phone
2. Suggest linking instead of creating new account
3. Implement account merging logic

### Issue 3: International Users

**Problem**: Country code hardcoded to +91 (India)

**Solution**:
```typescript
// Add country code selector
import PhoneInput from 'react-native-phone-number-input';

// Update formatPhoneNumber to accept country code
export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: string = '+91'
): string => {
  // ...
};
```

## Best Practices

1. **Notify Users**: Send email/push notification about auth change
2. **Grace Period**: Allow both methods for 30 days
3. **Clear Instructions**: Provide in-app guides for new auth
4. **Support**: Have customer support ready for migration issues
5. **Testing**: Test thoroughly with real phone numbers
6. **Monitoring**: Monitor SMS costs and usage in Twilio

## Support

For issues during migration:
- Check `TWILIO_SETUP.md` for setup problems
- Review `PHONE_AUTH_IMPLEMENTATION.md` for implementation details
- Check Twilio Console for SMS delivery issues
- Review Firebase Auth logs for authentication errors

---

**Timeline Recommendation**:
- Week 1: Set up backend and test
- Week 2: Deploy and allow both auth methods
- Week 3: Migrate existing users
- Week 4: Monitor and fix issues
- Week 5+: Deprecate email auth (optional)
