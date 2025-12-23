import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { NotificationBehavior } from "expo-notifications";
import { t } from "i18next";
import { Platform } from "react-native";

import {
  postApiChatsMessageDelivered,
  postApiChatsMessageRead,
} from "@/api/endpoints/magicMessenger";
import { CallingType } from "@/api/models";
import { PendingCallData, useCallingStore, useWebRTCStore } from "@/store";

import { trackEvent } from "../../utils/helper";

export type RegisterPushNotificationTokenType = {
  token: string;
  firebaseToken: string;
};

type DeliveredMessageNotificationData = {
  ChatId: string;
  MessageId: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as NotificationBehavior,
});

if (Platform.OS === "android")
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });

// --- Delivered listener (foreground + background) ---
export const registerDeliveredListener = () => {
  Notifications.addNotificationReceivedListener(async (notification) => {
    try {
      const messageData = notification.request.content.data;
      if (!messageData) return;

      const deliveredMessageNotificationData =
        messageData as DeliveredMessageNotificationData;
      if (
        deliveredMessageNotificationData.ChatId &&
        deliveredMessageNotificationData.MessageId
      ) {
        trackEvent("📩 Message delivered:", messageData);

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
  response: Notifications.NotificationResponse,
) => {
  Notifications.setBadgeCountAsync(0);
  Notifications.dismissAllNotificationsAsync();

  const action = response.actionIdentifier;
  const messageData = response.notification.request.content.data;
  if (!messageData) return;

  trackEvent("👆 Message opened:", { action, messageData });

  if (
    messageData.callingType === "AudioCalling" ||
    messageData.callingType === "VideoCalling"
  ) {
    // This is calling, so we need to know user accept or reject call.

    const callingMessageData = messageData as PendingCallData;

    // ACCEPT_CALL butonu veya direkt bildirime tıklama (default action)
    if (
      action === "ACCEPT_CALL" ||
      action === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      // Pending call bilgisini oluştur
      const pendingCallData: PendingCallData = {
        callId: callingMessageData?.callId as string,
        callerNickname: callingMessageData?.callerNickname as string,
        offer: callingMessageData?.offer as string,
        callerUsername: callingMessageData?.callerUsername as string,
        callingType:
          messageData.callingType === "VideoCalling"
            ? CallingType.Video
            : CallingType.Audio,
      };

      trackEvent("Saving pending call to store", pendingCallData);
      useCallingStore.getState().setPendingCall(pendingCallData);
    } else if (action === "REJECT_CALL") {
      useWebRTCStore.getState().endCall?.({
        callId: callingMessageData?.callId as string,
        targetUsername: callingMessageData?.callerUsername as string,
      });
    }

    return;
  }

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
  Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );
};

// --- Check initial notification (for cold start - app was killed) ---
export const checkInitialNotification = async () => {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    trackEvent("📱 Initial notification found (cold start):", response);
    await handleNotificationResponse(response);
  }
};

export async function registerCallNotificationCategory() {
  await Notifications.setNotificationCategoryAsync("incoming_call", [
    {
      identifier: "ACCEPT_CALL",
      buttonTitle: t("answer"),
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: "REJECT_CALL",
      buttonTitle: t("reject"),
      options: {
        opensAppToForeground: false,
        isDestructive: true,
      },
    },
  ]);
}

// --- Initialization helper ---
export const setupNotificationListeners = () => {
  registerDeliveredListener();
  registerOpenedListener();
};

export async function registerForPushNotificationsAsync(): Promise<RegisterPushNotificationTokenType | null> {
  if (!Device.isDevice) {
    trackEvent("Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    trackEvent("Failed to get push token");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const firebaseTokenData = await Notifications.getDevicePushTokenAsync();

  const tokens = {
    token: tokenData?.data as string,
    firebaseToken: firebaseTokenData?.data as string,
  };

  trackEvent("✅ Expo Push Token:", tokens);
  return tokens;
}
