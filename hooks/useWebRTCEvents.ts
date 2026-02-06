import { useEffect } from "react";

import { useSignalRStore, useWebRTCStore } from "@/store";
import { trackEvent } from "@/utils";

export const useWebRTCEvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const isConnected = useSignalRStore((s) => s.isConnected);

  useEffect(() => {
    if (!magicHubClient || !isConnected) {
      return;
    }

    trackEvent("[WebRTC Events] Registering call event listeners");

    const onIncomingCall = (data: any) => {
      trackEvent("[WebRTC Events] incoming_call received", data);
      useWebRTCStore.getState().handleIncomingCall(data);
    };

    const onCallAnswered = (data: any) => {
      useWebRTCStore.getState().callAnswered(data);
    };

    const onIceCandidate = (data: any) => {
      useWebRTCStore.getState().iceCandidate(data);
    };

    const onCallEnded = (data: any) => {
      trackEvent("[WebRTC Events] call_ended received", data);
      useWebRTCStore.getState().callEnded(data);
    };

    const onCallRejected = (data: any) => {
      trackEvent("[WebRTC Events] call_rejected received", data);
      useWebRTCStore.getState().callRejected(data);
    };

    const onCameraToggle = (data: any) => {
      useWebRTCStore.getState().onCameraToggle(data);
    };

    const onMicrophoneToggle = (data: any) => {
      useWebRTCStore.getState().onMicrophoneToggle(data);
    };

    magicHubClient.on("incoming_call", onIncomingCall);
    magicHubClient.on("call_answered", onCallAnswered);
    magicHubClient.on("ice_candidate", onIceCandidate);
    magicHubClient.on("call_ended", onCallEnded);
    magicHubClient.on("call_rejected", onCallRejected);
    magicHubClient.on("camera_toggle", onCameraToggle);
    magicHubClient.on("microphone_toggle", onMicrophoneToggle);

    trackEvent("[WebRTC Events] All listeners registered successfully");

    return () => {
      trackEvent("[WebRTC Events] Unregistering call event listeners");
      magicHubClient.off("incoming_call");
      magicHubClient.off("call_answered");
      magicHubClient.off("ice_candidate");
      magicHubClient.off("call_ended");
      magicHubClient.off("call_rejected");
      magicHubClient.off("camera_toggle");
      magicHubClient.off("microphone_toggle");
    };
  }, [magicHubClient, isConnected]);
};
