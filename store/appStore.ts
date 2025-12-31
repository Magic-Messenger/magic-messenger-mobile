import * as SecureStore from "expo-secure-store";
import { AppState, AppStateStatus } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

interface AppStore {
  language?: string;
  appVersion: string;
  previousAppState: AppStateStatus;
  currentAppState: AppStateStatus;
  rehydrated: boolean;
  changeLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      language: "en",
      appVersion: "",
      previousAppState: AppState.currentState,
      currentAppState: AppState.currentState,
      rehydrated: false,
      changeLanguage: (language: string) => {
        set({
          language,
        });
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => SecureStoreStorage),
      partialize: (state) => ({
        language: state.language,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ rehydrated: true });
      },
    },
  ),
);
