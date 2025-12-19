import { useEffect } from "react";

import { useSignalRStore, useWebRTCStore } from "@/store";

export const useWebRTCEvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const handleIncomingCall = useWebRTCStore((s) => s.handleIncomingCall);
  const callAnswered = useWebRTCStore((s) => s.callAnswered);
  const iceCandidate = useWebRTCStore((s) => s.iceCandidate);
  const callEnded = useWebRTCStore((s) => s.callEnded);
  const callDeclined = useWebRTCStore((s) => s.callDeclined);
  const onCameraToggled = useWebRTCStore((s) => s.onCameraToggled);

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.on("incoming_call", handleIncomingCall);
      magicHubClient.on("call_answered", callAnswered);
      magicHubClient.on("ice_candidate", iceCandidate);
      magicHubClient.on("call_ended", callEnded);
      magicHubClient.on("call_declined", callDeclined);
      magicHubClient.on("camera_toggled", onCameraToggled);
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("incoming_call");
        magicHubClient.off("call_answered");
        magicHubClient.off("ice_candidate");
        magicHubClient.off("call_ended");
        magicHubClient.off("call_declined");
        magicHubClient.off("camera_toggled");
      }
    };
  }, [magicHubClient]);
};
