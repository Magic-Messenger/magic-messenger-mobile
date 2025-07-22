import { useAppStore } from "@/store";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import { changeLanguage as i18nChangeLanguage } from "i18next";
import { Platform } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";

export const changeLanguage = (language: string) => {
  useAppStore.setState(() => ({
    settings: {
      language,
    },
  }));

  i18nChangeLanguage(language);
  console.log(useAppStore.getState());
};

export const copyToClipboard = async (copyData: string) => {
  await Clipboard.setStringAsync(copyData);
};

export const shotToast = (toastConfig: ToastShowParams) => {
  if (!toastConfig) return;

  Toast.show({
    ...toastConfig,
  });
};

export const getInstallationId = async () => {
  if (Platform.OS === "ios") {
    return await Application.getIosIdForVendorAsync();
  } else if (Platform.OS === "android") {
    return await Application.getAndroidId();
  }
};
