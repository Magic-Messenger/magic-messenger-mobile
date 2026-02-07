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

export type ConnectionStateType =
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

type OnRemoteStreamCallback = (username: string, stream: MediaStream) => void;
type OnIceCandidateCallback = (
  username: string,
  candidate: RTCIceCandidate,
) => void;
type OnConnectionStateChangeCallback = (
  username: string,
  state: ConnectionStateType,
) => void;
type OnParticipantDisconnectedCallback = (username: string) => void;

type LocalMediaTrackConstraints = {
  isFrontCamera?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
};

type ParticipantConnection = {
  peerConnection: RTCPeerConnection;
  pendingIceCandidates: RTCIceCandidate[];
  hasRemoteDescription: boolean;
  connectionState: ConnectionStateType;
  // Mutable username that can be updated when participant is renamed
  // Callbacks reference this to get the current name
  currentUsername: string;
};

/* -------------------- Service -------------------- */

class GroupWebRTCService {
  private localStream: MediaStream | null = null;
  private iceServers: IceServer[] = [];
  private participants: Map<string, ParticipantConnection> = new Map();
  // Queue for ICE candidates that arrive before peer connection is created
  private pendingIceCandidatesQueue: Map<string, RTCIceCandidate[]> = new Map();

  // Callbacks
  private onRemoteStreamCallback: OnRemoteStreamCallback | null = null;
  private onIceCandidateCallback: OnIceCandidateCallback | null = null;
  private onConnectionStateChangeCallback: OnConnectionStateChangeCallback | null =
    null;
  private onParticipantDisconnectedCallback: OnParticipantDisconnectedCallback | null =
    null;

  /* -------------------- Callbacks Setup -------------------- */

  setCallbacks(
    onRemoteStream: OnRemoteStreamCallback,
    onIceCandidate: OnIceCandidateCallback,
    onConnectionStateChange: OnConnectionStateChangeCallback,
    onParticipantDisconnected?: OnParticipantDisconnectedCallback,
  ): void {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onIceCandidateCallback = onIceCandidate;
    this.onConnectionStateChangeCallback = onConnectionStateChange;
    this.onParticipantDisconnectedCallback = onParticipantDisconnected ?? null;
  }

  /* -------------------- ICE Servers -------------------- */

  async fetchIceServers(): Promise<IceServer[]> {
    try {
      if (this.iceServers.length) return this.iceServers;

      const response = await getApiCallingGetIceServers();
      this.iceServers = response ?? [];

      trackEvent("[GroupWebRTC] ICE servers loaded", this.iceServers);
      return this.iceServers;
    } catch (error) {
      console.error("[GroupWebRTC] ICE server fetch failed", error);

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
      trackEvent("[GroupWebRTC] Local stream obtained successfully");
      return stream;
    } catch (error) {
      console.error("[GroupWebRTC] Error getting local stream:", error);
      throw new Error(`Failed to get local media: ${error}`);
    }
  }

  getLocalStreamSync(): MediaStream | null {
    return this.localStream;
  }

  /* -------------------- Peer Connection Management -------------------- */

