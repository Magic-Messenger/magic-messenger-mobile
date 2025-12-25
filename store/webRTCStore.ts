import { startTransition } from "react";
import { create } from "zustand";

import { getApiCallingGetWaitingCalling } from "@/api/endpoints/magicMessenger";
import { CallingType } from "@/api/models";
import {
  CallAnsweredEvent,
  CallEndedEvent,
  CallRejectedEvent,
  CameraToggleEvent,
  EndCallCommandRequest,
  IceCandidateEvent,
  IncomingCallEvent,
  MicrophoneToggleEvent,
} from "@/constants";
import { ConnectionStateType, MediaStream } from "@/services/webRTC";
import WebRTCService from "@/services/webRTC/webRTCService";
import { trackEvent } from "@/utils";

import { useSignalRStore, useUserStore } from "../store";

export type StartCallingType = {
  targetUsername: string;
  callingType: CallingType;
};

export type IncomingCallData = {
  callId: string;
  callerNickname: string;
  callerUsername: string;
  callingType: CallingType;
  offer: string;
} | null;

type WebRTCStore = {
  connectionState: ConnectionStateType;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  isRemoteAudioEnabled: boolean;
  isIncoming?: boolean;
  callId?: string;
  callerUsername?: string;
  targetUsername?: string;
  isCaller?: boolean;
  incomingCallData?: IncomingCallData;

  setConnectionState: (connectionState: ConnectionStateType) => void;
  setLocalStream: (stream?: MediaStream) => void;
  setRemoteStream: (stream?: MediaStream) => void;
  setAudioEnabled: (isEnabled: boolean) => void;
  setVideoEnabled: (isEnabled: boolean) => void;
  setIsIncoming: (isIncoming: boolean) => void;
  setCallId: (callId: string) => void;
  setCallerUsername: (username: string) => void;
  setTargetUsername: (username: string) => void;
  setIncomingCallData: (data: IncomingCallData) => void;

  startCall: ({
    targetUsername,
    callingType,
  }: StartCallingType) => Promise<void>;
  handleIncomingCall: (incomingCall: IncomingCallEvent) => void;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  answerCall: (incomingCall: IncomingCallEvent) => Promise<void>;
  callAnswered: (callAnswered: CallAnsweredEvent) => Promise<void>;
  iceCandidate: (iceCandidate: IceCandidateEvent) => Promise<void>;
  callEnded: (data: CallEndedEvent) => void;
  callRejected: (data: CallRejectedEvent) => void;
  onCameraToggle: (data: CameraToggleEvent) => void;
  onMicrophoneToggle: (data: MicrophoneToggleEvent) => void;
  endCall: (data?: EndCallCommandRequest) => void;
  checkWaitingCalling: () => void | Promise<void>;
};

const initialState = {
  connectionState: "new" as ConnectionStateType,
  isAudioEnabled: false,
  isVideoEnabled: false,
  isRemoteVideoEnabled: true,
  isRemoteAudioEnabled: true,
};

// Helper function to get the other party's username
const getOtherPartyUsername = (state: WebRTCStore): string | undefined => {
  const { targetUsername, callerUsername, isCaller } = state;
  return isCaller ? targetUsername : callerUsername;
};

// Helper function to reset state to initial
const resetState = () => ({
  ...initialState,
  connectionState: "new" as ConnectionStateType,
  isIncoming: false,
  callerUsername: undefined,
  targetUsername: undefined,
  isCaller: false,
});

