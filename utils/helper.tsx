import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { changeLanguage as i18nChangeLanguage } from "i18next";
import { Platform } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";

import { Images } from "@/constants";
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
  if (process.env?.EXPO_PUBLIC_SUPPORT_LANGUAGES) {
    return process.env?.EXPO_PUBLIC_SUPPORT_LANGUAGES?.split(",")?.map(
      (item) => ({ label: i18n.t(`languages.${item}`), value: item }),
    );
  }

  return [];
}
