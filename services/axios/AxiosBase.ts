import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

import AxiosRequestInterceptorConfigCallback from "./AxiosRequestInterceptorConfigCallback";
import AxiosResponseInterceptorErrorCallback from "./AxiosResponseInterceptorErrorCallback";
import { TorHttpClient, TorManager } from "./tor";

export const AxiosBase = axios.create({
  timeout: 10 * 60 * 1000, // 10 minutes × 60 seconds × 1000 ms = 600.000 ms
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

/**
 * Akıllı HTTP Client - Tor aktifse Tor üzerinden, değilse normal Axios kullanır
 */
export const AxiosInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const mergedConfig = { ...config, ...options };

  // Tor hazır mı kontrol et
  if (TorManager.isReady()) {
    try {
      console.log(
        "🔵 [AXIOS] Tor üzerinden istek yapılıyor:",
        mergedConfig.url,
      );

      // Headers yoksa oluştur
      if (!mergedConfig.headers) {
        mergedConfig.headers = {};
      }

      // Auth token ve diğer header'ları ekle
      const configWithAuth = AxiosRequestInterceptorConfigCallback(
        mergedConfig as any,
      );

      // Tor üzerinden istek yap
      const torResponse = await TorHttpClient.request({
        url: mergedConfig.url || "",
        method: mergedConfig.method?.toUpperCase() as any,
        headers: configWithAuth.headers as Record<string, string>,
        data: mergedConfig.data,
        params: mergedConfig.params,
        baseURL: mergedConfig.baseURL || process.env.EXPO_PUBLIC_API_URL,
      });

      if (torResponse.status >= 400) {
        AxiosResponseInterceptorErrorCallback({
          response: torResponse,
        } as unknown as AxiosError);
        Promise.reject({ response: torResponse } as unknown as AxiosError);
      }

      // Response'u axios formatına çevir (interceptor'lar için)
      const axiosFormattedResponse: AxiosResponse = {
        data: torResponse.data,
        status: torResponse.status,
        statusText: torResponse.statusText,
        headers: torResponse.headers,
        config: mergedConfig as any,
      } as AxiosResponse;

      // Response interceptor'ları çağır (şimdilik sadece başarılı response)
      // Error handling zaten catch bloğunda
      if (
        axiosFormattedResponse.status >= 200 &&
        axiosFormattedResponse.status < 300
      )
        console.log("✅ [AXIOS] Tor isteği başarılı:", mergedConfig.url);

      // Sadece data'yı döndür (axios instance davranışı)
      return torResponse.data as T;
    } catch (error: any) {
      console.warn(
        "⚠️ [AXIOS] Tor isteği başarısız, normal Axios'a geçiliyor:",
        error.message,
      );

      // Error interceptor'ı çağır
      AxiosResponseInterceptorErrorCallback(error as AxiosError);

      // Tor başarısız olursa aşağıdaki normal axios'a düşecek
    }
  }

  // Normal Axios kullan (Tor kapalı veya başarısız)
  return AxiosBase({ ...mergedConfig }).then((response) => response.data);
};

export default AxiosInstance;
