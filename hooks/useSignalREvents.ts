import { useEffect } from "react";

import { useSignalRStore } from "@/store/signalRStore";

export const useSignalREvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  useEffect(() => {
    if (!magicHubClient) return;
  }, [magicHubClient]);
};
