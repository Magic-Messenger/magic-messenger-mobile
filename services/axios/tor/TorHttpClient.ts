import type { TorRequestOptions, TorRequestResponse } from "expo-tor";
import ExpoTor from "expo-tor";

import TorManager from "./TorManager";

export interface TorHttpRequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string | number>;
  timeout?: number;
  baseURL?: string;
}

export interface TorHttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: TorHttpRequestConfig;
}

/**
 * Tor üzerinden HTTP istekleri yapan client
 */
class TorHttpClient {
  /**
   * HTTP isteği yap
   */
  async request<T = any>(
    config: TorHttpRequestConfig,
  ): Promise<TorHttpResponse<T>> {
    // Tor hazır değilse hata fırlat
    if (!TorManager.isReady()) {
      const status = TorManager.getConnectionStatus();
      throw new Error(
        `Tor is not ready. Status: enabled=${status.enabled}, connected=${status.connected}`,
      );
    }

    try {
      // URL'i oluştur
      let fullUrl = config.url;
      if (config.baseURL && !config.url.startsWith("http")) {
        fullUrl = `${config.baseURL.replace(/\/$/, "")}/${config.url.replace(/^\//, "")}`;
      }

      // Query parametrelerini ekle
      if (config.params) {
        const queryString = Object.entries(config.params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("&");
        fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString;
      }

      // Request options
      const options: TorRequestOptions = {
        method: config.method || "GET",
        headers: config.headers || {},
      };

      // Body ekle (POST, PUT, PATCH için)
      if (config.data && ["POST", "PUT", "PATCH"].includes(options.method!)) {
        if (typeof config.data === "object") {
          options.body = JSON.stringify(config.data);
          if (!options.headers!["Content-Type"]) {
            options.headers!["Content-Type"] = "application/json";
          }
        } else {
          options.body = String(config.data);
        }
      }

      console.log(`🌐 [TOR] ${options.method} ${fullUrl}`);

      // Tor üzerinden istek yap
      const response: TorRequestResponse = await ExpoTor.makeRequest(
        fullUrl,
        options,
      );

      // Response'u parse et
      let parsedData: T;
      try {
        parsedData = JSON.parse(response.data) as T;
      } catch {
        parsedData = response.data as T;
      }

      const result: TorHttpResponse<T> = {
        data: parsedData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      };

      console.log(`✅ [TOR] ${response.status} ${fullUrl}`, result);

      return result;
    } catch (error: any) {
      console.error(`❌ [TOR] Request failed:`, error.message);
      throw error;
    }
  }

  /**
   * GET isteği
   */
  async get<T = any>(
    url: string,
    config?: Omit<TorHttpRequestConfig, "url" | "method" | "data">,
  ): Promise<TorHttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  /**
   * POST isteği
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: Omit<TorHttpRequestConfig, "url" | "method" | "data">,
  ): Promise<TorHttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "POST", data });
  }

  /**
   * PUT isteği
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: Omit<TorHttpRequestConfig, "url" | "method" | "data">,
  ): Promise<TorHttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "PUT", data });
  }

  /**
   * DELETE isteği
   */
  async delete<T = any>(
    url: string,
    config?: Omit<TorHttpRequestConfig, "url" | "method" | "data">,
  ): Promise<TorHttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "DELETE" });
  }

  /**
   * PATCH isteği
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: Omit<TorHttpRequestConfig, "url" | "method" | "data">,
  ): Promise<TorHttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "PATCH", data });
  }
}

export default new TorHttpClient();
