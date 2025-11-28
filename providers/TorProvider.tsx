import ExpoTor from "expo-tor";
import { ReactNode, useEffect } from "react";

import TorManager from "@/services/axios/tor/TorManager";
import { useTorStore } from "@/store";

type TorProviderProps = { children: ReactNode };

export function TorProvider({ children }: TorProviderProps) {
  const updateState = useTorStore((state) => state.updateState);
  const torState = useTorStore((state) => state.torState);
  const setTorState = useTorStore((state) => state.setTorState);

  useEffect(() => {
    updateState();

    const unsubscribe = TorManager.addListener(() => {
      updateState();
    });

    const statusListener = ExpoTor.addListener("onTorStatus", (event) => {
      setTorState({ ...torState, status: event.status });
    });

    return () => {
      unsubscribe();
      statusListener.remove();
    };
  }, []);

  return children;
}
