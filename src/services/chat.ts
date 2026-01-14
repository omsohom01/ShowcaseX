import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  addDoc,
  serverTimestamp,
  limit,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export type ChatParticipantRole = 'buyer' | 'farmer';

export interface ChatThread {
  id: string;
  participantIds: [string, string];
  buyerId: string;
  farmerId: string;
  buyerName?: string;
  farmerName?: string;
  dealId?: string;
  lastMessageText?: string;
  lastMessageAt?: Timestamp;
  unreadBy?: Record<string, number>;
  lastReadAtBy?: Record<string, unknown>;
  liveLocationBy?: Record<
    string,
    {
      lat: number;
      lng: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      updatedAtClient?: Timestamp;
      updatedAtServer?: unknown;
    }
  >;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
  createdAtServer?: unknown;
}

const buildThreadId = (args: {
  buyerId: string;
  farmerId: string;
  dealId?: string;
}): string => {
  if (args.dealId) return `deal_${args.dealId}`;
  // Pair thread (stable ordering)
  const [a, b] = [args.buyerId, args.farmerId].sort();
  return `pair_${a}_${b}`;
};

export const getOrCreateChatThread = async (args: {
  buyerId: string;
  farmerId: string;
  buyerName?: string;
  farmerName?: string;
  dealId?: string;
}): Promise<{ success: true; thread: ChatThread } | { success: false; message: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'Not signed in.' };

  const threadId = buildThreadId(args);
  const threadRef = doc(db, 'chats', threadId);

  try {
    const snap = await getDoc(threadRef);
    if (snap.exists()) {
      const data = snap.data() as Omit<ChatThread, 'id'>;
      return { success: true, thread: { id: threadId, ...(data as any) } };
    }

    const participantIds: [string, string] = [args.buyerId, args.farmerId];
    if (!participantIds.includes(user.uid)) {
      return { success: false, message: 'You are not a participant of this chat.' };
    }

    const thread: Omit<ChatThread, 'id'> = {
      participantIds,
      buyerId: args.buyerId,
      farmerId: args.farmerId,
      buyerName: args.buyerName,
      farmerName: args.farmerName,
      dealId: args.dealId,
      lastMessageText: '',
      lastMessageAt: Timestamp.now(),
      unreadBy: {
        [args.buyerId]: 0,
        [args.farmerId]: 0,
      },
      lastReadAtBy: {
        [args.buyerId]: serverTimestamp(),
        [args.farmerId]: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(threadRef, thread, { merge: false });
    return { success: true, thread: { id: threadId, ...(thread as any) } };
  } catch (e) {
    console.error('getOrCreateChatThread error:', e);
    return { success: false, message: 'Failed to open chat.' };
  }
};

export const subscribeToChatMessages = (
  threadId: string,
  onMessages: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'chats', threadId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));

  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      onMessages(msgs);
    },
    (err) => {
      console.error('subscribeToChatMessages error:', err);
      onMessages([]);
    }
  );
};

export const sendChatMessage = async (args: {
  threadId: string;
  text: string;
}): Promise<{ success: true } | { success: false; message: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'Not signed in.' };

  const text = args.text.trim();
  if (!text) return { success: false, message: 'Empty message.' };

  try {
    const createdAt = Timestamp.now();
    const messagesRef = collection(db, 'chats', args.threadId, 'messages');
    await addDoc(messagesRef, {
      text,
      senderId: user.uid,
      createdAt,
      createdAtServer: serverTimestamp(),
    });

    // Update thread metadata + increment unread for the other participant.
    const threadRef = doc(db, 'chats', args.threadId);
    const threadSnap = await getDoc(threadRef);
    const participantIds = (threadSnap.data()?.participantIds ?? []) as string[];
    const otherUid = participantIds.find((id) => id && id !== user.uid);

    const update: Record<string, any> = {
      lastMessageText: text,
      lastMessageAt: createdAt,
      updatedAt: serverTimestamp(),
    };
    if (otherUid) {
      update[`unreadBy.${otherUid}`] = increment(1);
    }

    await updateDoc(threadRef, update);

    return { success: true };
  } catch (e) {
    console.error('sendChatMessage error:', e);
    return { success: false, message: 'Failed to send message.' };
  }
};

export const markChatThreadRead = async (
  threadId: string
): Promise<{ success: true } | { success: false; message: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'Not signed in.' };

  try {
    await updateDoc(doc(db, 'chats', threadId), {
      [`unreadBy.${user.uid}`]: 0,
      [`lastReadAtBy.${user.uid}`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.error('markChatThreadRead error:', e);
    return { success: false, message: 'Failed to mark as read.' };
  }
};

export const subscribeToChatUnreadCount = (
  threadId: string,
  uid: string,
  onCount: (count: number) => void
): (() => void) => {
  const ref = doc(db, 'chats', threadId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onCount(0);
        return;
      }
      const data = snap.data() as any;
      const unread = Number(data?.unreadBy?.[uid] ?? 0);
      onCount(Number.isFinite(unread) ? unread : 0);
    },
    (err) => {
      console.error('subscribeToChatUnreadCount error:', err);
      onCount(0);
    }
  );
};

export const updateMyLiveLocation = async (args: {
  threadId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}): Promise<{ success: true } | { success: false; message: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'Not signed in.' };

  try {
    await updateDoc(doc(db, 'chats', args.threadId), {
      [`liveLocationBy.${user.uid}`]: {
        lat: args.lat,
        lng: args.lng,
        accuracy: args.accuracy,
        heading: args.heading,
        speed: args.speed,
        updatedAtClient: Timestamp.now(),
        updatedAtServer: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.error('updateMyLiveLocation error:', e);
    return { success: false, message: 'Failed to share location.' };
  }
};

export const subscribeToLiveLocation = (
  threadId: string,
  participantUid: string,
  onLocation: (location: { lat: number; lng: number; updatedAt?: Date } | null) => void
): (() => void) => {
  const ref = doc(db, 'chats', threadId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onLocation(null);
        return;
      }
      const data = snap.data() as any;
      const raw = data?.liveLocationBy?.[participantUid];
      if (!raw || typeof raw.lat !== 'number' || typeof raw.lng !== 'number') {
        onLocation(null);
        return;
      }
      const updatedAt = raw.updatedAtClient?.toDate?.() ?? undefined;
      onLocation({ lat: raw.lat, lng: raw.lng, updatedAt });
    },
    (err) => {
      console.error('subscribeToLiveLocation error:', err);
      onLocation(null);
    }
  );
};
