import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProtectRouteStore {
  isLoginProtected: boolean;
  setIsLoginProtected: (value: boolean) => void;
}

export const useProtectRouteStore = create<ProtectRouteStore>()(
  persist(
    (set) => ({
      isLoginProtected: false,
      setIsLoginProtected: (value: boolean) =>
        set(() => ({ isLoginProtected: value })),
    }),
    {
      name: "protect-route-storage",
    },
  ),
);
