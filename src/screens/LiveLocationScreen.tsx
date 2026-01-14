import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { auth } from '../config/firebase';
import {
  detectCurrentLocation,
  subscribeToUserLastKnownLocation,
  updateMyLastKnownLocation,
} from '../services/location';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LiveLocation'>;
type Rt = RouteProp<RootStackParamList, 'LiveLocation'>;

export const LiveLocationScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const {
    dealId,
    buyerId,
    buyerName,
    farmerId,
    farmerName,
    viewerType,
  } = route.params;

  const tr = (key: string, fallback: string) => {
    try {
      return i18n.exists(key) ? (t(key) as string) : fallback;
    } catch {
      return fallback;
    }
  };

  const [loading, setLoading] = useState(true);
  const [otherLocation, setOtherLocation] = useState<{ lat: number; lng: number; updatedAt?: Date } | null>(null);

  const otherUid = useMemo(() => {
    return viewerType === 'buyer' ? farmerId : buyerId;
  }, [viewerType, buyerId, farmerId]);

  const otherName = useMemo(() => {
    return viewerType === 'buyer' ? (farmerName || tr('liveLocation.farmer', 'Farmer')) : (buyerName || tr('liveLocation.buyer', 'Buyer'));
  }, [viewerType, buyerName, farmerName, i18n.language]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(tr('liveLocation.error', 'Error'), tr('liveLocation.notSignedIn', 'Please sign in again.'));
      navigation.goBack();
      return;
    }

    setLoading(false);
    // Best-effort: update *your own* last known location so both users can see each other.
    // This does NOT gate viewing the other user's location.
    (async () => {
      try {
        const res = await detectCurrentLocation();
        if (!res.ok) return;
        await updateMyLastKnownLocation({
          lat: res.location.coords.latitude,
          lng: res.location.coords.longitude,
        });
      } catch (e) {
        // Silent fail: viewing should still work.
        console.warn('LiveLocationScreen own-location update failed:', e);
      }
    })();
  }, [dealId, buyerId, farmerId]);

  useEffect(() => {
    const unsub = subscribeToUserLastKnownLocation(otherUid, setOtherLocation);
    return unsub;
  }, [otherUid]);

  const openInMaps = () => {
    if (!otherLocation) return;
    const url = `https://www.google.com/maps?q=${otherLocation.lat},${otherLocation.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(tr('liveLocation.error', 'Error'), tr('liveLocation.openMapsFailed', 'Unable to open maps.'));
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 10 }}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
            {tr('liveLocation.title', 'Live Location')}
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
            {tr('liveLocation.viewing', 'Viewing')}: {otherName}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MapPin size={18} color="#128C7E" strokeWidth={2.5} />
              <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '800', color: '#111827' }}>
                {tr('liveLocation.otherLastKnownLocation', 'Other user location')}
              </Text>
            </View>

            {otherLocation ? (
              <>
                <Text style={{ color: '#111827', fontSize: 14, fontWeight: '700' }}>
                  Lat: {otherLocation.lat.toFixed(6)}
                </Text>
                <Text style={{ color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 6 }}>
                  Lng: {otherLocation.lng.toFixed(6)}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 10 }}>
                  {tr('liveLocation.lastUpdated', 'Last updated')}: {otherLocation.updatedAt ? otherLocation.updatedAt.toLocaleTimeString() : tr('liveLocation.unknown', 'Unknown')}
                </Text>

                <TouchableOpacity
                  onPress={openInMaps}
                  activeOpacity={0.85}
                  style={{ marginTop: 14, backgroundColor: '#128C7E', borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>
                    {tr('liveLocation.openInMaps', 'Open in Maps')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: '#6B7280', fontSize: 13 }}>
                {tr('liveLocation.noLocationYet', 'No location available yet.')}
              </Text>
            )}

            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 14 }}>
              {tr('liveLocation.note', 'This shows the last known location saved in profile.')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
