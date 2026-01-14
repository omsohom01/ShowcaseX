import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Sprout, ShoppingBasket, ArrowLeft, Phone } from 'lucide-react-native';
import { CustomInput } from '../components/CustomInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { 
  sendPhoneOTP, 
  fetchCurrentUserProfile, 
  signInWithPhone,
  signIn
} from '../services/auth';
import { formatPhoneNumber, testAPIConnection } from '../services/twilio';
import { localizeNumber, delocalizeNumber } from '../utils/numberLocalization';

type SignInScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SignIn'
>;

type SignInScreenRouteProp = RouteProp<RootStackParamList, 'SignIn'>;

type AuthMethod = 'phone' | 'email';

interface FormData {
  phoneNumber: string;
  email: string;
  password: string;
  otp: string;
}

interface FormErrors {
  [key: string]: string;
}

export const SignInScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const route = useRoute<SignInScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const role = route.params?.role;
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    email: '',
    password: '',
    otp: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load saved language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const { loadLanguage } = await import('../i18n/i18n');
        await loadLanguage();
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const tr = (key: string, fallback: string) => {
    try {
      return i18n.exists(key) ? (t(key) as string) : fallback;
    } catch {
      return fallback;
    }
  };

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'phoneNumber':
        if (authMethod !== 'phone') return '';
        return !value.trim()
          ? tr('signIn.errors.required', 'Required')
          : !/^[6-9]\d{9}$/.test(value)
            ? tr('signIn.errors.invalidMobile', 'Enter a valid 10-digit mobile number')
            : '';
      case 'email':
        if (authMethod !== 'email') return '';
        return !value.trim()
          ? tr('signIn.errors.required', 'Required')
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
            ? tr('signIn.errors.invalidEmail', 'Enter a valid email')
            : '';
      case 'password':
        if (authMethod !== 'email') return '';
        return !value
          ? tr('signIn.errors.required', 'Required')
          : value.length < 6
            ? tr('signIn.errors.passwordTooShort', 'Password must be at least 6 characters')
            : '';
      case 'otp':
        if (authMethod !== 'phone') return '';
        return !value
          ? tr('signIn.errors.required', 'Required')
          : !/^\d{6}$/.test(value)
            ? tr('signIn.errors.invalidOTP', 'OTP must be 6 digits')
            : '';
      default:
        return '';
    }
  };

  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSendOTP = async () => {
    // Validate phone number first
    const phoneError = validateField('phoneNumber', formData.phoneNumber);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phoneNumber: phoneError }));
      return;
    }

    setIsLoading(true);
    try {
      // Test API connection first
      console.log('Testing API connection before sending OTP...');
      const connectionTest = await testAPIConnection();
      if (!connectionTest.success) {
        Alert.alert(
          tr('signIn.title', 'Sign In'),
          `Unable to connect to server: ${connectionTest.message}\n\nPlease check your internet connection and try again.`
        );
        setIsLoading(false);
        return;
      }
      console.log('API connection successful:', connectionTest.message);
      
      const formattedPhone = formatPhoneNumber(formData.phoneNumber, '+91');
      
      // Send OTP via backend - this will call the Twilio API
      console.log('Sending OTP to:', formattedPhone);
      const result = await sendPhoneOTP(formattedPhone);

      if (!result.success) {
        Alert.alert(
          tr('signIn.title', 'Sign In'), 
          result.message + '\n\nIf the problem persists, please check your internet connection.'
        );
        return;
      }

      setOtpSent(true);
      setOtpTimer(60); // 60 seconds resend timer
      Alert.alert(
        tr('signIn.otpSent', 'OTP Sent'),
        tr('signIn.otpSentMessage', 'A 6-digit OTP has been sent to your phone number.')
      );
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert(
        tr('signIn.title', 'Sign In'),
        tr('signIn.errors.otpSendFailed', 'Failed to send OTP. Please check your internet connection and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let requiredFields: (keyof FormData)[] = [];
    
    if (authMethod === 'phone') {
      requiredFields = ['phoneNumber', 'otp'];
    } else {
      requiredFields = ['email', 'password'];
    }

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check OTP requirement for phone auth
    if (authMethod === 'phone' && !otpSent) {
      Alert.alert(
        tr('signIn.title', 'Sign In'),
        tr('signIn.errors.sendOTPFirst', 'Please send OTP first')
      );
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      // Sign in based on selected method
      if (authMethod === 'phone') {
        const formattedPhone = formatPhoneNumber(formData.phoneNumber, '+91');
        result = await signInWithPhone(formattedPhone, formData.otp);
      } else {
        // Email sign in
        result = await signIn(formData.email.trim(), formData.password);
      }
      
      if (!result.success) {
        Alert.alert(
          tr('signIn.title', 'Sign In'),
          result.message
        );
        return;
      }

      // Fetch user profile to determine role
      const profileResult = await fetchCurrentUserProfile();
      let userRole = role || 'farmer';
      
      if (profileResult.success && profileResult.profile) {
        userRole = profileResult.profile.role || profileResult.profile.userType || 'farmer';
      }

      // Navigate based on role
      if (userRole === 'buyer') {
        navigation.navigate('BuyerDashboard');
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        tr('signIn.title', 'Sign In'),
        tr('signIn.errors.default', 'Sign in failed. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (authMethod === 'phone') {
      return (
        formData.phoneNumber &&
        formData.otp &&
        !errors.phoneNumber &&
        !errors.otp &&
        otpSent
      );
    } else {
      return (
        formData.email &&
        formData.password &&
        !errors.email &&
        !errors.password
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: '#FAFAFA' }}
    >
      {/* Decorative Background Shape */}
      <View style={{
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#E8F5E9',
        opacity: 0.5,
      }} />
      <View style={{
        position: 'absolute',
        bottom: -80,
        left: -60,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#F1F8E9',
        opacity: 0.4,
      }} />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button - Professional Capsule Design */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-8"
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#D1F4E0',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#16A34A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 5,
            elevation: 3,
          }}
        >
          <ArrowLeft size={20} color="#16A34A" strokeWidth={2.5} />
          <Text 
            className="text-green-600 font-semibold" 
            style={{ fontSize: 15, lineHeight: 20, letterSpacing: 0.3 }}
          >
            {tr('common.back', 'Back')}
          </Text>
        </TouchableOpacity>

        {/* Header - Innovative Design with Icon */}
        <View className="mb-10">
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: role === 'farmer' ? '#16A34A' : role === 'buyer' ? '#10B981' : '#059669',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                shadowColor: role === 'farmer' ? '#16A34A' : '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}>
                {role === 'farmer' ? (
                  <Sprout size={26} color="white" strokeWidth={2.5} />
                ) : role === 'buyer' ? (
                  <ShoppingBasket size={26} color="white" strokeWidth={2.5} />
                ) : (
                  <Phone size={26} color="white" strokeWidth={2.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text 
                  className="text-gray-900 font-extrabold" 
                  style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }}
                >
                  {tr('signIn.title', role === 'farmer' ? 'Farmer Sign In' : role === 'buyer' ? 'Buyer Sign In' : 'Sign In')}
                </Text>
              </View>
            </View>
            <Text className="text-gray-600" style={{ fontSize: 14, marginTop: 4 }}>
              {tr('signIn.phoneAuth', 'Sign in with your phone number or email')}
            </Text>
          </View>
        </View>

        {/* Auth Method Toggle */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 6,
          marginBottom: 16,
          flexDirection: 'row',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}>
          <TouchableOpacity
            onPress={() => {
              setAuthMethod('phone');
              setFormData(prev => ({ ...prev, email: '', password: '' }));
              setErrors({});
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: authMethod === 'phone' ? '#16A34A' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: authMethod === 'phone' ? 'white' : '#6B7280',
              fontWeight: '600',
              fontSize: 15,
            }}>
              📱 {tr('signIn.phoneMethod', 'Phone')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAuthMethod('email');
              setFormData(prev => ({ ...prev, phoneNumber: '', otp: '' }));
              setOtpSent(false);
              setErrors({});
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: authMethod === 'email' ? '#16A34A' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: authMethod === 'email' ? 'white' : '#6B7280',
              fontWeight: '600',
              fontSize: 15,
            }}>
              ✉️ {tr('signIn.emailMethod', 'Email')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Form */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}>
          {/* Phone Auth Fields */}
          {authMethod === 'phone' && (
          <>
          {/* Phone Number with Send OTP Button */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              {tr('signIn.phoneNumber', 'Phone Number')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: errors.phoneNumber ? '#EF4444' : '#E5E7EB',
                }}>
                  <Text style={{ fontSize: 16, color: '#6B7280', marginRight: 8 }}>+91</Text>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' }}
                    placeholder={tr('signIn.phoneNumberPlaceholder', '9876543210')}
                    value={localizeNumber(formData.phoneNumber, i18n.language)}
                    onChangeText={(value) => {
                      const delocalized = delocalizeNumber(value, i18n.language);
                      handleFieldChange('phoneNumber', delocalized);
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!otpSent}
                  />
                </View>
                {errors.phoneNumber && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.phoneNumber}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleSendOTP}
                disabled={isLoading || otpTimer > 0 || !formData.phoneNumber}
                style={{
                  backgroundColor: (isLoading || otpTimer > 0 || !formData.phoneNumber) ? '#D1D5DB' : '#16A34A',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 100,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                    {otpTimer > 0 
                      ? `${otpTimer}s` 
                      : otpSent 
                        ? tr('signIn.resendOTP', 'Resend')
                        : tr('signIn.sendOTP', 'Send OTP')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* OTP Input - Only show after OTP is sent */}
          {otpSent && (
            <View>
              <CustomInput
                label={tr('signIn.otp', 'Enter OTP')}
                placeholder={tr('signIn.otpPlaceholder', 'Enter 6-digit OTP')}
                value={formData.otp}
                onChangeText={(value) => handleFieldChange('otp', value)}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.otp}
              />
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {tr('signIn.otpHelp', 'Enter the OTP sent to your phone')}
              </Text>
            </View>
          )}
          </>
          )}

          {/* Email Auth Fields */}
          {authMethod === 'email' && (
            <>
              <CustomInput
                label={tr('signIn.email', 'Email')}
                placeholder={tr('signIn.emailPlaceholder', 'Enter your email')}
                value={formData.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <CustomInput
                label={tr('signIn.password', 'Password')}
                placeholder={tr('signIn.passwordPlaceholder', 'Enter your password')}
                value={formData.password}
                onChangeText={(value) => handleFieldChange('password', value)}
                secureTextEntry
                error={errors.password}
              />
            </>
          )}
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid() || isLoading}
          style={{
            backgroundColor: (!isFormValid() || isLoading) ? '#D1D5DB' : '#16A34A',
            borderRadius: 12,
            paddingVertical: 16,
            marginBottom: 20,
            shadowColor: '#16A34A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: (!isFormValid() || isLoading) ? 0 : 0.3,
            shadowRadius: 8,
            elevation: (!isFormValid() || isLoading) ? 0 : 4,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
              {tr('signIn.signInButton', 'Sign In')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center flex-wrap">
          <Text className="text-gray-600 text-base text-center">
            {tr('signIn.noAccount', "Don't have an account?")}{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RoleChoice')}>
            <Text className="text-primary font-semibold text-base">
              {tr('signIn.signUp', 'Sign Up')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
