import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserStore {
  rehydrated: boolean;
  isLogin: boolean;
  login: () => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      rehydrated: false,
      isLogin: false,
      login: () => {
        set({ isLogin: true });
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
