import type { InternalAxiosRequestConfig } from "axios";

import { useUserStore } from "@/store";

const AxiosRequestIntrceptorConfigCallback = (
  config: InternalAxiosRequestConfig,
) => {
  const accessToken = useUserStore.getState()?.accessToken || "";
  if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;

  return config;
};

export default AxiosRequestIntrceptorConfigCallback;
