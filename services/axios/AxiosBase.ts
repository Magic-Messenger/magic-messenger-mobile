import type { AxiosError, AxiosRequestConfig } from "axios";
import axios from "axios";

import AxiosRequestInterceptorConfigCallback from "./AxiosRequestInterceptorConfigCallback";
import AxiosResponseInterceptorErrorCallback from "./AxiosResponseInterceptorErrorCallback";

export const AxiosBase = axios.create({
  timeout: 60000,
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

AxiosBase.interceptors.request.use(
  (config) => {
    return AxiosRequestInterceptorConfigCallback(config);
  },
  (error) => {
    return Promise.reject(error);
  },
);

AxiosBase.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    AxiosResponseInterceptorErrorCallback(error);
    return Promise.reject(error);
  },
);

export const AxiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return AxiosBase({ ...config, ...options }).then((response) => response.data);
};

export default AxiosInstance;
