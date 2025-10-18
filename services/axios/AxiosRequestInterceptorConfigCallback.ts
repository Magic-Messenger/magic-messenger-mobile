import type { InternalAxiosRequestConfig } from "axios";

import { DEFAULT_LANGUAGE } from "@/constants";
import { useAppStore, useUserStore } from "@/store";

const AxiosRequestInterceptorConfigCallback = (
  config: InternalAxiosRequestConfig,
) => {
  if (!config.headers) {
    config.headers = {} as any;
  }

  const accessToken = useUserStore.getState()?.accessToken || "";
  if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;

  config.headers["Accept-Language"] =
    useAppStore.getState()?.settings?.language ?? DEFAULT_LANGUAGE;

  return config;
};

export default AxiosRequestInterceptorConfigCallback;