export const useWebRTCStore = create<WebRTCStore>((set, get) => ({
  ...initialState,

  setConnectionState: (connectionState: ConnectionStateType) => {
    set({ connectionState });
  },

  setLocalStream: (stream?: MediaStream) => {
    set({ localStream: stream });
  },

  setRemoteStream: (stream?: MediaStream) => {
    set({ remoteStream: stream });
  },

  setVideoEnabled: (isEnabled: boolean) => {
    const otherParty = getOtherPartyUsername(get());

    if (otherParty) {
      trackEvent("Camera toggled", { isEnabled, targetUsername: otherParty });
      useSignalRStore.getState().magicHubClient?.toggleCamera({
        targetUsername: otherParty,
        isEnabled,
      });
    }
    set({ isVideoEnabled: isEnabled });
  },

  setAudioEnabled: (isEnabled: boolean) => {
    const otherParty = getOtherPartyUsername(get());

    if (otherParty) {
      trackEvent("Microphone toggled", {
        isEnabled,
        targetUsername: otherParty,
      });
      useSignalRStore.getState().magicHubClient?.toggleMicrophone({
        targetUsername: otherParty,
        isEnabled,
      });
    }
    set({ isAudioEnabled: isEnabled });
  },

  setIsIncoming: (isIncoming: boolean) => {
    set({ isIncoming });
  },

  setCallerUsername: (username: string) => {
    set({
      callerUsername: username,
      isCaller: username === useUserStore.getState().userName,
    });
  },

  setCallId: (callId: string) => {
    set({ callId: callId });
  },

  setTargetUsername: (username: string) => {
    set({ targetUsername: username });
  },

  setIncomingCallData: (data: IncomingCallData) => {
    set({ incomingCallData: data });
  },

  handleIncomingCall: (incomingCall: IncomingCallEvent) => {
    const currentUsername = useUserStore.getState().userName;
    if (incomingCall.callerUsername === currentUsername) return;

    trackEvent("Incoming call received:", incomingCall);
    set({
      incomingCallData: {
        ...incomingCall,
      },
      isIncoming: true,
    });
  },

  acceptIncomingCall: async () => {
    const { incomingCallData, answerCall } = get();
    if (!incomingCallData) return;

    await answerCall(incomingCallData);
    set({ incomingCallData: null });
  },

  declineIncomingCall: () => {
    const { incomingCallData } = get();
    trackEvent("Incoming call declined", incomingCallData);

    if (incomingCallData) {
      useSignalRStore.getState().magicHubClient?.rejectCall({
        callerUsername: incomingCallData.callerUsername,
        callId: incomingCallData.callId,
      });
    }
    set({ incomingCallData: null, isIncoming: false });
  },

  startCall: async ({ targetUsername, callingType }) => {
    // Set caller information first
    const currentUsername = useUserStore.getState().userName;
    set({
      targetUsername,
      callerUsername: currentUsername!,
      isCaller: true,
      isIncoming: false,
    });

    trackEvent("Call is starting", {
      callerUsername: currentUsername!,
      targetUsername,
      callingType,
    });

    // 1. Fetch ICE servers first
    await WebRTCService.fetchIceServers();

    // 2. Get local stream
    const stream = await WebRTCService.getLocalStream({
      isVideoEnabled: callingType === CallingType.Video,
    });
    set({ localStream: stream });

    // 3. Create peer connection
    await WebRTCService.createPeerConnection(
      (remoteStream) => set({ remoteStream }),
      (candidate) => {
        useSignalRStore.getState().magicHubClient?.sendIceCandidate({
          targetUsername,
          candidate: JSON.stringify(candidate),
        });
      },
      (state) => {
        trackEvent("Connection state changed", { state, targetUsername });
        set({ connectionState: state });
      },
    );

    const offer = await WebRTCService.createOffer();

    const callUserData = {
      targetUsername,
      callingType,
      offer: JSON.stringify(offer),
    };

    trackEvent("Call user data", callUserData);

    const callId = await useSignalRStore
      .getState()
      .magicHubClient?.callUser?.(callUserData);
    callId && get().setCallId(callId);

    trackEvent("Call started on socket", { callId });
  },

  answerCall: async (incomingCall: IncomingCallEvent) => {
    const { callerUsername, callingType, offer, callId } = incomingCall;

    try {
      trackEvent("Answering call", { callerUsername, callingType });

      // Set answerer information first
      set({
        callerUsername,
        targetUsername: callerUsername, // For answerer, target is the caller
        isCaller: false,
        isIncoming: true,
      });

      // 1. Fetch ICE servers first
      await WebRTCService.fetchIceServers();

      // 2. Get local stream
      const stream = await WebRTCService.getLocalStream({
        isVideoEnabled: callingType === CallingType.Video,
      });
      set({ localStream: stream });

      await WebRTCService.createPeerConnection(
        (remoteStream) => set({ remoteStream }),
        (candidate) => {
          useSignalRStore.getState().magicHubClient?.sendIceCandidate({
            targetUsername: callerUsername,
            candidate: JSON.stringify(candidate),
          });
        },
        (state) => {
          trackEvent("Connection state changed", { state, callerUsername });
          set({ connectionState: state });
        },
      );

      await WebRTCService.setRemoteDescription(JSON.parse(offer));
      const answer = await WebRTCService.createAnswer();
      await useSignalRStore.getState().magicHubClient?.answerCall({
        callerUsername,
        answer: JSON.stringify(answer),
        answerType: callingType,
        callId,
      });

      trackEvent("Call answered successfully", { callerUsername });
    } catch (error) {
      trackEvent("Answer call error", { callerUsername, error });
    }
  },

  callAnswered: async (data: CallAnsweredEvent) => {
    const { answer } = data;
    await WebRTCService.setRemoteDescription(JSON.parse(answer));
  },

  iceCandidate: async (data: IceCandidateEvent) => {
    const { candidate } = data;
    await WebRTCService.addIceCandidate(JSON.parse(candidate));
  },

  endCall: (data?: EndCallCommandRequest) => {
    const { incomingCallData, callId } = get();
    const otherParty = getOtherPartyUsername(get());

    trackEvent("Ending call", { targetUsername: otherParty });

    useSignalRStore.getState().magicHubClient?.endCall({
      targetUsername: (data?.targetUsername ?? otherParty) as string,
      callId: (data?.callId ?? incomingCallData?.callId ?? callId) as string,
    });

    WebRTCService.closeConnection();
    set(resetState());
  },

  callEnded: (data: CallEndedEvent) => {
    trackEvent("Call ended", { endedBy: data.endedUsername });
    WebRTCService.closeConnection();
    set({
      ...resetState(),
      connectionState: "closed",
    });
  },

  callRejected: (data: CallRejectedEvent) => {
    trackEvent("Call rejected", {
      rejectedBy: data.rejectedUsername,
      previousState: get().connectionState,
    });
    WebRTCService.closeConnection();
    set({
      ...resetState(),
      connectionState: "closed",
    });
  },

  checkWaitingCalling: () => {
    getApiCallingGetWaitingCalling()
      .then((waitingCalling) => {
        if (waitingCalling?.success && waitingCalling?.data) {
          trackEvent("Waiting call found", waitingCalling?.data);
          startTransition(() => {
            get().setIncomingCallData({
              ...waitingCalling?.data,
              callId: waitingCalling?.data?.callingId as string,
              callerNickname: waitingCalling?.data?.caller as string,
              callerUsername: waitingCalling?.data?.caller as string,
              callingType: waitingCalling?.data?.callingType as never,
              offer: waitingCalling?.data?.offer as string,
            });
          });
          startTransition(() => {
            setTimeout(() => {
              get().setIsIncoming(true);
            }, 500);
          });
        }
      })
      .catch();
  },

  onCameraToggle: (data: CameraToggleEvent) => {
    const currentUsername = useUserStore.getState().userName;

    // Ignore if this is our own toggle event (echoed back from server)
    if (data.toggledUsername === currentUsername) {
      trackEvent("Ignoring own camera toggle event", {
        username: data.toggledUsername,
      });
      return;
    }

    trackEvent("Remote camera toggled", {
      username: data.toggledUsername,
      isEnabled: data.isEnabled,
    });
    set({ isRemoteVideoEnabled: data.isEnabled });
  },

  onMicrophoneToggle: (data: MicrophoneToggleEvent) => {
    const currentUsername = useUserStore.getState().userName;

    // Ignore if this is our own toggle event (echoed back from server)
    if (data.toggledUsername === currentUsername) {
      trackEvent("Ignoring own microphone toggle event", {
        username: data.toggledUsername,
      });
      return;
    }

    trackEvent("Remote microphone toggled", {
      username: data.toggledUsername,
      isEnabled: data.isEnabled,
    });
    set({ isRemoteAudioEnabled: data.isEnabled });
  },
}));
