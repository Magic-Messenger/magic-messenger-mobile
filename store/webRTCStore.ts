import { create } from "zustand";

import { CallingType } from "@/api/models";
import {
  CallAnsweredEvent,
  IceCandidateEvent,
  IncomingCallEvent,
} from "@/constants";
import { ConnectionStateType, MediaStream } from "@/services/webRTC";
import WebRTCService from "@/services/webRTC/webRTCService";
import { trackEvent } from "@/utils";

import { useSignalRStore, useUserStore } from "../store";

type StartCallingType = {
  targetUsername: string;
  callingType: CallingType;
};

type WebRTCStore = {
  connectionState: ConnectionStateType;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isIncoming?: boolean;
  callerUsername?: string;
  targetUsername?: string;
  isCaller?: boolean;

  setConnectionState: (connectionState: ConnectionStateType) => void;
  setLocalStream: (stream?: MediaStream) => void;
  setRemoteStream: (stream?: MediaStream) => void;
  setAudioEnabled: (isEnabled: boolean) => void;
  setVideoEnabled: (isEnabled: boolean) => void;
  setIsIncoming: (isIncoming: boolean) => void;
  setCallerUsername: (username: string) => void;
  setTargetUsername: (username: string) => void;

  startCall: ({
    targetUsername,
    callingType,
  }: StartCallingType) => Promise<void>;
  answerCall: (incomingCall: IncomingCallEvent) => Promise<void>;
  callAnswered: (callAnswered: CallAnsweredEvent) => Promise<void>;
  iceCandidate: (iceCandidate: IceCandidateEvent) => Promise<void>;
  endCall: () => void;
};

const initialState = {
  connectionState: "new" as ConnectionStateType,
  localStream: undefined,
  remoteStream: undefined,
  isAudioEnabled: false,
  isVideoEnabled: false,
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

  startCall: async ({ targetUsername, callingType }) => {
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

  endCall: () => {
    WebRTCService.closeConnection();
    set({
      ...get(),
      ...initialState,
    });
  },
}));
