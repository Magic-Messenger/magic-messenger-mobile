import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserStore {
  rehydrated: boolean;
  isLogin: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (refreshToken: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      rehydrated: false,
      isLogin: false,
      accessToken: null,
      refreshToken: null,
      login: (accessToken) => {
        set({ isLogin: true, accessToken });
      },
      logout: () => {
        set({ isLogin: false });
      },
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useUserStore.setState({ rehydrated: true });
      },
    }
  )
);
