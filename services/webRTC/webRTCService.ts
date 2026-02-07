import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";

import { getApiCallingGetIceServers } from "@/api/endpoints/magicMessenger";
import { IceServer } from "@/api/models";
import { trackEvent } from "@/utils";

/* -------------------- Types -------------------- */

type ConnectionStateType =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

type IceConnectionStateType =
  | "new"
  | "checking"
  | "connected"
  | "completed"
  | "failed"
  | "disconnected"
  | "closed";

type IceGatheringStateType = "new" | "gathering" | "complete";

type OnRemoteStreamCallback = (stream: MediaStream) => void;
type OnIceCandidateCallback = (candidate: RTCIceCandidate) => void;
type OnConnectionStateChangeCallback = (state: ConnectionStateType) => void;
type OnIceConnectionStateChangeCallback = (
  state: IceConnectionStateType,
) => void;
type OnIceGatheringStateChangeCallback = (state: IceGatheringStateType) => void;

type LocalMediaTrackConstraints = {
  isFrontCamera?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
};

/* -------------------- Service -------------------- */

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceServers: IceServer[] = [];

  private pendingIceCandidates: RTCIceCandidate[] = [];
  private hasRemoteDescription = false;

  /* -------------------- ICE Servers -------------------- */

  async fetchIceServers(): Promise<IceServer[]> {
    try {
      if (this.iceServers.length) return this.iceServers;

      const response = await getApiCallingGetIceServers();
      this.iceServers = response ?? [];

      trackEvent("ICE servers loaded", this.iceServers);
      return this.iceServers;
    } catch (error) {
      console.error("ICE server fetch failed", error);

      this.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

      return this.iceServers;
    }
  }

  /* -------------------- Local Media -------------------- */

  async getLocalStream({
    isFrontCamera = true,
    isAudioEnabled = true,
    isVideoEnabled = true,
  }: LocalMediaTrackConstraints): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    const constraints = {
      audio: isAudioEnabled,
      video: isVideoEnabled
        ? {
            mandatory: {
              minWidth: 640,
              minHeight: 480,
              minFrameRate: 30,
            },
            facingMode: isFrontCamera ? "user" : "environment",
            optional: [
              { maxWidth: 1280 },
              { maxHeight: 720 },
              { maxFrameRate: 30 },
            ],
          }
        : false,
    };

    try {
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      trackEvent("Local stream obtained successfully");
      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw new Error(`Failed to get local media: ${error}`);
    }
  }

  /* -------------------- Peer Connection -------------------- */

  async createPeerConnection(
    onRemoteStream: OnRemoteStreamCallback,
    onIceCandidate: OnIceCandidateCallback,
    onConnectionStateChange?: OnConnectionStateChangeCallback,
    onIceConnectionStateChange?: OnIceConnectionStateChangeCallback,
    onIceGatheringStateChange?: OnIceGatheringStateChangeCallback,
  ): Promise<RTCPeerConnection> {
    if (this.iceServers.length === 0) {
      console.error("ICE servers not loaded. Call fetchIceServers first.");
      throw new Error("ICE servers not loaded. Call fetchIceServers first.");
    }

    if (!this.localStream) {
      console.error("Local stream not available. Call getLocalStream first.");
      throw new Error("Local stream not available. Call getLocalStream first.");
    }

    const configuration: RTCConfiguration = {
      iceServers: this.iceServers.map((s) => ({
        urls: Array.isArray(s.urls) ? s.urls : [s.urls as never],
        ...(s.username ? { username: s.username } : {}),
        ...(s.credential ? { credential: s.credential } : {}),
      })),
      iceCandidatePoolSize: 10,
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    this.pendingIceCandidates = [];
    this.hasRemoteDescription = false;

    trackEvent("PeerConnection created");

    /* Local tracks */
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    /* Remote tracks */
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams?.[0]) {
        const stream = event.streams?.[0] as unknown as MediaStream;
        this.remoteStream = stream;
        onRemoteStream(stream);
        trackEvent("Remote stream received");
      }
    };

    /* ICE candidates */
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    /* Connection states */
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState as ConnectionStateType;

      onConnectionStateChange?.(state);
      trackEvent("Connection state", state);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      onIceConnectionStateChange?.(
        this.peerConnection!.iceConnectionState as IceConnectionStateType,
      );
    };

    this.peerConnection.onicegatheringstatechange = () => {
      onIceGatheringStateChange?.(
        this.peerConnection!.iceGatheringState as IceGatheringStateType,
      );
    };

    return this.peerConnection;
  }

  /* -------------------- SDP -------------------- */

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    trackEvent("Offer created");

    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    trackEvent("Answer created");
    return answer;
  }

  async setRemoteDescription(
    description: RTCSessionDescription,
  ): Promise<void> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description),
    );

    this.hasRemoteDescription = true;

    /* Flush pending ICE */
    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }

    this.pendingIceCandidates = [];
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    const ice = new RTCIceCandidate(candidate);

    if (!this.hasRemoteDescription) {
      this.pendingIceCandidates.push(ice);
      return;
    }

    await this.peerConnection.addIceCandidate(ice);
  }

  /* -------------------- Controls -------------------- */

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  async switchCamera(): Promise<void> {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (
      !videoTrack ||
      !videoTrack.enabled ||
      videoTrack.readyState === "ended"
    ) {
      trackEvent("[WebRTC] switchCamera skipped – no active video track");
      return;
    }
    try {
      await videoTrack._switchCamera?.();
    } catch (error) {
      trackEvent("[WebRTC] switchCamera error", { error });
    }
  }

  /* -------------------- Stats -------------------- */

  async getStats(): Promise<any> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized");
    }

    return this.peerConnection.getStats();
  }

  /* -------------------- State -------------------- */

  isAudioEnabled(): boolean {
    const audio = this.localStream?.getAudioTracks()[0];
    return !!audio && audio.enabled;
  }

  isVideoEnabled(): boolean {
    const video = this.localStream?.getVideoTracks()[0];
    return !!video && video.enabled;
  }

  getConnectionState(): ConnectionStateType | null {
    return (
      (this.peerConnection?.connectionState as ConnectionStateType) || null
    );
  }

  getIceConnectionState(): IceConnectionStateType | null {
    return (
      (this.peerConnection?.iceConnectionState as IceConnectionStateType) ||
      null
    );
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /* -------------------- Cleanup -------------------- */

  closeConnection(): void {
    trackEvent("Closing WebRTC connection");

    if (this.peerConnection) {
      this.peerConnection.ontrack = undefined;
      this.peerConnection.onicecandidate = undefined;
      this.peerConnection.onconnectionstatechange = undefined;
      this.peerConnection.oniceconnectionstatechange = undefined;
      this.peerConnection.onicegatheringstatechange = undefined;

      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;

    this.pendingIceCandidates = [];
    this.hasRemoteDescription = false;
  }
}

export default new WebRTCService();

export type {
  ConnectionStateType,
  IceConnectionStateType,
  IceGatheringStateType,
  IceServer,
  MediaStream,
  OnConnectionStateChangeCallback,
  OnIceCandidateCallback,
  OnIceConnectionStateChangeCallback,
  OnIceGatheringStateChangeCallback,
  OnRemoteStreamCallback,
};
