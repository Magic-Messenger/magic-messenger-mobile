import { useEffect } from "react";

import { useGroupWebRTCStore, useSignalRStore } from "@/store";
import { trackEvent } from "@/utils";

export const useGroupWebRTCEvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);
  const isConnected = useSignalRStore((s) => s.isConnected);

  useEffect(() => {
    if (!magicHubClient || !isConnected) {
      return;
    }

    trackEvent("[GroupWebRTC Events] Registering group call event listeners", {
      isConnected,
      hasClient: !!magicHubClient,
    });

    const onIncomingGroupCall = (data: any) => {
      trackEvent(
        "[GroupWebRTC Events] >>> incoming_group_call received <<<",
        data,
      );
      useGroupWebRTCStore.getState().handleIncomingGroupCall(data);
    };

    const onGroupCallAnswered = (data: any) => {
      trackEvent("[GroupWebRTC Events] group_call_answered received", data);
      useGroupWebRTCStore.getState().handleGroupCallAnswered(data);
    };

    const onGroupIceCandidate = (data: any) => {
      useGroupWebRTCStore.getState().handleGroupIceCandidate(data);
    };

    const onGroupCallEnded = (data: any) => {
      trackEvent("[GroupWebRTC Events] group_call_ended received", data);
      useGroupWebRTCStore.getState().handleGroupCallEnded(data);
    };

    const onGroupCallAllEnded = (data: any) => {
      trackEvent("[GroupWebRTC Events] group_call_all_ended received", data);
      useGroupWebRTCStore.getState().handleGroupCallAllEnded(data);
    };

    const onGroupCallRejected = (data: any) => {
      trackEvent("[GroupWebRTC Events] group_call_rejected received", data);
      useGroupWebRTCStore.getState().handleGroupCallRejected(data);
    };

    const onGroupCameraToggle = (data: any) => {
      useGroupWebRTCStore.getState().handleGroupCameraToggle(data);
    };

    const onGroupMicrophoneToggle = (data: any) => {
      useGroupWebRTCStore.getState().handleGroupMicrophoneToggle(data);
    };

    magicHubClient.on("incoming_group_call", onIncomingGroupCall);
    magicHubClient.on("group_call_answered", onGroupCallAnswered);
    magicHubClient.on("group_ice_candidate", onGroupIceCandidate);
    magicHubClient.on("group_call_ended", onGroupCallEnded);
    magicHubClient.on("group_call_all_ended", onGroupCallAllEnded);
    magicHubClient.on("group_call_rejected", onGroupCallRejected);
    magicHubClient.on("group_camera_toggle", onGroupCameraToggle);
    magicHubClient.on("group_microphone_toggle", onGroupMicrophoneToggle);

    trackEvent("[GroupWebRTC Events] All listeners registered successfully");

    return () => {
      trackEvent(
        "[GroupWebRTC Events] Unregistering group call event listeners",
      );
      magicHubClient.off("incoming_group_call");
      magicHubClient.off("group_call_answered");
      magicHubClient.off("group_ice_candidate");
      magicHubClient.off("group_call_ended");
      magicHubClient.off("group_call_all_ended");
      magicHubClient.off("group_call_rejected");
      magicHubClient.off("group_camera_toggle");
      magicHubClient.off("group_microphone_toggle");
    };
  }, [magicHubClient, isConnected]);
};
