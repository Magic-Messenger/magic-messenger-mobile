import ExpoTor from "expo-tor";
import { useEffect, useState } from "react";

import TorManager from "./TorManager";

export interface TorState {
  enabled: boolean;
  connected: boolean;
  socksPort: number;
  ready: boolean;
  status: string;
}

/**
 * Tor durumunu yöneten React Hook
 */
export function useTor() {
  const [loading, setLoading] = useState(false);
  const [torState, setTorState] = useState<TorState>({
    enabled: TorManager.getEnabled(),
    connected: false,
    socksPort: -1,
    ready: false,
    status: "OFF",
  });
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // İlk durumu al
    updateState();

    // Durum değişikliklerini dinle
    const unsubscribe = TorManager.addListener(() => {
      updateState();
    });

    // Tor event'lerini dinle
    const statusListener = ExpoTor.addListener("onTorStatus", (event) => {
      setTorState((prev) => ({ ...prev, status: event.status }));
    });

    return () => {
      unsubscribe();
      statusListener.remove();
    };
  }, []);

  const updateState = () => {
    const status = TorManager.getConnectionStatus();
    const torStatus = ExpoTor.getTorStatus();
    setTorState({
      enabled: status.enabled,
      connected: status.connected,
      socksPort: status.socksPort,
      ready: status.ready,
      status: torStatus,
    });
  };

  /**
   * Tor'u başlat
   */
  const startTor = async () => {
    try {
      setLoading(true);
      setIsStarting(true);
      await ExpoTor.startTor();
      TorManager.setEnabled(true);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsStarting(false);
      setLoading(false);
    }
  };

  /**
   * Tor'u durdur
   */
  const stopTor = async () => {
    try {
      setLoading(true);
      await ExpoTor.stopTor();
      TorManager.setEnabled(false);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tor kullanımını aktifleştir/devre dışı bırak (servis durmuyor)
   */
  const toggleTor = (enabled: boolean) => {
    TorManager.setEnabled(enabled);
  };

  /**
   * Durum bilgisini logla
   */
  const logStatus = () => {
    TorManager.logStatus();
  };

  return {
    // State
    loading,
    torState,
    isStarting,

    // Actions
    startTor,
    stopTor,
    toggleTor,
    logStatus,

    // Helpers
    isReady: torState.ready,
    isConnected: torState.connected,
    isEnabled: torState.enabled,
  };
}

export default useTor;
