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
    trackEvent("Must use physical device for push notifications");
    return null;
  }

  const permissonStatus = await messaging().hasPermission();
  let finalStatus = permissonStatus;

  if (
    permissonStatus !== AuthorizationStatus.AUTHORIZED &&
    permissonStatus !== AuthorizationStatus.PROVISIONAL
  ) {
    finalStatus = await messaging().requestPermission();
  }

  if (
    finalStatus !== AuthorizationStatus.AUTHORIZED &&
    finalStatus !== AuthorizationStatus.PROVISIONAL
  ) {
    trackEvent("Failed to get push token");
    return null;
  }

  trackEvent(
    "✅ Firebase Is Device Registered For Remote Messages:",
    messaging().isDeviceRegisteredForRemoteMessages,
  );
  if (!messaging().isDeviceRegisteredForRemoteMessages)
    await messaging().registerDeviceForRemoteMessages();

  const firebaseTokenData = await messaging().getToken();

  trackEvent("✅ Firebase Push Token:", firebaseTokenData);
  return firebaseTokenData;
}
