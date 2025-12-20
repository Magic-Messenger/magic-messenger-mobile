import { create } from "zustand";

import { postApiCallingAnswerCall } from "@/api/endpoints/magicMessenger";
import { CallingType } from "@/api/models";
import {
  CallAnsweredEvent,
  CallEndedEvent,
  CallRejectedEvent,
  CameraToggleEvent,
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
  callerUsername?: string;
  targetUsername?: string;
  isCaller?: boolean;
  incomingCallData: IncomingCallData;

  setConnectionState: (connectionState: ConnectionStateType) => void;
  setLocalStream: (stream?: MediaStream) => void;
  setRemoteStream: (stream?: MediaStream) => void;
  setAudioEnabled: (isEnabled: boolean) => void;
  setVideoEnabled: (isEnabled: boolean) => void;
  setIsIncoming: (isIncoming: boolean) => void;
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
  endCall: () => void;
};

const initialState = {
  connectionState: "new" as ConnectionStateType,
  localStream: undefined,
  remoteStream: undefined,
  isAudioEnabled: false,
  isVideoEnabled: false,
  isRemoteVideoEnabled: true,
  isRemoteAudioEnabled: true,
  incomingCallData: null as IncomingCallData,
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
        callerUsername: incomingCall.callerUsername,
        callingType: incomingCall.callingType,
        offer: incomingCall.offer,
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
    trackEvent("Incoming call declined", {
      callerUsername: incomingCallData?.callerUsername,
      callingType: incomingCallData?.callingType,
    });

    if (incomingCallData) {
      useSignalRStore.getState().magicHubClient?.rejectCall({
        callerUsername: incomingCallData.callerUsername,
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

    trackEvent("Call started", { targetUsername, callingType });

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
    useSignalRStore.getState().magicHubClient?.callUser({
      targetUsername,
      callingType,
      offer: JSON.stringify(offer),
    });
  },

  answerCall: async (incomingCall: IncomingCallEvent) => {
    const { callerUsername, callingType, offer } = incomingCall;

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
      });
      await postApiCallingAnswerCall({
        callerUsername,
        answer: JSON.stringify(answer),
        answerType: callingType,
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

  endCall: () => {
    const otherParty = getOtherPartyUsername(get());

    if (otherParty) {
      trackEvent("Ending call", { targetUsername: otherParty });
      useSignalRStore.getState().magicHubClient?.endCall({
        targetUsername: otherParty,
      });
    }

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
