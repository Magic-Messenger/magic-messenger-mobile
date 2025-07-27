import { useUserStore } from "@/store";
import { showToast } from "@/utils";
import type { AxiosError } from "axios";

const unauthorizedCode = [401, 419, 440];

const AxiosResponseInterceptorErrorCallback = (error: AxiosError) => {
  const { response, code } = error;
  if (code === "ERR_CANCELED") return;
  console.log("ERROR Response: ", response);
  showToast({
    text1: (response?.data as { message: string })?.message ?? response?.data,
    type: "error",
  });
  if (response && unauthorizedCode.includes(response.status)) {
    useUserStore.setState({
      isLogin: false,
      accessToken: null,
    });
  }
};

export default AxiosResponseInterceptorErrorCallback;
