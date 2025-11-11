import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AccountProfileDto } from "@/api/models";

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

interface UserStore {
  rehydrated: boolean;
  isLogin: boolean;
  userName: string | null;
  accessToken: string | null;
  credentials: {
    publicKey: string | null;
    privateKey: string | null;
  };
  profile?: AccountProfileDto;
  setProfile: (profile: AccountProfileDto) => void;
  login: (accessToken: string | null, userName: string | null) => void;
  logout: () => void;
  setUserKey: (publicKey: string | null, privateKey: string | null) => void;
  setUsername: (userName?: string | null) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      rehydrated: false,
      isLogin: false,
      userName: null,
      accessToken: null,
      profile: undefined,
      credentials: {
        publicKey: null,
        privateKey: null,
      },
      login: (accessToken, userName) => {
        set({ isLogin: true, accessToken, userName });
      },
      logout: () => {
        set({ isLogin: false, accessToken: null });
        router.replace("/(auth)/login/screens/login");
      },
      setProfile: (profile: AccountProfileDto) => {
        set({ profile });
      },
      setUserKey: (publicKey, privateKey) => {
        set((state) => ({
          credentials: {
            ...state.credentials,
            publicKey,
            privateKey,
          },
        }));
      },
      setUsername: (userName?: string | null) => {
        set({ userName });
      },
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => SecureStoreStorage),
      partialize: (state) => ({
        userName: state.userName,
        credentials: state.credentials,
      }),
      onRehydrateStorage: () => () => {
        useUserStore.setState({ rehydrated: true });
      },
    },
  ),
);
