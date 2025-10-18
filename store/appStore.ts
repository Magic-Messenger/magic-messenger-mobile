import * as SecureStore from "expo-secure-store";
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

interface SettingDto {
  language?: string;
  timeZone?: string;
}

interface AppStore {
  settings: SettingDto;
  appVersion: string;
  rehydrated: boolean;
  changeLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: {
        language: "en",
        timeZone: undefined,
      },
      appVersion: "",
      tor: null,
      rehydrated: false,
      changeLanguage: (language: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            language,
          },
        }));
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => SecureStoreStorage),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ rehydrated: true });
      },
    }
  )
);
