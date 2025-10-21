import type { AxiosError } from "axios";

import { ResultMessage } from "@/api/models";
import { TWO_FACTOR_NOT_SETUP, TWO_FACTOR_VERIFY_REQUIRED } from "@/constants";
import { useUserStore } from "@/store";
import { showToast, trackEvent } from "@/utils";

const unauthorizedCode = [401, 419, 440];

const notShowErrorMessages = [TWO_FACTOR_NOT_SETUP, TWO_FACTOR_VERIFY_REQUIRED];

const AxiosResponseInterceptorErrorCallback = (error: AxiosError) => {
  const { response } = error;

  if (response) {
    if (unauthorizedCode.includes(response.status)) {
      useUserStore.setState({
        isLogin: false,
        accessToken: null,
      });
    } else {
      const messages =
        (response?.data as { messages: ResultMessage[] })?.messages ||
        (response?.data as ResultMessage[]) ||
        [];
      trackEvent("Magic Error Messages: ", messages);
      if (messages?.length > 0) {
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
