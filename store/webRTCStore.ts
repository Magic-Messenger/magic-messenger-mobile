import { create } from "zustand";

import {
  postApiCallingAnswerCall,
  postApiCallingRejectCall,
} from "@/api/endpoints/magicMessenger";
import { CallingType } from "@/api/models";
import {
  CallAnsweredEvent,
  CameraToggledEvent,
  IceCandidateEvent,
  IncomingCallEvent,
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
  callEnded: () => void;
  callDeclined: () => void;
  onCameraToggled: (data: CameraToggledEvent) => void;
  endCall: (endCall?: IncomingCallEvent) => void;
};

const initialState = {
  connectionState: "new" as ConnectionStateType,
  localStream: undefined,
  remoteStream: undefined,
  isAudioEnabled: false,
  isVideoEnabled: false,
  isRemoteVideoEnabled: true,
  incomingCallData: null as IncomingCallData,
};

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
    const { targetUsername, callerUsername, isCaller } = get();
    // Determine the other party's username
    const otherParty = isCaller ? targetUsername : callerUsername;

    if (otherParty) {
      useSignalRStore.getState().magicHubClient?.toggleCamera({
        targetUsername: otherParty,
        isVideoEnabled: isEnabled,
      });
    }
    set({ isVideoEnabled: isEnabled });
  },

  setAudioEnabled: (isEnabled: boolean) => {
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
    trackEvent("Incoming call declined");
    const { incomingCallData } = get();
    if (incomingCallData) {
      useSignalRStore.getState().magicHubClient?.declineCall({
        targetUsername: incomingCallData.callerUsername,
      });
    }
    set({ incomingCallData: null, isIncoming: false });
  },

  startCall: async ({ targetUsername, callingType }) => {
    // 1. Fetch ICE servers first
    await WebRTCService.fetchIceServers();

    // Check if call was cancelled during ICE fetch
    if (get().targetUsername !== targetUsername) return;

    // 2. Get local stream
    const stream = await WebRTCService.getLocalStream({
      isVideoEnabled: callingType === CallingType.Video,
    });
    set({ localStream: stream });

    // Check if call was cancelled during usage of media devices
    if (get().targetUsername !== targetUsername) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

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
        trackEvent("Connection state:", state);
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
      trackEvent("📞 Incoming call from: ", callerUsername);

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
          trackEvent("Connection state:", state);
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

      trackEvent("Call answered");
    } catch (error) {
      trackEvent("Handle incoming call error: ", error);
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

  endCall: async (endCall?: IncomingCallEvent) => {
    const callerUsername =
      endCall?.callerUsername ?? useWebRTCStore.getState().callerUsername;
    WebRTCService.closeConnection();
    set({
      ...initialState,
      isIncoming: false,
      callerUsername: undefined,
      targetUsername: undefined,
      isCaller: false,
    });

    if (callerUsername) {
      try {
        await postApiCallingRejectCall({
          callerUsername,
        });
      } catch (error) {
        console.error("Failed to post reject call API:", error);
      }
    }
  },
  callEnded: () => {
    WebRTCService.closeConnection();
    set({
      ...initialState,
      isIncoming: false,
      callerUsername: undefined,
      targetUsername: undefined,
      isCaller: false,
    });
  },

  callDeclined: () => {
    WebRTCService.closeConnection();
    set({
      ...initialState,
      isIncoming: false,
      callerUsername: undefined,
      targetUsername: undefined,
      isCaller: false,
    });
  },

  onCameraToggled: (data: CameraToggledEvent) => {
    set({ isRemoteVideoEnabled: data.isVideoEnabled });
  },
}));
