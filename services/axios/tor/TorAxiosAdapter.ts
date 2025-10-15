import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { AxiosBase } from "../AxiosBase";
import TorHttpClient from "./TorHttpClient";
import TorManager from "./TorManager";

/**
 * Axios benzeri interface ile Tor desteği
 * Tor bağlıysa Tor üzerinden, değilse normal Axios kullanır
 */
class TorAxiosAdapter {
  /**
   * HTTP isteği yap - Tor varsa Tor üzerinden, yoksa normal Axios
   */
  async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const torStatus = TorManager.getConnectionStatus();

    // Tor aktif VE bağlı mı?
    if (torStatus.ready) {
      console.log("🔵 [ADAPTER] Tor üzerinden istek yapılıyor");

      try {
        // Tor üzerinden istek yap
        const torResponse = await TorHttpClient.request({
          url: config.url || "",
          method: config.method?.toUpperCase() as any,
          headers: config.headers as Record<string, string>,
          data: config.data,
          params: config.params,
          baseURL: config.baseURL,
        });

        // Axios formatına dönüştür
        const axiosResponse: AxiosResponse<T> = {
          data: torResponse.data,
          status: torResponse.status,
          statusText: torResponse.statusText,
          headers: torResponse.headers,
          config: config,
        } as AxiosResponse<T>;

        return axiosResponse;
      } catch (error: any) {
        console.warn(
          "⚠️ [ADAPTER] Tor isteği başarısız, normal Axios'a geçiliyor:",
          error.message,
        );
        // Tor başarısız olursa normal axios'a düş
      }
    } else if (torStatus.enabled) {
      console.log(
        "⏳ [ADAPTER] Tor etkin ama henüz bağlı değil, normal Axios kullanılıyor",
      );
    }

    // Normal Axios kullan
    console.log("🔵 [ADAPTER] Normal Axios üzerinden istek yapılıyor");
    return AxiosBase.request<T>(config);
  }

  /**
   * GET isteği
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  /**
   * POST isteği
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: "POST", data });
  }

  /**
   * PUT isteği
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: "PUT", data });
  }

  /**
   * DELETE isteği
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: "DELETE" });
  }

  /**
   * PATCH isteği
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: "PATCH", data });
  }
}

export default new TorAxiosAdapter();
