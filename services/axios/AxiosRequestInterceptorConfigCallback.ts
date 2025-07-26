import { useUserStore } from "@/store";
import type { InternalAxiosRequestConfig } from "axios";

const AxiosRequestIntrceptorConfigCallback = (
  config: InternalAxiosRequestConfig
) => {
  const accessToken = useUserStore.getState()?.accessToken || "";
  if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;

  return config;
};

export default AxiosRequestIntrceptorConfigCallback;
