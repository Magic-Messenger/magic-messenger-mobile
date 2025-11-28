import ExpoTor from "expo-tor";
import { t } from "i18next";
import { create } from "zustand";

import TorManager from "@/services/axios/tor/TorManager";
import { showToast, trackEvent } from "@/utils";

export interface TorState {
  enabled?: boolean;
  connected?: boolean;
  socksPort?: number;
  ready?: boolean;
  status: string;
}

type TorResponse = {
  message?: string;
  success: boolean;
};

type TorStore = {
  torState?: TorState;
  isLoading: boolean;

  setTorState: (state: TorState) => void;
  updateState: () => void;
  startTor: () => Promise<TorResponse>;
  stopTor: () => Promise<TorResponse>;
  toggleTor: (enabled?: boolean) => void;
  logStatus: () => void;
};

export const useTorStore = create<TorStore>((set, get) => ({
  torState: {
    ...TorManager.getConnectionStatus(),
    status: "OFF",
  },
  isLoading: false,

  setTorState: (state: TorState) => {
    set({
      torState: state,
    });
  },

  updateState: () => {
    const status = TorManager.getConnectionStatus();
    const torStatus = ExpoTor.getTorStatus();
    set({
      torState: {
        enabled: status.enabled,
        connected: status.connected,
        socksPort: status.socksPort,
        ready: status.ready,
        status: torStatus,
      },
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
