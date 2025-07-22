/* import { useSessionUser } from "@/store/authStore"; */
import type { InternalAxiosRequestConfig } from "axios";

const AxiosRequestIntrceptorConfigCallback = (
  config: InternalAxiosRequestConfig
) => {
  /* const accessToken = useSessionUser.getState().accessToken?.token || "";
  if (accessToken)
    config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`; */

  return config;
};

export default AxiosRequestIntrceptorConfigCallback;
