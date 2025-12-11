import LogRocket from "@logrocket/react-native";
import dayjs from "dayjs";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { changeLanguage as i18nChangeLanguage } from "i18next";
import React from "react";
import { Platform } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";

import { MessageStatus } from "@/api/models";
import { Icon } from "@/components";
import { commonStyle, Images, SUPPORT_LANGUAGES } from "@/constants";
import i18n from "@/i18n";
import { useAppStore } from "@/store";

import { heightPixel, widthPixel } from "./pixelHelper";

export const changeLanguage = (language: string) => {
  useAppStore.setState(() => ({
    language,
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

export const hideToast = () => {
  Toast.hide();
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

  return dayjs(dateString).fromNow();
};

export const trackEvent = (eventName: string, params?: any) => {
  if (__DEV__) console.log(`Event: ${eventName}`, params ?? "");
  LogRocket.track(eventName, params ?? {});
};

export const renderMessageStatus = (
  messageStatus: MessageStatus,
  isSentByCurrentUser?: boolean,
) => {
  if (!isSentByCurrentUser) return null;

  switch (messageStatus) {
    case MessageStatus.Sent:
      return (
        <Icon
          type="ionicons"
          name="checkmark"
          size={16}
          color="white"
          style={commonStyle.statusIcon}
        />
      );
    case MessageStatus.Delivered:
      return (
        <Icon
          type="ionicons"
          name="checkmark-done"
          size={16}
          color="white"
          style={commonStyle.statusIcon}
        />
      );
    case MessageStatus.Seen:
      return (
        <Icon
          type="ionicons"
          name="checkmark-done"
          size={16}
          color="#90D5FF"
          style={commonStyle.statusIconSeen}
        />
      );
    default:
      return (
        <Icon
          type="feather"
          name="clock"
          size={16}
          color="white"
          style={commonStyle.statusIcon}
        />
      );
  }
};

export function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
console.log(uuidv4());
