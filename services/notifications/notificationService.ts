import notifee, {
  AndroidImportance,
  Event,
  EventType,
} from "@notifee/react-native";
import messaging, {
  AuthorizationStatus,
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { t } from "i18next";
import { Platform } from "react-native";

import {
  postApiChatsMessageDelivered,
  postApiChatsMessageRead,
} from "@/api/endpoints/magicMessenger";
import { CallingType } from "@/api/models";
import { PendingCallData, useCallingStore, useWebRTCStore } from "@/store";

import { trackEvent } from "../../utils/helper";

type DeliveredMessageNotificationData = {
  ChatId: string;
  MessageId: string;
};

// --- Delivered listener (foreground + background) ---
export const registerDeliveredListener = () => {
  messaging().onMessage(async (notification) => {
    try {
      trackEvent("📩 Message delivered:", notification);

      const messageData = notification.data;
      if (!messageData) return;

      const deliveredMessageNotificationData =
        messageData as DeliveredMessageNotificationData;
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

  const messageData = response.data;
  if (!messageData) return;

  trackEvent("👆 Message opened:", messageData);

  const deliveredMessageNotificationData =
    messageData as DeliveredMessageNotificationData;
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

const callActionIdentifier = ({ type, detail }: Event) => {
  if (type !== EventType.ACTION_PRESS) return;

  const { pressAction, notification } = detail;

  if (
    notification?.data?.callingType === "AudioCalling" ||
    notification?.data?.callingType === "VideoCalling"
  ) {
    // This is calling, so we need to know user accept or reject call.

    const callingMessageData = notification?.data as PendingCallData;

    // ACCEPT_CALL butonu veya direkt bildirime tıklama (default action)
    if (pressAction?.id === "ACCEPT_CALL") {
      // Pending call bilgisini oluştur
      const pendingCallData: PendingCallData = {
        callId: callingMessageData?.callId as string,
        callerNickname: callingMessageData?.callerNickname as string,
        offer: callingMessageData?.offer as string,
        callerUsername: callingMessageData?.callerUsername as string,
        callingType:
          notification?.data?.callingType === "VideoCalling"
            ? CallingType.Video
            : CallingType.Audio,
      };

      trackEvent("Saving pending call to store", pendingCallData);
      useCallingStore.getState().setPendingCall(pendingCallData);
    } else if (pressAction?.id === "REJECT_CALL") {
      useWebRTCStore.getState().endCall?.({
        callId: callingMessageData?.callId as string,
        targetUsername: callingMessageData?.callerUsername as string,
      });
    }
  }
};

export function registerCallActionListeners() {
  if (Platform.OS === "android") {
    notifee.createChannel({
      id: "default",
      name: "Default",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });
  }

  notifee.onForegroundEvent(callActionIdentifier);
  notifee.onBackgroundEvent(async (backgroundEvent) =>
    callActionIdentifier(backgroundEvent),
  );
}

// --- Check initial notification (for cold start - app was killed) ---
export const checkInitialNotification = async () => {
  const response = await messaging().getInitialNotification();
  if (response) {
    trackEvent("📱 Initial notification found (cold start):", response);
    await handleNotificationResponse(response);
  }
};

function registerCallNotificationCategory() {
  notifee.setNotificationCategories([
    {
      id: "incoming_call",
      actions: [
        {
          id: "ACCEPT_CALL",
          title: t("answer"),
          foreground: true,
        },
        {
          id: "REJECT_CALL",
          title: t("reject"),
          destructive: true,
          foreground: false,
        },
      ],
    },
  ]);
}

// --- Initialization helper ---
export const setupNotificationListeners = () => {
  registerDeliveredListener();
  registerOpenedListener();
  registerCallNotificationCategory();
  registerCallActionListeners();
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
