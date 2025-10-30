import { ReactNode, useEffect } from "react";

import { useSignalREvents, useWebRTCEvents } from "@/hooks";
import { useSignalRStore, useUserStore } from "@/store";

type SignalRProviderProps = { children: ReactNode };

export function SignalRProvider({ children }: SignalRProviderProps) {
  const accessToken = useUserStore((state) => state.accessToken);

  const startConnection = useSignalRStore((state) => state.startConnection);

  useSignalREvents();
  useWebRTCEvents();

  useEffect(() => {
    if (accessToken) startConnection(accessToken).then().catch(console.error);
  }, [accessToken, startConnection]);

  return children;
}
