import ExpoTor from "expo-tor";
import { t } from "i18next";
import { create } from "zustand";

import TorManager from "@/services/axios/tor/TorManager";
import { showToast, trackEvent } from "@/utils";

type TorResponse = {
  message?: string;
  success: boolean;
};

type TorStore = {
  socksPort?: number;
  isLoading: boolean;
  isConnected: boolean;

  updateState: () => void;
  startTor: () => Promise<TorResponse>;
  stopTor: () => Promise<TorResponse>;
  toggleTor: (enabled?: boolean) => void;
  logStatus: () => void;
};

export const useTorStore = create<TorStore>((set, get) => ({
  isConnected: false,
  isLoading: false,

  updateState: () => {
    const status = TorManager.getConnectionStatus();
    set({
      socksPort: status.socksPort,
    });
  },

  startTor: async () => {
    try {
      set({
        isLoading: true,
      });
      TorManager.setEnabled(true);
      await ExpoTor.startTor();

      trackEvent("tor_started");
      showToast({
        type: "success",
        text1: t("common.torIsStarted"),
      });

      set({
        isConnected: true,
      });

      return { success: true };
    } catch (error: any) {
      showToast({
        type: "error",
        text1: t("common.torIsNotStarted"),
      });

      return { success: false, message: error.message };
    } finally {
      setTimeout(() => {
        set({
          isLoading: false,
        });
      }, 150);
    }
  },

  stopTor: async () => {
    try {
      set({
        isLoading: true,
      });
      TorManager.setEnabled(false);
      await ExpoTor.stopTor();

      trackEvent("tor_stopped");

      set({
        isConnected: false,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => {
        set({
          isLoading: false,
        });
      }, 150);
    }
  },

  toggleTor: (enabled?: boolean) => {
    TorManager.setEnabled(enabled ?? false);
  },

  logStatus: () => {
    TorManager.logStatus();
  },
}));
