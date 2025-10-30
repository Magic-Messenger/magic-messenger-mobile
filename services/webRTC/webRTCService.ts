import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";

import { getApiCallingGetIceServers } from "@/api/endpoints/magicMessenger";
import { IceServer } from "@/api/models";

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
type OnIceCandidateCallback = (candidate: any) => void;
type OnConnectionStateChangeCallback = (state: ConnectionStateType) => void;
type OnIceConnectionStateChangeCallback = (
  state: IceConnectionStateType,
) => void;
type OnIceGatheringStateChangeCallback = (state: IceGatheringStateType) => void;

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceServers: IceServer[] = [];

  async fetchIceServers(): Promise<IceServer[]> {
    try {
      if (this.iceServers.length > 0) return this.iceServers;

      const response = await getApiCallingGetIceServers();
      this.iceServers = response ?? [];
      console.log("ICE Servers loaded:", this.iceServers);
      return this.iceServers;
    } catch (error) {
      console.error("Error fetching ICE servers:", error);
      this.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];
      console.warn("Using fallback STUN server");
      return this.iceServers;
    }
  }

  async getLocalStream(isFrontCamera: boolean = true): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 640,
          minHeight: 480,
          minFrameRate: 30,
        },
        facingMode: isFrontCamera ? "user" : "environment",
      },
    };

    try {
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      console.log("Local stream obtained successfully");
      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw new Error(`Failed to get local media: ${error}`);
    }
  }

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

    const formattedIceServers = this.iceServers.map((server) => ({
      urls: Array.isArray(server.urls) ? server.urls : [server.urls],
      username: server.username,
      credential: server.credential,
    }));

    const configuration: any = {
      iceServers: formattedIceServers,
      // iceServers: [
      //   {
      //     urls: [
      //       "stun:stun.l.google.com:19302",
      //       "stun:stun1.l.google.com:19302",
      //     ],
      //   },
      // ],
      iceCandidatePoolSize: 10,
    };

    console.log("WebRTC Configuration: ", configuration);

    this.peerConnection = new RTCPeerConnection(configuration);
    console.log("Peer connection created");

    // 🔹 Local tracks
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    // 🔹 Remote stream events
    this.peerConnection.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        console.log("Remote stream received");
        this.remoteStream = event.streams[0];
        onRemoteStream(event.streams[0]);
      }
    };

    // 🔹 ICE candidate event
    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log("ICE candidate generated");
        onIceCandidate(event.candidate);
      }
    };

    // 🔹 Connection state event
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState as ConnectionStateType;
      console.log("Connection state:", state);
      onConnectionStateChange?.(state);

      if (state === "failed" || state === "closed") {
        console.warn("Connection failed or closed");
      }
    };

    // 🔹 ICE connection state event
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection
        ?.iceConnectionState as IceConnectionStateType;
      console.log("ICE connection state:", state);
      onIceConnectionStateChange?.(state);
    };

    // 🔹 ICE gathering state event
    this.peerConnection.onicegatheringstatechange = () => {
      const state = this.peerConnection
        ?.iceGatheringState as IceGatheringStateType;
      console.log("ICE gathering state:", state);
      onIceGatheringStateChange?.(state);
    };

    return this.peerConnection;
  }

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    console.log("Offer created and set as local description");

    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log("Answer created and set as local description");

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
    console.log("Remote description set");
  }

  async addIceCandidate(candidate: any): Promise<void> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");

    try {
      const iceCandidate = candidate.candidate
        ? new RTCIceCandidate(candidate)
        : new RTCIceCandidate({ candidate: candidate });

      await this.peerConnection.addIceCandidate(iceCandidate);
      console.log("ICE candidate added");
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    console.log(`Audio ${enabled ? "enabled" : "disabled"}`);
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    console.log(`Video ${enabled ? "enabled" : "disabled"}`);
  }

  async switchCamera(): Promise<void> {
    this.localStream?.getVideoTracks().forEach((track) => {
      // @ts-ignore: react-native-webrtc internal
      track._switchCamera();
    });
    console.log("Camera switched");
  }

  async getStats(): Promise<any> {
    if (!this.peerConnection)
      throw new Error("Peer connection not initialized");
    return await this.peerConnection.getStats();
  }

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

  closeConnection(): void {
    console.log("Closing WebRTC connection...");

    this.peerConnection?.close();
    this.peerConnection = null;

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;

    this.remoteStream = null;

    console.log("WebRTC connection closed and cleaned up");
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
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
