import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QrStore {
  qrCode: string | null;
  setQrCode: (code: string) => void;
}

export const useQrStore = create<QrStore>()(
  persist(
    (set) => ({
      qrCode: null,
      setQrCode: (code: string) => set(() => ({ qrCode: code })),
    }),
    {
      name: "qr-store",
    },
  ),
);
