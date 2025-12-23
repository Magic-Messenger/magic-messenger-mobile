import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { CallingType } from "@/api/models";

const SecureStoreStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error("SecureStore getItem error:", e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error("SecureStore setItem error:", e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error("SecureStore removeItem error:", e);
    }
  },
};

export type PendingCallData = {
  callId: string;
  callerUsername: string;
  callerNickname: string;
  callingType: CallingType;
  offer: string;
} | null;

interface CallingStore {
  rehydrated: boolean;
  pendingCall: PendingCallData;
  setPendingCall: (data: PendingCallData) => void;
  clearPendingCall: () => void;
}

export const useCallingStore = create<CallingStore>()(
  persist(
    (set) => ({
      rehydrated: false,
      pendingCall: null,
      setPendingCall: (data: PendingCallData) => {
        set({ pendingCall: data });
      },
      clearPendingCall: () => {
        set({ pendingCall: null });
      },
    }),
    {
      name: "calling-store",
      storage: createJSONStorage(() => SecureStoreStorage),
      partialize: (state) => ({
        pendingCall: state.pendingCall,
      }),
      onRehydrateStorage: () => () => {
        useCallingStore.setState({ rehydrated: true });
      },
    },
  ),
);
