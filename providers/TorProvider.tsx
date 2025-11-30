import { ReactNode, useEffect } from "react";

import TorManager from "@/services/axios/tor/TorManager";
import { useTorStore } from "@/store";

type TorProviderProps = { children: ReactNode };

export function TorProvider({ children }: TorProviderProps) {
  const updateState = useTorStore((state) => state.updateState);

  useEffect(() => {
    updateState();

    const unsubscribe = TorManager.addListener(() => {
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return children;
}
