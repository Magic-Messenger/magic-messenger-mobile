import dayjs from "dayjs";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { changeLanguage as i18nChangeLanguage } from "i18next";
import { Platform } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";

import { MessageStatus, MessageType } from "@/api/models";
import { Images, SUPPORT_LANGUAGES } from "@/constants";
import i18n from "@/i18n";
import { useAppStore } from "@/store";

import { heightPixel, widthPixel } from "./pixelHelper";

export const changeLanguage = (language: string) => {
  useAppStore.setState(() => ({
    settings: {
      language,
    },
  }));

  i18nChangeLanguage(language);
};

export const copyToClipboard = async (
  copyData: string,
  successMessage?: string,
) => {
  await Clipboard.setStringAsync(copyData);

  if (successMessage) {
    showToast({
      type: "success",
      text1: successMessage ?? i18n.t("common.successCopy"),
    });
  }
};

export const showToast = (toastConfig: ToastShowParams) => {
  if (!toastConfig) return;

  Toast.show({
    ...toastConfig,
  });
};

export const getInstallationId = async () => {
  if (Platform.OS === "ios") {
    return await Application.getIosIdForVendorAsync();
  } else if (Platform.OS === "android") {
    return Application.getAndroidId();
  }
};

export const getApplicationId = () => Application.applicationId;

export const headerImage = () => {
  return {
    headerTitle: () => (
      <Image
        source={Images.logo}
        contentFit="contain"
        style={{
          width: widthPixel(105),
          height: heightPixel(30),
        }}
      />
    ),
  };
};

export function convertUserId(userID: string | any) {
  return userID?.match(/.{1,4}/g).join("-") ?? "";
}

export function appSupportLanguages(): {
  label: string;
  value: string | number;
}[] {
  return SUPPORT_LANGUAGES.map((item) => ({
    label: i18n.t(`languages.${item}`),
    value: item,
  }));
}

export const dateFormatter = (dateString: string, format: string) => {
  return dateString ? dayjs(dateString).format(format ?? "MM.DD.YYYY") : "";
};

export const chatDateFormatter = (dateString: string) => {
  if (!dateString) return "";

  const date = dayjs(dateString);
  const now = dayjs();

  const diffInSeconds = now.diff(date, "second");
  const diffInMinutes = now.diff(date, "minute");
  const diffInHours = now.diff(date, "hour");
  const diffInDays = now.diff(date, "day");

  if (diffInSeconds < 60) {
    return i18n.t("common.secondsAgo", { count: diffInSeconds });
  } else if (diffInMinutes < 60) {
    return i18n.t("common.minutesAgo", { count: diffInMinutes });
  } else if (diffInHours < 24) {
    return i18n.t("common.hoursAgo", { count: diffInHours });
  } else if (diffInDays < 30) {
    return i18n.t("common.daysAgo", { count: diffInDays });
  } else {
    return date.format("DD/MM/YYYY");
  }
};

export const trackEvent = (eventName: string, params?: any) => {
  if (__DEV__) console.log(`Event: ${eventName}`, params ?? "");
};

export const convertMessageType = (messageType: number) => {
  switch (messageType) {
    case 0:
      return MessageType.Text;
    case 1:
      return MessageType.Image;
    case 2:
      return MessageType.Video;
    case 3:
      return MessageType.Audio;
    default:
      return MessageType.Text;
  }
};

export const convertMessageStatus = (messageStatus: number) => {
  switch (messageStatus) {
    case 0:
      return MessageStatus.Sent;
    case 1:
      return MessageStatus.Delivered;
    case 2:
      return MessageStatus.Seen;
    default:
      return MessageStatus.Sent;
  }
};
