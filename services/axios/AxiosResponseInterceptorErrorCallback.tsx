import { useUserStore } from "@/store";
import { shotToast } from "@/utils";
import type { AxiosError } from "axios";

const unauthorizedCode = [401, 419, 440];

const AxiosResponseInterceptorErrorCallback = (error: AxiosError) => {
  const { response } = error;
  console.log("ERROR Response: ", response);
  shotToast({
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
