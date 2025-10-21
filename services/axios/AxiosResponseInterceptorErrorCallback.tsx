import type { AxiosError } from "axios";
import { router } from "expo-router";

import { ResultMessage } from "@/api/models";
import {
  LICENSE_EXPIRED,
  TWO_FACTOR_NOT_SETUP,
  TWO_FACTOR_VERIFY_REQUIRED,
} from "@/constants";
import { useUserStore } from "@/store";
import { showToast, trackEvent } from "@/utils";

const unauthorizedCode = [401, 419, 440];

const notShowErrorMessages = [
  LICENSE_EXPIRED,
  TWO_FACTOR_NOT_SETUP,
  TWO_FACTOR_VERIFY_REQUIRED,
];

const AxiosResponseInterceptorErrorCallback = (error: AxiosError) => {
  const { response } = error;

  if (response) {
    if (unauthorizedCode.includes(response.status)) {
      useUserStore.getState().logout();
    } else {
      const messages =
        (response?.data as { messages: ResultMessage[] })?.messages ||
        (response?.data as ResultMessage[]) ||
        [];
      trackEvent("Magic Error Messages: ", messages);
      if (messages?.length > 0) {
        if (messages.some((message) => message.code === LICENSE_EXPIRED)) {
          router.canDismiss() && router.dismissAll();
          router.replace("/(auth)/licenseExpired/screens/licenseExpired");
        }

        if (
          !messages.some((message) =>
            notShowErrorMessages.includes(message.code!),
          )
        )
          messages?.forEach((message) => {
            showToast({
              text1: message.description ?? message.code!,
              type: "error",
            });
          });
      }
    }
  }
};

export default AxiosResponseInterceptorErrorCallback;
