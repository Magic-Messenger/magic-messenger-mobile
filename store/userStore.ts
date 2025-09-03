import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AccountProfileDto } from "@/api/models";

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
        set({ isLogin: false, accessToken: null, userName: null });
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
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
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
