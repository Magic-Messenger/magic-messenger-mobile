import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { NotificationBehavior } from "expo-notifications";
import { Platform } from "react-native";

if (Platform.OS === "android")
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }) as NotificationBehavior,
  });

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    console.log("Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  console.log("✅ Expo Push Token:", tokenData?.data);
  return tokenData?.data;
}