  async createPeerConnectionForParticipant(
    participantUsername: string,
  ): Promise<RTCPeerConnection> {
    if (this.iceServers.length === 0) {
      throw new Error(
        "[GroupWebRTC] ICE servers not loaded. Call fetchIceServers first.",
      );
    }

    if (!this.localStream) {
      throw new Error(
        "[GroupWebRTC] Local stream not available. Call getLocalStream first.",
      );
    }

    // Check if connection already exists
    if (this.participants.has(participantUsername)) {
      trackEvent("[GroupWebRTC] Peer connection already exists for", {
        participantUsername,
      });
      return this.participants.get(participantUsername)!.peerConnection;
    }

    const configuration: RTCConfiguration = {
      iceServers: this.iceServers.map((s) => ({
        urls: Array.isArray(s.urls) ? s.urls : [s.urls as never],
        ...(s.username ? { username: s.username } : {}),
        ...(s.credential ? { credential: s.credential } : {}),
      })),
      iceCandidatePoolSize: 10,
    };

    const peerConnection = new RTCPeerConnection(configuration);

    const participantData: ParticipantConnection = {
      peerConnection,
      pendingIceCandidates: [],
      hasRemoteDescription: false,
      connectionState: "new",
      currentUsername: participantUsername, // Mutable reference for callbacks
    };

    this.participants.set(participantUsername, participantData);

    trackEvent("[GroupWebRTC] PeerConnection created for", {
      participantUsername,
    });

    // Add local tracks
    this.localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, this.localStream!);
    });

    // Handle remote tracks
    // Use participantData.currentUsername so it uses the updated name after rename
    peerConnection.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams?.[0]) {
        const stream = event.streams?.[0] as unknown as MediaStream;
        trackEvent("[GroupWebRTC] Remote stream received from", {
          participantUsername: participantData.currentUsername,
        });
        this.onRemoteStreamCallback?.(participantData.currentUsername, stream);
      }
    };

    // Handle ICE candidates
    // Use participantData.currentUsername so it uses the updated name after rename
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidateCallback?.(
          participantData.currentUsername,
          event.candidate,
        );
      }
    };

    // Handle connection state changes
    // Use participantData.currentUsername so it uses the updated name after rename
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState as ConnectionStateType;
      participantData.connectionState = state;

      trackEvent("[GroupWebRTC] Connection state changed", {
        participantUsername: participantData.currentUsername,
        state,
      });

      this.onConnectionStateChangeCallback?.(
        participantData.currentUsername,
        state,
      );

      // Handle disconnection
      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        this.onParticipantDisconnectedCallback?.(
          participantData.currentUsername,
        );
      }
    };

    // Flush any pending ICE candidates that arrived before peer connection was created
    const pendingCandidates =
      this.pendingIceCandidatesQueue.get(participantUsername);
    if (pendingCandidates && pendingCandidates.length > 0) {
      trackEvent("[GroupWebRTC] Flushing pending ICE candidates for", {
        participantUsername,
        count: pendingCandidates.length,
      });
      participantData.pendingIceCandidates.push(...pendingCandidates);
      this.pendingIceCandidatesQueue.delete(participantUsername);
    }

    return peerConnection;
  }

  /* -------------------- SDP Operations -------------------- */

  async createOfferForParticipant(
    participantUsername: string,
  ): Promise<RTCSessionDescription> {
    const participant = this.participants.get(participantUsername);
    if (!participant) {
      throw new Error(
        `[GroupWebRTC] No peer connection for participant: ${participantUsername}`,
      );
    }

    const offer = await participant.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await participant.peerConnection.setLocalDescription(offer);
    trackEvent("[GroupWebRTC] Offer created for", { participantUsername });

    return offer;
  }

  async createAnswerForParticipant(
    participantUsername: string,
  ): Promise<RTCSessionDescription> {
    const participant = this.participants.get(participantUsername);
    if (!participant) {
      throw new Error(
        `[GroupWebRTC] No peer connection for participant: ${participantUsername}`,
      );
    }

    const answer = await participant.peerConnection.createAnswer();
    await participant.peerConnection.setLocalDescription(answer);

    trackEvent("[GroupWebRTC] Answer created for", { participantUsername });
    return answer;
  }

  async setRemoteDescriptionForParticipant(
    participantUsername: string,
    description: RTCSessionDescription,
  ): Promise<void> {
    const participant = this.participants.get(participantUsername);
    if (!participant) {
      throw new Error(
        `[GroupWebRTC] No peer connection for participant: ${participantUsername}`,
      );
    }

    const signalingState = participant.peerConnection.signalingState;

    trackEvent("[GroupWebRTC] Setting remote description", {
      participantUsername,
      descriptionType: description.type,
      currentSignalingState: signalingState,
    });

    // If we're in stable state and receiving an answer, it might be a response
    // to our role-reversed negotiation. In this case, we should ignore it
    // because the connection should already be established.
    if (signalingState === "stable" && description.type === "answer") {
      trackEvent("[GroupWebRTC] Ignoring answer - already in stable state", {
        participantUsername,
      });
      return;
    }

    await participant.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description),
    );

    participant.hasRemoteDescription = true;

    // Flush pending ICE candidates
    for (const candidate of participant.pendingIceCandidates) {
      await participant.peerConnection.addIceCandidate(candidate);
    }

    participant.pendingIceCandidates = [];
    trackEvent("[GroupWebRTC] Remote description set for", {
      participantUsername,
    });
  }

  getSignalingState(participantUsername: string): RTCSignalingState | null {
    const participant = this.participants.get(participantUsername);
    return participant?.peerConnection.signalingState ?? null;
  }

  async addIceCandidateForParticipant(
    participantUsername: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const ice = new RTCIceCandidate(candidate);
    const participant = this.participants.get(participantUsername);

    // If no peer connection yet, queue the ICE candidate for later
    if (!participant) {
      trackEvent(
        "[GroupWebRTC] Queueing ICE candidate (no peer connection yet)",
        {
          participantUsername,
        },
      );
      const existing =
        this.pendingIceCandidatesQueue.get(participantUsername) ?? [];
      existing.push(ice);
      this.pendingIceCandidatesQueue.set(participantUsername, existing);
      return;
    }

    // If no remote description yet, add to participant's pending queue
    if (!participant.hasRemoteDescription) {
      participant.pendingIceCandidates.push(ice);
      return;
    }

    await participant.peerConnection.addIceCandidate(ice);
  }

  /* -------------------- Media Controls -------------------- */

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
      trackEvent("[GroupWebRTC] switchCamera skipped – no active video track");
      return;
    }
    try {
      const settings = videoTrack.getSettings?.() ?? {};
      const newFacingMode =
        settings.facingMode === "user" ? "environment" : "user";
      await videoTrack.applyConstraints({
        facingMode: newFacingMode,
      });
    } catch (error) {
      trackEvent("[GroupWebRTC] switchCamera error", { error });
    }
  }

  /* -------------------- State Queries -------------------- */

  isAudioEnabled(): boolean {
    const audio = this.localStream?.getAudioTracks()[0];
    return !!audio && audio.enabled;
  }

  isVideoEnabled(): boolean {
    const video = this.localStream?.getVideoTracks()[0];
    return !!video && video.enabled;
  }

  getParticipantConnectionState(
    participantUsername: string,
  ): ConnectionStateType | null {
    const participant = this.participants.get(participantUsername);
    return participant?.connectionState ?? null;
  }

  getAllParticipantUsernames(): string[] {
    return Array.from(this.participants.keys());
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  hasParticipant(participantUsername: string): boolean {
    return this.participants.has(participantUsername);
  }

  /**
   * Rename a participant's peer connection.
   * This is used when the caller creates a connection with a placeholder name
   * and needs to rename it to the actual participant username when they answer.
   */
  renameParticipant(oldUsername: string, newUsername: string): boolean {
    const participant = this.participants.get(oldUsername);
    if (!participant) {
      trackEvent("[GroupWebRTC] Cannot rename - participant not found", {
        oldUsername,
        newUsername,
      });
      return false;
    }

    if (this.participants.has(newUsername)) {
      trackEvent(
        "[GroupWebRTC] Cannot rename - target username already exists",
        {
          oldUsername,
          newUsername,
        },
      );
      return false;
    }

    // Update the mutable username reference so callbacks use the new name
    participant.currentUsername = newUsername;

    // Move the participant to the new key
    this.participants.set(newUsername, participant);
    this.participants.delete(oldUsername);

    // Merge any pending ICE candidates from the old username
    const pendingFromOld = this.pendingIceCandidatesQueue.get(oldUsername);
    if (pendingFromOld && pendingFromOld.length > 0) {
      participant.pendingIceCandidates.push(...pendingFromOld);
      this.pendingIceCandidatesQueue.delete(oldUsername);
    }

    // Also flush any pending ICE candidates queued under the new username
    // (these might have arrived before the rename happened)
    const pendingFromNew = this.pendingIceCandidatesQueue.get(newUsername);
    if (pendingFromNew && pendingFromNew.length > 0) {
      trackEvent(
        "[GroupWebRTC] Flushing pending ICE candidates for renamed participant",
        {
          newUsername,
          count: pendingFromNew.length,
        },
      );
      participant.pendingIceCandidates.push(...pendingFromNew);
      this.pendingIceCandidatesQueue.delete(newUsername);
    }

    trackEvent("[GroupWebRTC] Participant renamed", {
      oldUsername,
      newUsername,
      pendingIceCandidates: participant.pendingIceCandidates.length,
    });

    return true;
  }

  /* -------------------- Cleanup -------------------- */

  removeParticipant(participantUsername: string): void {
    const participant = this.participants.get(participantUsername);

    trackEvent("[GroupWebRTC] Removing participant", { participantUsername });

    // Clean up pending ICE candidates queue
    this.pendingIceCandidatesQueue.delete(participantUsername);

    if (!participant) return;

    // Clean up peer connection
    participant.peerConnection.ontrack = undefined;
    participant.peerConnection.onicecandidate = undefined;
    participant.peerConnection.onconnectionstatechange = undefined;

    participant.peerConnection.close();
    participant.pendingIceCandidates = [];

    this.participants.delete(participantUsername);
  }

  closeAllConnections(): void {
    trackEvent("[GroupWebRTC] Closing all connections");

    // Close all peer connections
    this.participants.forEach((participant, username) => {
      participant.peerConnection.ontrack = undefined;
      participant.peerConnection.onicecandidate = undefined;
      participant.peerConnection.onconnectionstatechange = undefined;

      participant.peerConnection.close();
      trackEvent("[GroupWebRTC] Closed connection for", { username });
    });

    this.participants.clear();
    this.pendingIceCandidatesQueue.clear();

    // Stop local stream
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;

    // Clear callbacks
    this.onRemoteStreamCallback = null;
    this.onIceCandidateCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.onParticipantDisconnectedCallback = null;
  }

  reset(): void {
    this.closeAllConnections();
    this.iceServers = [];
    this.pendingIceCandidatesQueue.clear();
  }
}

export default new GroupWebRTCService();

export type {
  ConnectionStateType as GroupConnectionStateType,
  LocalMediaTrackConstraints as GroupLocalMediaTrackConstraints,
  OnConnectionStateChangeCallback as GroupOnConnectionStateChangeCallback,
  OnIceCandidateCallback as GroupOnIceCandidateCallback,
  OnParticipantDisconnectedCallback as GroupOnParticipantDisconnectedCallback,
  OnRemoteStreamCallback as GroupOnRemoteStreamCallback,
};
