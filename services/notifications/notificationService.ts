import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { NotificationBehavior } from "expo-notifications";
import { Platform } from "react-native";

import {
  postApiChatsMessageDelivered,
  postApiChatsMessageRead,
} from "@/api/endpoints/magicMessenger";

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
    try {
      Notifications.setBadgeCountAsync(0);
      Notifications.dismissAllNotificationsAsync();

      const messageData = response.notification.request.content.data;
      if (!messageData) return;

      const deliveredMessageNotificationData =
        messageData as DeliveredMessageNotificationData;
      if (
        deliveredMessageNotificationData.ChatId &&
        deliveredMessageNotificationData.MessageId
      ) {
        trackEvent("👆 Message opened:", messageData);

        await postApiChatsMessageRead({
          chatId: deliveredMessageNotificationData.ChatId,
          messageId: deliveredMessageNotificationData.MessageId,
        });
      }
    } catch (err) {
      trackEvent("Opened handler failed:", { err });
    }
  });
};

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
