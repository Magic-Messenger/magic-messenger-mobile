import { create } from "zustand";

import { ConnectionStateType, MediaStream } from "@/services/webRTC";

type WebRTCStore = {
  connectionState: ConnectionStateType;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;

  setConnectionState: (connectionState: ConnectionStateType) => void;
  setLocalStream: (stream?: MediaStream) => void;
  setRemoteStream: (stream?: MediaStream) => void;
  setAudioEnabled: (isEnabled: boolean) => void;
  setVideoEnabled: (isEnabled: boolean) => void;
};

export const useWebRTCStore = create<WebRTCStore>((set, get) => ({
  connectionState: "new",
  localStream: undefined,
  remoteStream: undefined,
  isAudioEnabled: false,
  isVideoEnabled: false,

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
}));
