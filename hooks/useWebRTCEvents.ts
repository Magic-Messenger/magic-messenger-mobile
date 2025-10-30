import { useEffect } from "react";

import {
  CallAnsweredEvent,
  IceCandidateEvent,
  IncomingCallEvent,
} from "@/constants";
import WebRTCService, {
  ConnectionStateType,
} from "@/services/webRTC/webRTCService";
import { useSignalRStore, useWebRTCStore } from "@/store";
import { trackEvent } from "@/utils";

export const useWebRTCEvents = () => {
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const setConnectionState = useWebRTCStore((s) => s.setConnectionState);
  const setLocalStream = useWebRTCStore((s) => s.setLocalStream);
  const setRemoteStream = useWebRTCStore((s) => s.setRemoteStream);

  const handleOnIncomingCall = async (data: IncomingCallEvent) => {
    const { callerUsername, offer } = data;

    try {
      trackEvent("Incoming call from: ", callerUsername);

      // 1. Fetch ICE servers first
      await WebRTCService.fetchIceServers();

      // 2. Get local stream
      const stream = await WebRTCService.getLocalStream();
      setLocalStream(stream);

      await WebRTCService.createPeerConnection(
        setRemoteStream,
        (candidate) => {
          magicHubClient?.sendIceCandidate({
            targetUsername: callerUsername,
            candidate: JSON.stringify(candidate),
          });
        },
        (state: ConnectionStateType) => setConnectionState(state),
      );

      await WebRTCService.setRemoteDescription(JSON.parse(offer));
      const answer = await WebRTCService.createAnswer();
      await magicHubClient?.answerCall({
        callerUsername,
        answer: JSON.stringify(answer),
      });

      trackEvent("Call answered");
    } catch (error) {
      trackEvent("Handle incoming call error: ", error);
    }
  };

  const handleOnCallAnswered = async (data: CallAnsweredEvent) => {
    const { answer } = data;
    await WebRTCService.setRemoteDescription(JSON.parse(answer));
  };

  const handleOnIceCandidate = async (data: IceCandidateEvent) => {
    const { candidate } = data;
    await WebRTCService.addIceCandidate(JSON.parse(candidate));
  };

  useEffect(() => {
    if (magicHubClient) {
      magicHubClient.on("incoming_call", handleOnIncomingCall);
      magicHubClient.on("call_answered", handleOnCallAnswered);
      magicHubClient.on("ice_candidate", handleOnIceCandidate);
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
