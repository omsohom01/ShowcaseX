import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  User,
  MapPin,
  Bell,
  Plus,
  Upload,
  X,
  Camera,
  IndianRupee,
  Package,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ContactBuyerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ContactBuyer'
>;

interface BuyerContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  hasNotification: boolean;
}

interface FarmerProduct {
  id: string;
  name: string;
  image: string;
  rate: number;
  quantity: number;
  unit: string;
}

export const ContactBuyerScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ContactBuyerNavigationProp>();
  
  // Hardcoded: 2 buyers have contacted this farmer
  const [notifications] = useState(2);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productRate, setProductRate] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [productImage, setProductImage] = useState('');

  // Hardcoded uploaded products by farmer
  const [uploadedProducts, setUploadedProducts] = useState<FarmerProduct[]>([
    {
      id: '1',
      name: 'Fresh Tomatoes',
      image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
      rate: 40,
      quantity: 500,
      unit: 'kg',
    },
    {
      id: '2',
      name: 'Organic Potatoes',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
      rate: 25,
      quantity: 1000,
      unit: 'kg',
    },
    {
      id: '3',
      name: 'Green Chillies',
      image: 'https://images.unsplash.com/photo-1583926975738-d5e770d7e9d9?w=400',
      rate: 80,
      quantity: 200,
      unit: 'kg',
    },
  ]);

  const tr = (key: string, fallback: string) => {
    try {
      return i18n.exists(key) ? (t(key) as string) : fallback;
    } catch {
      return fallback;
    }
  };

  // Hardcoded buyer contacts with notifications
  const BUYER_CONTACTS: BuyerContact[] = [
    {
      id: '1',
      name: tr('contactBuyer.buyers.name1', 'Wholesale Market Delhi'),
      phone: '+91 9876543210',
      email: 'delhi@wholesale.com',
      address: tr('contactBuyer.buyers.address1', 'Azadpur Mandi, Delhi'),
      description: tr('contactBuyer.buyers.desc1', 'Large wholesale buyer for grains and vegetables'),
      hasNotification: true, // This buyer contacted the farmer
    },
    {
      id: '2',
      name: tr('contactBuyer.buyers.name2', 'Organic Foods Mumbai'),
      phone: '+91 9988776655',
      email: 'mumbai@organicfoods.com',
      address: tr('contactBuyer.buyers.address2', 'Vashi Market, Mumbai'),
      description: tr('contactBuyer.buyers.desc2', 'Organic produce buyer with premium rates'),
      hasNotification: true, // This buyer contacted the farmer
    },
    {
      id: '3',
      name: tr('contactBuyer.buyers.name3', 'Fresh Mart Kolkata'),
      phone: '+91 9123456789',
      email: 'kolkata@freshmart.com',
      address: tr('contactBuyer.buyers.address3', 'Kolkata, West Bengal'),
      description: tr('contactBuyer.buyers.desc3', 'Regular buyer for fresh vegetables and fruits'),
      hasNotification: false, // This buyer has not contacted yet
    },
  ];

  const handlePhoneCall = (phone: string) => {
    const phoneNumber = phone.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert(
        tr('contactBuyer.error', 'Error'),
        tr('contactBuyer.phoneError', 'Unable to make phone call')
      );
    });
  };

  const handleSMS = (phone: string) => {
    const phoneNumber = phone.replace(/\s+/g, '');
    Linking.openURL(`sms:${phoneNumber}`).catch(() => {
      Alert.alert(
        tr('contactBuyer.error', 'Error'),
        tr('contactBuyer.smsError', 'Unable to send SMS')
      );
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert(
        tr('contactBuyer.error', 'Error'),
        tr('contactBuyer.emailError', 'Unable to send email')
      );
    });
  };

  const handleChat = (buyerName: string, buyerPhone: string) => {
    navigation.navigate('Chat', {
      contactName: buyerName,
      contactPhone: buyerPhone,
      userType: 'farmer',
    });
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        tr('contactBuyer.error', 'Error'),
        'Sorry, we need camera roll permissions to upload images!'
      );
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProductImage(result.assets[0].uri);
    }
  };

  const handleUploadProduct = () => {
    if (!productName || !productRate || !productQuantity) {
      Alert.alert(
        tr('contactBuyer.error', 'Error'),
        tr('contactBuyer.fillAllFields', 'Please fill all fields')
      );
      return;
    }
    
    // Create new product
    const newProduct: FarmerProduct = {
      id: Date.now().toString(),
      name: productName,
      image: productImage || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', // Default vegetable image
      rate: parseFloat(productRate),
      quantity: parseFloat(productQuantity),
      unit: selectedUnit,
    };
    
    // Add to products list
    setUploadedProducts([newProduct, ...uploadedProducts]);
    
    // Here you would upload to backend
    Alert.alert(
      tr('contactBuyer.success', 'Success'),
      tr('contactBuyer.productUploaded', 'Product uploaded successfully!')
    );
    
    // Reset form
    setShowUploadModal(false);
    setProductName('');
    setProductRate('');
    setProductQuantity('');
    setProductImage('');
    setSelectedUnit('kg');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFFFFF' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 24,
            paddingTop: 48,
            paddingBottom: 32,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              {tr('contactBuyer.back', 'Back')}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#fff',
                fontSize: 32,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}>
                {tr('contactBuyer.title', 'Contact Buyer')}
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 15,
                fontWeight: '500',
                marginTop: 8,
              }}>
                {tr('contactBuyer.subtitle', 'Connect with interested buyers')}
              </Text>
            </View>
            {notifications > 0 && (
              <View style={{
                position: 'relative',
              }}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  style={{
                    borderRadius: 30,
                    width: 56,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#F97316',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Bell size={26} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: '800',
                  }}>{notifications}</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* My Products Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{
              color: '#111827',
              fontSize: 22,
              fontWeight: '800',
              letterSpacing: -0.3,
            }}>
              {tr('contactBuyer.myProducts', 'My Products')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowUploadModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
                <Text style={{
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: '700',
                  marginLeft: 6,
                }}>
                  {tr('contactBuyer.upload', 'Upload')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Product Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
          >
            {uploadedProducts.map((product) => (
              <LinearGradient
                key={product.id}
                colors={['#FFFFFF', '#F9FAFB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  width: 220,
                  marginRight: 16,
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Image
                  source={{ uri: product.image }}
                  style={{ width: '100%', height: 140 }}
                  resizeMode="cover"
                />
                <View style={{ padding: 14 }}>
                  <Text style={{
                    color: '#111827',
                    fontSize: 17,
                    fontWeight: '700',
                    marginBottom: 10,
                  }}>
                    {product.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={{
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <IndianRupee size={14} color="#fff" strokeWidth={2.5} />
                        <Text style={{
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: '800',
                          marginLeft: 2,
                        }}>
                          {product.rate}
                        </Text>
                        <Text style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: 12,
                          fontWeight: '600',
                          marginLeft: 2,
                        }}>
                          /{product.unit}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F3F4F6',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                    }}>
                      <Package size={14} color="#6B7280" strokeWidth={2.5} />
                      <Text style={{
                        color: '#374151',
                        fontSize: 13,
                        fontWeight: '700',
                        marginLeft: 4,
                      }}>
                        {product.quantity} {product.unit}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Buyer Contact Cards */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text style={{
            color: '#111827',
            fontSize: 22,
            fontWeight: '800',
            marginBottom: 20,
            letterSpacing: -0.3,
          }}>
            {tr('contactBuyer.interestedBuyers', 'Interested Buyers')}
          </Text>

          {BUYER_CONTACTS.map((buyer) => {
            return (
              <LinearGradient
                key={buyer.id}
                colors={['#FFFFFF', '#FAFAFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Notification Badge */}
                {buyer.hasNotification && (
                  <View style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                  }}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Bell size={12} color="#fff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: '700',
                        marginLeft: 4,
                      }}>
                        {tr('contactBuyer.newRequest', 'New')}
                      </Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Buyer Info Header */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <User size={26} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ flex: 1, paddingRight: buyer.hasNotification ? 80 : 0 }}>
                    <Text style={{
                      color: '#111827',
                      fontSize: 18,
                      fontWeight: '800',
                      marginBottom: 6,
                    }}>
                      {buyer.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MapPin size={14} color="#6B7280" strokeWidth={2} />
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 13,
                        fontWeight: '500',
                        marginLeft: 6,
                      }}>
                        {buyer.address}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={{
                  color: '#4B5563',
                  fontSize: 14,
                  fontWeight: '500',
                  lineHeight: 20,
                  marginBottom: 16,
                }}>
                  {buyer.description}
                </Text>

                {/* Action Buttons */}
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handlePhoneCall(buyer.phone)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 14,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                    >
                      <Phone size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '700',
                        marginLeft: 10,
                      }}>
                        {tr('contactBuyer.call', 'Call')} - {buyer.phone}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleChat(buyer.name, buyer.phone)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 14,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                    >
                      <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '700',
                        marginLeft: 10,
                      }}>
                        {tr('contactBuyer.chat', 'Chat in App')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleEmail(buyer.email)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#6B7280', '#4B5563']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 14,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#6B7280',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                    >
                      <Mail size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '700',
                        marginLeft: 10,
                      }}>
                        {tr('contactBuyer.email', 'Email')} - {buyer.email}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </ScrollView>

      {/* Upload Product Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-2xl font-bold">
                {tr('contactBuyer.uploadProduct', 'Upload Product')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                className="bg-gray-200 rounded-full w-10 h-10 items-center justify-center"
              >
                <X size={20} color="#374151" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Upload */}
              <TouchableOpacity
                onPress={pickImage}
                className="bg-green-50 rounded-xl h-48 items-center justify-center mb-4 border-2 border-dashed border-green-300 overflow-hidden"
                activeOpacity={0.7}
              >
                {productImage ? (
                  <Image
                    source={{ uri: productImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Camera size={48} color="#16A34A" strokeWidth={2} />
                    <Text className="text-green-700 font-semibold mt-3">
                      {tr('contactBuyer.addPhoto', 'Add Product Photo')}
                    </Text>
                    <Text className="text-green-600 text-sm mt-1">
                      {tr('contactBuyer.tapToUpload', 'Tap to upload')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Product Name */}
              <Text className="text-gray-700 font-semibold mb-2">
                {tr('contactBuyer.productName', 'Product Name')}
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-4"
                placeholder={tr('contactBuyer.enterProductName', 'e.g., Fresh Tomatoes')}
                placeholderTextColor="#9CA3AF"
                value={productName}
                onChangeText={setProductName}
              />

              {/* Rate */}
              <Text className="text-gray-700 font-semibold mb-2">
                {tr('contactBuyer.ratePerUnit', 'Rate per Unit (₹)')}
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-4"
                placeholder={tr('contactBuyer.enterRate', 'e.g., 40')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={productRate}
                onChangeText={setProductRate}
              />

              {/* Quantity */}
              <Text className="text-gray-700 font-semibold mb-2">
                {tr('contactBuyer.quantity', 'Quantity')}
              </Text>
              <View className="flex-row items-center mb-4">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mr-2"
                  placeholder={tr('contactBuyer.enterQuantity', 'e.g., 500')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={productQuantity}
                  onChangeText={setProductQuantity}
                />
                <View className="flex-row bg-gray-100 rounded-xl overflow-hidden">
                  <TouchableOpacity
                    onPress={() => setSelectedUnit('kg')}
                    className={`px-6 py-3 ${
                      selectedUnit === 'kg' ? 'bg-green-600' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedUnit === 'kg' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedUnit('quintal')}
                    className={`px-6 py-3 ${
                      selectedUnit === 'quintal' ? 'bg-green-600' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedUnit === 'quintal' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      quintal
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Upload Button */}
              <TouchableOpacity
                onPress={handleUploadProduct}
                className="bg-green-600 rounded-xl py-4 items-center flex-row justify-center mt-2"
                activeOpacity={0.7}
              >
                <Upload size={20} color="#fff" strokeWidth={2} />
                <Text className="text-white text-lg font-bold ml-2">
                  {tr('contactBuyer.uploadNow', 'Upload Product')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};