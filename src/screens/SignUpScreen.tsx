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
import { Sprout, ShoppingBasket, ArrowLeft, Phone } from 'lucide-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { CustomInput } from '../components/CustomInput';
import { Dropdown } from '../components/Dropdown';
import { INDIAN_STATES, FARMER_TYPES, LANGUAGES, INDIAN_DISTRICTS } from '../constants/data';
import { RootStackParamList } from '../navigation/AppNavigator';
import { localizeNumber, delocalizeNumber } from '../utils/numberLocalization';
import {
  signUpWithPhone,
  signUp,
  saveCurrentUserProfile,
  updateCurrentAuthProfile,
  sendPhoneOTP,
} from '../services/auth';
import { detectCurrentLocation } from '../services/location';
import { formatPhoneNumber, testAPIConnection } from '../services/twilio';

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SignUp'
>;

type SignUpScreenRouteProp = RouteProp<RootStackParamList, 'SignUp'>;

type AuthMethod = 'phone' | 'email';

interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  otp: string;
  state: string;
  district: string;
  preferredLanguage: string;
  farmerType: string;
  landSize: string;
}

interface FormErrors {
  [key: string]: string;
}

export const SignUpScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const route = useRoute<SignUpScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const role = route.params?.role || 'farmer';
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    otp: '',
    state: '',
    district: '',
    preferredLanguage: i18n.language || 'en',
    farmerType: '',
    landSize: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load saved language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const { loadLanguage } = await import('../i18n/i18n');
        await loadLanguage();
        setFormData(prev => ({ ...prev, preferredLanguage: i18n.language || 'en' }));
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  // Auto-detect location on sign up
  useEffect(() => {
    const detect = async () => {
      const res = await detectCurrentLocation();
      if (!res.ok) {
        if (res.reason === 'services-disabled') {
          Alert.alert(
            tr('signUp.locationRequiredTitle', 'Location Required'),
            tr('signUp.turnOnLocationServices', 'Please turn on Location Services to auto-fill your location.')
          );
          return;
        }
        if (res.reason === 'permission-denied') {
          Alert.alert(
            tr('signUp.locationRequiredTitle', 'Location Required'),
            tr('signUp.allowLocationPermission', 'Please allow location permission to auto-fill your location.')
          );
        }
        return;
      }

      setFormData((prev) => ({
        ...prev,
        state: res.location.stateValue || prev.state,
        district: res.location.districtValue || prev.district,
      }));
    };

    detect();
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
      case 'fullName':
        return !value.trim() ? tr('signUp.errors.required', 'Required') : '';
      case 'phoneNumber':
        // Phone is now required for both auth methods
        return !value.trim()
          ? tr('signUp.errors.required', 'Required')
          : !/^[6-9]\d{9}$/.test(value)
            ? tr('signUp.errors.invalidMobile', 'Enter a valid 10-digit mobile number')
            : '';
      case 'email':
        if (authMethod === 'phone') return ''; // Email optional for phone auth
        return !value.trim()
          ? tr('signUp.errors.required', 'Required')
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
            ? tr('signUp.errors.invalidEmail', 'Enter a valid email address')
            : '';
      case 'password':
        if (authMethod === 'phone') return ''; // Password not needed for phone auth
        return !value
          ? tr('signUp.errors.required', 'Required')
          : value.length < 6
            ? tr('signUp.errors.passwordTooShort', 'Password must be at least 6 characters')
            : '';
      case 'otp':
        if (authMethod === 'email') return ''; // OTP not needed for email auth
        return !value
          ? tr('signUp.errors.required', 'Required')
          : !/^\d{6}$/.test(value)
            ? tr('signUp.errors.invalidOTP', 'OTP must be 6 digits')
            : '';
      case 'state':
      case 'district':
      case 'preferredLanguage':
      case 'farmerType':
      case 'landSize':
        return !value.trim() ? tr('signUp.errors.required', 'Required') : '';
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
          tr('signUp.title', 'Sign Up'),
          `Unable to connect to server: ${connectionTest.message}\n\nPlease check your internet connection and try again.`
        );
        setIsLoading(false);
        return;
      }
      console.log('API connection successful:', connectionTest.message);
      
      const formattedPhone = formatPhoneNumber(formData.phoneNumber, '+91');
      const result = await sendPhoneOTP(formattedPhone);

      if (!result.success) {
        Alert.alert(
          tr('signUp.title', 'Sign Up'), 
          result.message + '\n\nIf the problem persists, please check your internet connection.'
        );
        return;
      }

      setOtpSent(true);
      setOtpTimer(60); // 60 seconds resend timer
      Alert.alert(
        tr('signUp.otpSent', 'OTP Sent'),
        tr('signUp.otpSentMessage', 'A 6-digit OTP has been sent to your phone number.')
      );
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert(
        tr('signUp.title', 'Sign Up'),
        tr('signUp.errors.otpSendFailed', 'Failed to send OTP. Please check your internet connection and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let requiredFields: (keyof FormData)[] = ['fullName', 'phoneNumber'];
    
    // Add auth-specific required fields
    if (authMethod === 'phone') {
      requiredFields.push('otp');
    } else {
      requiredFields.push('email', 'password');
    }
    
    // Add farmer-specific fields only for farmers
    if (role === 'farmer') {
      requiredFields.push(
        'state',
        'district',
        'preferredLanguage',
        'farmerType',
        'landSize'
      );
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
        tr('signUp.title', 'Sign Up'),
        tr('signUp.errors.sendOTPFirst', 'Please send OTP first')
      );
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      // Sign up based on selected method
      if (authMethod === 'phone') {
        const formattedPhone = formatPhoneNumber(formData.phoneNumber, '+91');
        result = await signUpWithPhone(formattedPhone, formData.otp);
      } else {
        // Email sign up
        result = await signUp(formData.email.trim(), formData.password);
      }

      if (!result.success) {
        Alert.alert(tr('signUp.title', 'Sign Up'), result.message);
        return;
      }

      // Store display name in Firebase Auth
      if (formData.fullName?.trim()) {
        await updateCurrentAuthProfile({ displayName: formData.fullName.trim() });
      }

      // Save profile to Firestore with role
      const profileData: any = {
        fullName: formData.fullName,
        role: role,
        notificationsEnabled: true,
        profilePhoto: null,
      };

      // Add authentication method details
      const formattedPhone = formatPhoneNumber(formData.phoneNumber, '+91');
      profileData.phoneNumber = formattedPhone;
      profileData.mobileNumber = formattedPhone;
      
      if (authMethod === 'phone') {
        profileData.isPhoneVerified = true;
      } else {
        profileData.email = formData.email.trim();
        profileData.isEmailVerified = true;
      }

      // Persist location for all roles
      if (formData.state) profileData.state = formData.state;
      if (formData.district) profileData.district = formData.district;

      // Add farmer-specific fields only for farmers
      if (role === 'farmer') {
        profileData.preferredLanguage = formData.preferredLanguage;
        profileData.farmerType = formData.farmerType;
        profileData.landSize = formData.landSize;
      }

      await saveCurrentUserProfile(profileData);

      // Navigate based on role
      if (role === 'buyer') {
        navigation.navigate('BuyerDashboard');
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(tr('signUp.title', 'Sign Up'), tr('signUp.errors.default', 'Sign up failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const requiredFields: (keyof FormData)[] = ['fullName', 'phoneNumber'];
    
    // Add auth-specific required fields
    if (authMethod === 'phone') {
      requiredFields.push('otp');
    } else {
      requiredFields.push('email', 'password');
    }
    
    // Add farmer-specific fields only for farmers
    if (role === 'farmer') {
      requiredFields.push(
        'state',
        'district',
        'preferredLanguage',
        'farmerType',
        'landSize'
      );
    }
    
    // Check all required fields are filled and have no errors
    const allFieldsFilled = requiredFields.every((field) => formData[field as keyof FormData]);
    // Only check errors for required fields, not all fields in errors object
    const noErrors = requiredFields.every((field) => !errors[field]);
    
    // For phone auth, also require OTP to be sent
    if (authMethod === 'phone') {
      return allFieldsFilled && noErrors && otpSent;
    }
    
    // For email auth, just check fields and errors
    return allFieldsFilled && noErrors;
  };

  // Change language when preferred language is selected
  useEffect(() => {
    if (formData.preferredLanguage) {
      import('../i18n/i18n').then(({ saveLanguage }) => {
        saveLanguage(formData.preferredLanguage);
      });
    }
  }, [formData.preferredLanguage]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#FAFAFA' }}
    >
      {/* Decorative Background Shapes */}
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
        contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: Math.max(insets.bottom, 24) + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
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

        {/* Header */}
        <View className="mb-10">
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: role === 'farmer' ? '#16A34A' : '#10B981',
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
                ) : (
                  <ShoppingBasket size={26} color="white" strokeWidth={2.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text 
                  className="text-gray-900 font-extrabold" 
                  style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }}
                >
                  {tr('signUp.title', role === 'farmer' ? 'Farmer Sign Up' : 'Buyer Sign Up')}
                </Text>
              </View>
            </View>
            <Text className="text-gray-600" style={{ fontSize: 14, marginTop: 4 }}>
              {tr('signUp.phoneAuth', 'Sign up with your phone number or email')}
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
              📱 {tr('signUp.phoneMethod', 'Phone')}
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
              ✉️ {tr('signUp.emailMethod', 'Email')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form - Card Style */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}>
          {/* Account Information Section */}
          <Text 
            className="text-gray-800 font-bold" 
            style={{ fontSize: 16, marginBottom: 12, letterSpacing: 0.3 }}
          >
            {tr('signUp.accountInfo', 'Account Information')}
          </Text>
          
          <View style={{ gap: 8 }}>
            <CustomInput
              label={tr('signUp.fullName', 'Full Name')}
              placeholder={tr('signUp.fullNamePlaceholder', 'Enter your full name')}
              value={formData.fullName}
              onChangeText={(value) => handleFieldChange('fullName', value)}
              error={errors.fullName}
            />

            {/* Phone Auth Fields */}
            {authMethod === 'phone' && (
              <>
                {/* Phone Number with Send OTP Button */}
                <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                {tr('signUp.phoneNumber', 'Phone Number')} *
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
                      placeholder={tr('signUp.phoneNumberPlaceholder', '9876543210')}
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
                          ? tr('signUp.resendOTP', 'Resend')
                          : tr('signUp.sendOTP', 'Send OTP')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* OTP Input - Only show after OTP is sent */}
            {otpSent && (
              <View>
                <CustomInput
                  label={tr('signUp.otp', 'Enter OTP')}
                  placeholder={tr('signUp.otpPlaceholder', 'Enter 6-digit OTP')}
                  value={formData.otp}
                  onChangeText={(value) => handleFieldChange('otp', value)}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp}
                />
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  {tr('signUp.otpHelp', 'Enter the OTP sent to your phone')}
                </Text>
              </View>
            )}
            </>
            )}

            {/* Email Auth Fields */}
            {authMethod === 'email' && (
              <>
                {/* Phone Number for Email Auth */}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                    {tr('signUp.phoneNumber', 'Phone Number')} *
                  </Text>
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
                      placeholder={tr('signUp.phoneNumberPlaceholder', '9876543210')}
                      value={localizeNumber(formData.phoneNumber, i18n.language)}
                      onChangeText={(value) => {
                        const delocalized = delocalizeNumber(value, i18n.language);
                        handleFieldChange('phoneNumber', delocalized);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {errors.phoneNumber && (
                    <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                      {errors.phoneNumber}
                    </Text>
                  )}
                </View>

                <CustomInput
                  label={tr('signUp.email', 'Email')}
                  placeholder={tr('signUp.emailPlaceholder', 'Enter your email')}
                  value={formData.email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                <CustomInput
                  label={tr('signUp.password', 'Password')}
                  placeholder={tr('signUp.passwordPlaceholder', 'Enter your password')}
                  value={formData.password}
                  onChangeText={(value) => handleFieldChange('password', value)}
                  secureTextEntry
                  error={errors.password}
                />
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: -4 }}>
                  {tr('signUp.passwordHelp', 'Minimum 6 characters')}
                </Text>
              </>
            )}
          </View>

          {/* Farmer-Specific Fields */}
          {role === 'farmer' && (
            <>
              {/* Personal Information Section */}
              <Text 
                className="text-gray-800 font-bold" 
                style={{ fontSize: 16, marginBottom: 12, marginTop: 16, letterSpacing: 0.3 }}
              >
                {tr('signUp.personalInfo', 'Personal Information')}
              </Text>

              <Dropdown
                label={tr('signUp.state', 'State')}
                placeholder={tr('signUp.statePlaceholder', 'Select your state')}
                value={
                  INDIAN_STATES.find((s) => s.value === formData.state)
                    ? (() => {
                        try {
                          const state = INDIAN_STATES.find((s) => s.value === formData.state);
                          return state ? t(state.labelKey) : '';
                        } catch {
                          return '';
                        }
                      })()
                    : ''
                }
                options={INDIAN_STATES.map((state) => {
                  try {
                    return t(state.labelKey);
                  } catch {
                    return state.value;
                  }
                })}
                onSelect={(value) => {
                  try {
                    const selectedState = INDIAN_STATES.find(
                      (state) => {
                        try {
                          return t(state.labelKey) === value;
                        } catch {
                          return state.value === value;
                        }
                      }
                    );
                    if (selectedState) {
                      handleFieldChange('state', selectedState.value);
                    }
                  } catch (error) {
                    console.error('State selection error:', error);
                  }
                }}
                error={errors.state}
              />

              <Dropdown
                label={tr('signUp.district', 'District')}
                placeholder={tr('signUp.districtPlaceholder', 'Select your district')}
                value={
                  INDIAN_DISTRICTS.find((d) => d.value === formData.district)
                    ? (() => {
                        try {
                          const district = INDIAN_DISTRICTS.find((d) => d.value === formData.district);
                          return district ? t(district.labelKey) : '';
                        } catch {
                          return '';
                        }
                      })()
                    : ''
                }
                options={INDIAN_DISTRICTS.map((district) => {
                  try {
                    return t(district.labelKey);
                  } catch {
                    return district.value;
                  }
                })}
                onSelect={(value) => {
                  try {
                    const selectedDistrict = INDIAN_DISTRICTS.find(
                      (district) => {
                        try {
                          return t(district.labelKey) === value;
                        } catch {
                          return district.value === value;
                        }
                      }
                    );
                    if (selectedDistrict) {
                      handleFieldChange('district', selectedDistrict.value);
                    }
                  } catch (error) {
                    console.error('District selection error:', error);
                  }
                }}
                error={errors.district}
                disabled={!formData.state}
              />

              {/* Farming Information Section */}
              <Text 
                className="text-gray-800 font-bold" 
                style={{ fontSize: 16, marginBottom: 12, marginTop: 16, letterSpacing: 0.3 }}
              >
                {tr('signUp.farmingInfo', 'Farming Information')}
              </Text>

              <Dropdown
                label={tr('signUp.farmerType', 'Farmer Type')}
                placeholder={tr('signUp.farmerTypePlaceholder', 'Select farmer type')}
                value={
                  FARMER_TYPES.find((f) => f.value === formData.farmerType)
                    ? (() => {
                        try {
                          const type = FARMER_TYPES.find((f) => f.value === formData.farmerType);
                          return type ? t(type.labelKey) : '';
                        } catch {
                          return '';
                        }
                      })()
                    : ''
                }
                options={FARMER_TYPES.map((type) => {
                  try {
                    return t(type.labelKey);
                  } catch {
                    return type.value;
                  }
                })}
                onSelect={(value) => {
                  try {
                    const selectedType = FARMER_TYPES.find(
                      (type) => {
                        try {
                          return t(type.labelKey) === value;
                        } catch {
                          return type.value === value;
                        }
                      }
                    );
                    if (selectedType) {
                      handleFieldChange('farmerType', selectedType.value);
                    }
                  } catch (error) {
                    console.error('Farmer type selection error:', error);
                  }
                }}
                error={errors.farmerType}
              />

              <CustomInput
                label={tr('signUp.landSize', 'Land Size')}
                placeholder={tr('signUp.landSizePlaceholder', 'Enter land size')}
                value={formData.landSize}
                onChangeText={(value) => handleFieldChange('landSize', value)}
                keyboardType="decimal-pad"
                suffix={tr('signUp.acres', 'acres')}
                error={errors.landSize}
              />
            </>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid() || isLoading}
          className={`rounded-xl py-4 mb-4 ${!isFormValid() || isLoading ? 'bg-gray-300' : 'bg-primary'
            }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {tr('signUp.createAccount', 'Create Account')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View className="flex-row justify-center items-center flex-wrap">
          <Text className="text-gray-600 text-base text-center">
            {tr('signUp.alreadyHaveAccount', 'Already have an account?')}{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn', { role })}>
            <Text className="text-primary font-semibold text-base">
              {tr('signUp.signIn', 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
