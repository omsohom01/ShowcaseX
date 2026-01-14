import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import {
  ArrowLeft,
  Send,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth } from '../config/firebase';
import {
  ChatMessage,
  getOrCreateChatThread,
  markChatThreadRead,
  sendChatMessage,
  subscribeToChatMessages,
} from '../services/chat';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chat'
>;

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type UiMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: Date;
};

export const ChatScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    contactName,
    contactPhone,
    userType,
    dealId,
    buyerId,
    buyerName,
    farmerId,
    farmerName,
  } = route.params || {
    contactName: 'Contact',
    contactPhone: '',
    userType: 'buyer',
  };

  const [message, setMessage] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);

  const tr = (key: string, fallback: string) => {
    try {
      return i18n.exists(key) ? (t(key) as string) : fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    if (!buyerId || !farmerId) {
      // Backwards-compat navigation (no IDs). Keep screen functional but without DB chat.
      setThreadId(null);
      return;
    }

    let cancelled = false;
    setLoadingThread(true);
    getOrCreateChatThread({
      buyerId,
      farmerId,
      buyerName,
      farmerName,
      dealId,
    })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          Alert.alert(tr('chat.error', 'Error'), res.message);
          setThreadId(null);
          return;
        }
        setThreadId(res.thread.id);
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buyerId, farmerId, buyerName, farmerName, dealId]);

  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToChatMessages(threadId, (msgs: ChatMessage[]) => {
      const mapped: UiMessage[] = msgs.map((m) => ({
        id: m.id,
        text: m.text,
        senderId: m.senderId,
        createdAt: (m.createdAt?.toDate?.() ?? new Date()) as Date,
      }));
      setMessages(mapped);
    });
    return unsub;
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    // Mark as read when chat opens.
    markChatThreadRead(threadId);
  }, [threadId]);

  useEffect(() => {
    const myId = auth.currentUser?.uid;
    if (!threadId || !myId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.senderId && last.senderId !== myId) {
      // New incoming message while screen is open => clear unread.
      markChatThreadRead(threadId);
    }
  }, [messages.length, threadId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSendMessage = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(tr('chat.error', 'Error'), tr('chat.notSignedIn', 'Please sign in again.'));
      return;
    }
    if (!threadId) {
      Alert.alert(
        tr('chat.error', 'Error'),
        tr('chat.missingChatContext', 'Chat is not available for this contact yet.')
      );
      return;
    }

    const text = message.trim();
    if (!text) return;

    setMessage('');
    const res = await sendChatMessage({ threadId, text });
    if (!res.success) {
      Alert.alert(tr('chat.error', 'Error'), res.message);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <View className="flex-1 bg-[#128C7E]">
      <SafeAreaView className="flex-1 bg-[#128C7E]">
        {/* Header */}
        <View className="bg-[#128C7E] px-4 pt-8 pb-4 flex-row items-center justify-between"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 p-1"
              activeOpacity={0.6}
            >
              <ArrowLeft size={26} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-white/35 rounded-full w-12 h-12 items-center justify-center mr-3"
              activeOpacity={0.7}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text className="text-white text-[19px] font-bold">
                {contactName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
            <View className="flex-1 justify-center">
              <Text className="text-white text-[19px] font-bold leading-tight" numberOfLines={1}>
                {contactName}
              </Text>
              <Text className="text-white text-[14px] font-normal mt-1">
                {tr('chat.online', 'Online')}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            {/* Removed call / video buttons (requested) */}
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View className="flex-1 bg-[#ECE5DD]">
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
          {messages.map((msg) => {
            const myId = auth.currentUser?.uid;
            const isMe = !!myId && msg.senderId === myId;
            return (
            <View
              key={msg.id}
              className={`mb-2.5 ${
                isMe ? 'items-end' : 'items-start'
              }`}
            >
              <View
                className={`max-w-[82%] rounded-lg px-3.5 py-2.5 ${
                  isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isMe ? 0.08 : 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text className="text-[15.5px] leading-5 text-gray-900">{msg.text}</Text>
                <View className="flex-row items-center justify-end mt-1 -mb-0.5">
                  <Text className={`text-[11px] ${isMe ? 'text-gray-600' : 'text-gray-500'}`}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
            );
          })}
        </ScrollView>

            {/* Input Area */}
            <View className="bg-[#F0F0F0] px-4 py-3">
              <View className="flex-row items-center">
            {/* Removed location button (requested) */}
            <View
              className="flex-1 bg-white rounded-[22px] px-4 py-2 flex-row items-center mr-2"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <TextInput
                className="flex-1 text-[16px] text-gray-900 max-h-24"
                placeholder={tr('chat.typeMessage', 'Type a message...')}
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              className="bg-[#128C7E] rounded-full w-11 h-11 items-center justify-center"
              activeOpacity={0.7}
              disabled={message.trim().length === 0}
              style={{
                opacity: message.trim().length === 0 ? 0.5 : 1,
              }}
            >
              <Send size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
