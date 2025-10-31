import { useEffect } from "react";

import { useSignalRStore, useWebRTCStore } from "@/store";

export const useWebRTCEvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const answerCall = useWebRTCStore((s) => s.answerCall);
  const callAnswered = useWebRTCStore((s) => s.callAnswered);
  const iceCandidate = useWebRTCStore((s) => s.iceCandidate);

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.on("incoming_call", answerCall);
      magicHubClient.on("call_answered", callAnswered);
      magicHubClient.on("ice_candidate", iceCandidate);
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("incoming_call");
        magicHubClient.off("call_answered");
        magicHubClient.off("ice_candidate");
      }
    };
  }, [magicHubClient]);
};
