import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserStore {
  rehydrated: boolean;
  isLogin: boolean;
  userName: string | null;
  accessToken: string | null;
  login: (accessToken: string | null, userName: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      rehydrated: false,
      isLogin: false,
      userName: null,
      accessToken: null,
      login: (accessToken, userName) => {
        set({ isLogin: true, accessToken, userName });
      },
      logout: () => {
        set({ isLogin: false, accessToken: null, userName: null });
      },
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userName: state.userName,
      }),
      onRehydrateStorage: () => () => {
        useUserStore.setState({ rehydrated: true });
      },
    }
  )
);
