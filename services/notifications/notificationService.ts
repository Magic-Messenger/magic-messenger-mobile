import notifee, { AndroidImportance } from "@notifee/react-native";
import messaging, {
  AuthorizationStatus,
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { Platform } from "react-native";

import {
  postApiChatsMessageDelivered,
  postApiChatsMessageRead,
} from "@/api/endpoints/magicMessenger";
import { UNANSWERED_CALL } from "@/constants";

import { showToast, trackEvent } from "../../utils/helper";

type DeliveredMessageNotificationData = {
  ChatId: string;
  MessageId: string;
};

if (Platform.OS === "android") {
  notifee.createChannel({
    id: "default",
    name: "Default",
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
  });
}

// --- Delivered listener (foreground + background) ---
export const registerDeliveredListener = () => {
  messaging().onMessage(async (notification) => {
    try {
      trackEvent("📩 Message delivered:", notification);

      const notificationData = notification.data;
      if (!notificationData) return;

      const notificationMessageData = JSON.parse(
        (notificationData?.data as string) || "{}",
      ) as { type: string };

      if (notificationMessageData?.type === UNANSWERED_CALL) {
        showToast({
          type: "notification",
          text1: notification.notification?.title,
          text2: notification.notification?.body,
          visibilityTime: 5000,
        });
        return;
      }

      const deliveredMessageNotificationData =
        notificationData as DeliveredMessageNotificationData;
      if (
        deliveredMessageNotificationData.ChatId &&
        deliveredMessageNotificationData.MessageId
      ) {
        await postApiChatsMessageDelivered({
          chatId: deliveredMessageNotificationData.ChatId,
          messageId: deliveredMessageNotificationData.MessageId,
        });
      }
    } catch (err) {
      trackEvent("Delivered handler failed:", { err });
    }
  });
};

// --- Handle notification response (shared logic) ---
const handleNotificationResponse = async (
  response: FirebaseMessagingTypes.RemoteMessage,
) => {
  clearAllNotifications();

  const notificationData = response.data;
  if (!notificationData) return;

  trackEvent("👆 Message opened:", notificationData);

  const notificationMessageData = JSON.parse(
    (notificationData?.data as string) || "{}",
  );

  const deliveredMessageNotificationData =
    notificationMessageData as DeliveredMessageNotificationData;
  if (
    deliveredMessageNotificationData.ChatId &&
    deliveredMessageNotificationData.MessageId
  ) {
    // This is a chat message, so we need to send a message read notification

    await postApiChatsMessageRead({
      chatId: deliveredMessageNotificationData.ChatId,
      messageId: deliveredMessageNotificationData.MessageId,
    });
  }
};

// --- Opened listener (user tapped - works when app is in foreground/background) ---
export const registerOpenedListener = () => {
  messaging().onNotificationOpenedApp(handleNotificationResponse);
};

// --- Check initial notification (for cold start - app was killed) ---
export const checkInitialNotification = async () => {
  const response = await messaging().getInitialNotification();
  if (response) {
    trackEvent("📱 Initial notification found (cold start):", response);
    await handleNotificationResponse(response);
  }
};

// --- Initialization helper ---
export const setupNotificationListeners = () => {
  registerDeliveredListener();
  registerOpenedListener();
};

export function clearAllNotifications() {
  notifee.setBadgeCount(0);
  notifee.cancelAllNotifications();
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    trackEvent("❌ Push notifications require a physical device");
    return null;
  }

  /* 1️⃣ Permission */
  const authStatus = await messaging().requestPermission({
    alert: true,
    badge: true,
    sound: true,
  });

  const isAuthorized =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (!isAuthorized) {
    trackEvent("❌ Push permission not granted");
    return null;
  }

  /* 2️⃣ iOS – APNs required */
  if (Platform.OS === "ios") {
    await messaging().registerDeviceForRemoteMessages();

    const apnsToken = await messaging().getAPNSToken();
    trackEvent("🍎 APNS Token:", apnsToken);

    if (!apnsToken) {
      trackEvent("❌ APNS token not available");
      return null;
    }
  }

  /* 3️⃣ Token created (Android + iOS) */
  await new Promise((r) => setTimeout(r, 1500));
  const fcmToken = await messaging().getToken();
  trackEvent("🔥 FCM Token:", fcmToken);

  return fcmToken ?? null;
}
