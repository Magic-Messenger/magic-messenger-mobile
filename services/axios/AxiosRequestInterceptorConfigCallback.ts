import type { InternalAxiosRequestConfig } from "axios";

import { useUserStore } from "@/store";

const AxiosRequestIntrceptorConfigCallback = (
  config: InternalAxiosRequestConfig,
) => {
  // Headers yoksa oluştur
  if (!config.headers) {
    config.headers = {} as any;
  }

  const accessToken = useUserStore.getState()?.accessToken || "";
  if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;

  return config;
};

export default AxiosRequestIntrceptorConfigCallback;
