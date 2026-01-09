import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  User,
  MapPin,
  IndianRupee,
  Package,
  Navigation,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ContactFarmerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ContactFarmer'
>;

interface FarmerListing {
  id: string;
  farmerName: string;
  phone: string;
  location: string;
  products: {
    id: string;
    name: string;
    image: string;
    rate: number;
    quantity: number;
    unit: string;
  }[];
}

export const ContactFarmerScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ContactFarmerNavigationProp>();

  const tr = (key: string, fallback: string) => {
    try {
      return i18n.exists(key) ? (t(key) as string) : fallback;
    } catch {
      return fallback;
    }
  };

  // Hardcoded farmer listings with products
  const FARMER_LISTINGS: FarmerListing[] = [
    {
      id: '1',
      farmerName: 'Ramesh Kumar',
      phone: '+91 9876543210',
      location: 'Kolkata, West Bengal',
      products: [
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
      ],
    },
    {
      id: '2',
      farmerName: 'Suresh Patel',
      phone: '+91 9988776655',
      location: 'Delhi, NCR',
      products: [
        {
          id: '3',
          name: 'Green Chillies',
          image: 'https://images.unsplash.com/photo-1583926975738-d5e770d7e9d9?w=400',
          rate: 80,
          quantity: 200,
          unit: 'kg',
        },
        {
          id: '4',
          name: 'Fresh Cauliflower',
          image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400',
          rate: 35,
          quantity: 300,
          unit: 'kg',
        },
      ],
    },
    {
      id: '3',
      farmerName: 'Rajesh Singh',
      phone: '+91 9123456789',
      location: 'Mumbai, Maharashtra',
      products: [
        {
          id: '5',
          name: 'Red Onions',
          image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
          rate: 30,
          quantity: 800,
          unit: 'kg',
        },
      ],
    },
  ];

  const handlePhoneCall = (phone: string) => {
    const phoneNumber = phone.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert(
        tr('contactFarmer.error', 'Error'),
        tr('contactFarmer.phoneError', 'Unable to make phone call')
      );
    });
  };

  const handleChat = (farmerName: string, farmerPhone: string) => {
    navigation.navigate('Chat', {
      contactName: farmerName,
      contactPhone: farmerPhone,
      userType: 'buyer',
    });
  };

  const handleGetLocation = (farmerName: string) => {
    Alert.alert(
      tr('contactFarmer.locationRequest', 'Request Location'),
      tr('contactFarmer.locationRequestMsg', `${farmerName} will share their location in the chat.`),
      [
        { text: tr('contactFarmer.ok', 'OK') },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFFFFF' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#3B82F6', '#2563EB', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 24,
            paddingTop: 48,
            paddingBottom: 32,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: '#3B82F6',
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
              {tr('contactFarmer.back', 'Back')}
            </Text>
          </TouchableOpacity>
          <View>
            <Text style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}>
              {tr('contactFarmer.title', 'Contact Farmer')}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 15,
              fontWeight: '500',
              marginTop: 8,
            }}>
              {tr('contactFarmer.subtitle', 'Browse fresh produce from farmers')}
            </Text>
          </View>
        </LinearGradient>

        {/* Farmer Listings */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{
            color: '#111827',
            fontSize: 22,
            fontWeight: '800',
            marginBottom: 20,
            letterSpacing: -0.3,
          }}>
            {tr('contactFarmer.availableFarmers', 'Available Farmers')}
          </Text>

          {FARMER_LISTINGS.map((farmer) => {
            return (
              <LinearGradient
                key={farmer.id}
                colors={['#FFFFFF', '#FAFAFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Farmer Info Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <User size={30} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#111827',
                      fontSize: 20,
                      fontWeight: '800',
                      marginBottom: 6,
                    }}>
                      {farmer.farmerName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MapPin size={14} color="#6B7280" strokeWidth={2} />
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 13,
                        fontWeight: '500',
                        marginLeft: 6,
                      }}>
                        {farmer.location}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Products Grid */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    color: '#111827',
                    fontSize: 17,
                    fontWeight: '800',
                    marginBottom: 14,
                  }}>
                    {tr('contactFarmer.availableProducts', 'Available Products')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                  >
                    {farmer.products.map((product) => (
                      <LinearGradient
                        key={product.id}
                        colors={['#FFFFFF', '#F9FAFB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                          width: 170,
                          marginRight: 12,
                          borderRadius: 16,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                        }}
                      >
                        <Image
                          source={{ uri: product.image }}
                          style={{ width: '100%', height: 100 }}
                          resizeMode="cover"
                        />
                        <View style={{ padding: 12 }}>
                          <Text
                            style={{
                              color: '#111827',
                              fontSize: 14,
                              fontWeight: '700',
                              marginBottom: 8,
                            }}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <LinearGradient
                              colors={['#10B981', '#059669']}
                              style={{
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 5,
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <IndianRupee size={12} color="#fff" strokeWidth={2.5} />
                              <Text style={{
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: '800',
                                marginLeft: 2,
                              }}>
                                {product.rate}
                              </Text>
                              <Text style={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: 10,
                                fontWeight: '600',
                                marginLeft: 2,
                              }}>
                                /{product.unit}
                              </Text>
                            </LinearGradient>
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#F3F4F6',
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 4,
                            }}>
                              <Package size={11} color="#6B7280" strokeWidth={2.5} />
                              <Text style={{
                                color: '#374151',
                                fontSize: 11,
                                fontWeight: '700',
                                marginLeft: 4,
                              }}>
                                {product.quantity}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    ))}
                  </ScrollView>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 12 }}>
                  {/* Call Button */}
                  <TouchableOpacity
                    onPress={() => handlePhoneCall(farmer.phone)}
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
                        {tr('contactFarmer.call', 'Call')} - {farmer.phone}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Chat Button */}
                  <TouchableOpacity
                    onPress={() => handleChat(farmer.farmerName, farmer.phone)}
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
                        {tr('contactFarmer.chat', 'Chat in App')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Get Location Button */}
                  <TouchableOpacity
                    onPress={() => handleGetLocation(farmer.farmerName)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 14,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#8B5CF6',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                    >
                      <Navigation size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '700',
                        marginLeft: 10,
                      }}>
                        {tr('contactFarmer.getLocation', 'Get Location')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};