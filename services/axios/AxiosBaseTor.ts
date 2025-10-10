import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import AxiosRequestInterceptorConfigCallback from "./AxiosRequestInterceptorConfigCallback";
import AxiosResponseInterceptorErrorCallback from "./AxiosResponseInterceptorErrorCallback";
import { TorAxiosAdapter, TorManager } from "./tor";

/**
 * Tor destekli Axios wrapper
 * Tor bağlıysa otomatik olarak Tor üzerinden istek yapar
 */
class AxiosBaseTor {
  /**
   * HTTP isteği yap
   */
  async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    // Request interceptor'ı çalıştır (auth token ekleme vs.)
    const modifiedConfig = AxiosRequestInterceptorConfigCallback(config as any);

    try {
      // Tor Adapter üzerinden istek yap (içinde Tor kontrolü var)
      const response = await TorAxiosAdapter.request<T>(modifiedConfig);
      return response;
    } catch (error: any) {
      // Response error callback
      AxiosResponseInterceptorErrorCallback(error as AxiosError);
      throw error;
    }
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

  /**
   * Tor durumunu al
   */
  getTorStatus() {
    return TorManager.getConnectionStatus();
  }

  /**
   * Tor kullanımını aktifleştir/devre dışı bırak
   */
  setTorEnabled(enabled: boolean) {
    TorManager.setEnabled(enabled);
  }
}

export const AxiosBaseTorInstance = new AxiosBaseTor();

/**
 * Axios instance fonksiyonu (data döndüren)
 */
export const AxiosInstanceTor = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await AxiosBaseTorInstance.request<T>({
    ...config,
    ...options,
  });
  return response.data;
};

export default AxiosInstanceTor;
