import { shotToast } from "@/utils";
import type { AxiosError } from "axios";

const unauthorizedCode = [401, 419, 440];

const AxiosResponseInterceptorErrorCallback = (error: AxiosError) => {
  const { response } = error;
  console.log("response: ", response);
  shotToast({
    text1: (response?.data as { message: string })?.message ?? response?.data,
    type: "error",
  });
  if (response && unauthorizedCode.includes(response.status)) {
    /* useSessionUser.getState().setToken(undefined);
    useSessionUser.getState().setAccount(undefined); */
  }
};

export default AxiosResponseInterceptorErrorCallback;
