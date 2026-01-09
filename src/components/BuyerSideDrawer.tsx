import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { User, ShoppingCart, Package } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface BuyerSideDrawerProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (screen: 'Profile' | 'ContactFarmer' | 'ViewAllCrops') => void;
}

export const BuyerSideDrawer: React.FC<BuyerSideDrawerProps> = ({
    visible,
    onClose,
    onNavigate,
}) => {
    const { t, i18n } = useTranslation();

    const tr = (key: string, fallback: string) => {
        try {
            if (!i18n || !i18n.isInitialized) {
                return fallback;
            }
            return t(key) || fallback;
        } catch {
            return fallback;
        }
    };

    const handleNavigate = (screen: 'Profile' | 'ContactFarmer' | 'ViewAllCrops') => {
        onClose();
        onNavigate(screen);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}>
                    <TouchableWithoutFeedback>
                        <View style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 320,
                            backgroundColor: '#FFFFFF',
                        }}>
                            <ScrollView style={{ flex: 1 }}>
                                {/* Header */}
                                <View style={{
                                    backgroundColor: '#16A34A',
                                    paddingHorizontal: 24,
                                    paddingTop: 64,
                                    paddingBottom: 32,
                                }}>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={{
                                            position: 'absolute',
                                            top: 48,
                                            right: 24,
                                            zIndex: 10,
                                        }}
                                    >
                                        <Ionicons name="close" size={28} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={{
                                        color: '#FFFFFF',
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                    }}>
                                        {tr('buyerDrawer.title', 'Buyer Menu')}
                                    </Text>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        fontSize: 14,
                                        marginTop: 4,
                                    }}>
                                        {tr('buyerDrawer.subtitle', 'Navigate to features')}
                                    </Text>
                                </View>

                                {/* Menu Items */}
                                <View style={{ padding: 24 }}>
                                    {/* View All Crops */}
                                    <TouchableOpacity
                                        onPress={() => handleNavigate('ViewAllCrops')}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#F3F4F6',
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: '#DCFCE7',
                                            borderRadius: 24,
                                            width: 48,
                                            height: 48,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Package size={24} color="#16A34A" strokeWidth={2} />
                                        </View>
                                        <View style={{ marginLeft: 16, flex: 1 }}>
                                            <Text style={{
                                                color: '#111827',
                                                fontSize: 16,
                                                fontWeight: '600',
                                            }}>
                                                {tr('buyerDrawer.viewAllCrops', 'View All Crops')}
                                            </Text>
                                            <Text style={{
                                                color: '#6B7280',
                                                fontSize: 14,
                                            }}>
                                                {tr('buyerDrawer.viewAllCropsSubtitle', 'Browse available crops from farmers')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Contact Farmer */}
                                    <TouchableOpacity
                                        onPress={() => handleNavigate('ContactFarmer')}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#F3F4F6',
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: '#DBEAFE',
                                            borderRadius: 24,
                                            width: 48,
                                            height: 48,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <ShoppingCart size={24} color="#3B82F6" strokeWidth={2} />
                                        </View>
                                        <View style={{ marginLeft: 16, flex: 1 }}>
                                            <Text style={{
                                                color: '#111827',
                                                fontSize: 16,
                                                fontWeight: '600',
                                            }}>
                                                {tr('buyerDrawer.contactFarmer', 'Contact Farmer')}
                                            </Text>
                                            <Text style={{
                                                color: '#6B7280',
                                                fontSize: 14,
                                            }}>
                                                {tr('buyerDrawer.contactFarmerSubtitle', 'Connect with farmers directly')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Profile */}
                                    <TouchableOpacity
                                        onPress={() => handleNavigate('Profile')}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: '#F3E8FF',
                                            borderRadius: 24,
                                            width: 48,
                                            height: 48,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <User size={24} color="#9333EA" strokeWidth={2} />
                                        </View>
                                        <View style={{ marginLeft: 16, flex: 1 }}>
                                            <Text style={{
                                                color: '#111827',
                                                fontSize: 16,
                                                fontWeight: '600',
                                            }}>
                                                {tr('buyerDrawer.profile', 'My Profile')}
                                            </Text>
                                            <Text style={{
                                                color: '#6B7280',
                                                fontSize: 14,
                                            }}>
                                                {tr('buyerDrawer.profileSubtitle', 'Manage your account settings')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Version Info */}
                                <View style={{
                                    paddingHorizontal: 24,
                                    paddingBottom: 32,
                                }}>
                                    <Text style={{
                                        color: '#9CA3AF',
                                        fontSize: 12,
                                        textAlign: 'center',
                                    }}>
                                        {tr('buyerDrawer.version', 'Version')} 1.0.0
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
