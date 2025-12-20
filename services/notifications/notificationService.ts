import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { NotificationBehavior } from "expo-notifications";
import { t } from "i18next";
import { Platform } from "react-native";

import {
  postApiChatsMessageDelivered,
  postApiChatsMessageRead,
} from "@/api/endpoints/magicMessenger";
import { useWebRTCStore } from "@/store";

import { trackEvent } from "../../utils/helper";

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

// --- Opened listener (user tapped) ---
export const registerOpenedListener = () => {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    Notifications.setBadgeCountAsync(0);
    Notifications.dismissAllNotificationsAsync();

    const action = response.actionIdentifier;
    const messageData = response.notification.request.content.data;
    if (!messageData) return;

    trackEvent("👆 Message opened:", messageData);

    if (
      messageData.callingType === "AudioCalling" ||
      messageData.callingType === "VideoCalling"
    ) {
      // This is calling, so we need to know user accept or reject call.

      if (action === "ACCEPT_CALL") {
        // Store'a bilgiler yazılır.
        // Login olduktan sonra bu bilgiler kontrol edilir, bilgiler var ise direk calling açılır. Bilgiler yoksa normal login işlemi devam eder.
        useWebRTCStore.getState().answerCall?.({
          callingType:
            messageData.callingType === "VideoCalling" ? "Video" : "Audio",
          offer: messageData.offer as string,
          callerUsername: messageData.callerUsername as string,
        });
      } else if (action === "REJECT_CALL") {
        useWebRTCStore.getState().endCall?.();
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
  });
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

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
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
  trackEvent("✅ Expo Push Token:", { token: tokenData?.data });
  return tokenData?.data;
}
