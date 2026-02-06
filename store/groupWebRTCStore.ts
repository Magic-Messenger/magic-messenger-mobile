import { startTransition } from "react";
import { create } from "zustand";

import { CallingType } from "@/api/models";
import {
  GroupCallAnsweredEvent,
  GroupCallEndedEvent,
  GroupCallRejectedEvent,
  GroupCameraToggleEvent,
  GroupIceCandidateEvent,
  GroupMicrophoneToggleEvent,
  IncomingGroupCallEvent,
} from "@/constants";
import GroupWebRTCService from "@/services/webRTC/groupWebRTCService";
import {
  ConnectionStateType,
  MediaStream,
} from "@/services/webRTC/webRTCService";
import { trackEvent } from "@/utils";

import { useSignalRStore, useUserStore } from "../store";

/* -------------------- Types -------------------- */

export type GroupParticipant = {
  username: string;
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionState: ConnectionStateType;
};

export type IncomingGroupCallData = {
  callId: string;
  groupName: string;
  callerUsername: string;
  callingType: CallingType;
  offer: string;
} | null;

export type StartGroupCallParams = {
  groupName: string;
  callingType: CallingType;
};

type GroupWebRTCStore = {
  // Call state
  callId?: string;
  groupName?: string;
  callingType: CallingType;
  isInGroupCall: boolean;
  isCaller: boolean;

  // Local media
  localStream?: MediaStream;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;

  // Participants
  participants: Map<string, GroupParticipant>;

  // Incoming call
  incomingGroupCallData: IncomingGroupCallData;

  // Setters
  setCallId: (callId: string) => void;
  setGroupName: (groupName: string) => void;
  setLocalStream: (stream?: MediaStream) => void;
  setLocalVideoEnabled: (enabled: boolean) => void;
  setLocalAudioEnabled: (enabled: boolean) => void;

  // Actions
  startGroupCall: (params: StartGroupCallParams) => Promise<void>;
  handleIncomingGroupCall: (data: IncomingGroupCallEvent) => void;
  acceptGroupCall: () => Promise<void>;
  declineGroupCall: () => void;
  handleGroupCallAnswered: (data: GroupCallAnsweredEvent) => Promise<void>;
  handleGroupIceCandidate: (data: GroupIceCandidateEvent) => Promise<void>;
  handleGroupCallEnded: (data: GroupCallEndedEvent) => void;
  handleGroupCallRejected: (data: GroupCallRejectedEvent) => void;
  handleGroupCameraToggle: (data: GroupCameraToggleEvent) => void;
  handleGroupMicrophoneToggle: (data: GroupMicrophoneToggleEvent) => void;
  leaveGroupCall: () => void;
  toggleLocalVideo: (enabled: boolean) => void;
  toggleLocalAudio: (enabled: boolean) => void;
  resetStore: () => void;

  // Participant management
  addParticipant: (username: string) => void;
  removeParticipant: (username: string) => void;
  updateParticipantStream: (username: string, stream: MediaStream) => void;
  updateParticipantConnectionState: (
    username: string,
    state: ConnectionStateType,
  ) => void;
};

const initialState = {
  callId: undefined,
  groupName: undefined,
  callingType: CallingType.Video,
  isInGroupCall: false,
  isCaller: false,
  localStream: undefined,
  isLocalVideoEnabled: true,
  isLocalAudioEnabled: true,
  participants: new Map<string, GroupParticipant>(),
  incomingGroupCallData: null as IncomingGroupCallData,
};

export const useGroupWebRTCStore = create<GroupWebRTCStore>((set, get) => ({
  ...initialState,

  /* -------------------- Setters -------------------- */

  setCallId: (callId: string) => set({ callId }),

  setGroupName: (groupName: string) => set({ groupName }),

  setLocalStream: (stream?: MediaStream) => set({ localStream: stream }),

  setLocalVideoEnabled: (enabled: boolean) => {
    GroupWebRTCService.toggleVideo(enabled);

    const groupName = get().groupName;
    if (groupName) {
      startTransition(() => {
        useSignalRStore.getState().magicHubClient?.toggleGroupCamera({
          targetGroup: groupName,
          isEnabled: enabled,
        });
      });
    }

    set({ isLocalVideoEnabled: enabled });
  },

  setLocalAudioEnabled: (enabled: boolean) => {
    GroupWebRTCService.toggleAudio(enabled);

    const groupName = get().groupName;
    if (groupName) {
      startTransition(() => {
        useSignalRStore.getState().magicHubClient?.toggleGroupMicrophone({
          targetGroup: groupName,
          isEnabled: enabled,
        });
      });
    }

    set({ isLocalAudioEnabled: enabled });
  },

  /* -------------------- Participant Management -------------------- */

  addParticipant: (username: string) => {
    const currentUser = useUserStore.getState().userName;
    if (username === currentUser) return;

    set((state) => {
      const newParticipants = new Map(state.participants);
      if (!newParticipants.has(username)) {
        newParticipants.set(username, {
          username,
          stream: undefined,
          isVideoEnabled: true,
          isAudioEnabled: true,
          connectionState: "new",
        });
      }
      return { participants: newParticipants };
    });
  },

  removeParticipant: (username: string) => {
    GroupWebRTCService.removeParticipant(username);

    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(username);
      return { participants: newParticipants };
    });
  },

  updateParticipantStream: (username: string, stream: MediaStream) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      const participant = newParticipants.get(username);
      if (participant) {
        newParticipants.set(username, { ...participant, stream });
      }
      return { participants: newParticipants };
    });
  },

  updateParticipantConnectionState: (
    username: string,
    connectionState: ConnectionStateType,
  ) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      const participant = newParticipants.get(username);
      if (participant) {
        newParticipants.set(username, { ...participant, connectionState });
      }
      return { participants: newParticipants };
    });
  },

  /* -------------------- Call Actions -------------------- */

  startGroupCall: async ({ groupName, callingType }) => {
    const currentUsername = useUserStore.getState().userName;

    trackEvent("[GroupCall] Starting group call", {
      groupName,
      callingType,
      caller: currentUsername,
    });

    set({
      groupName,
      callingType,
      isCaller: true,
      isInGroupCall: true,
      isLocalVideoEnabled: callingType === CallingType.Video,
      isLocalAudioEnabled: true,
      participants: new Map(),
    });

    try {
      // 1. Fetch ICE servers
      await GroupWebRTCService.fetchIceServers();

      // 2. Get local stream
      const stream = await GroupWebRTCService.getLocalStream({
        isVideoEnabled: callingType === CallingType.Video,
        isAudioEnabled: true,
      });
      set({ localStream: stream });

      // 3. Setup callbacks
      GroupWebRTCService.setCallbacks(
        // onRemoteStream
        (username, remoteStream) => {
          get().updateParticipantStream(username, remoteStream);
        },
        // onIceCandidate
        (username, candidate) => {
          startTransition(() => {
            useSignalRStore.getState().magicHubClient?.sendGroupIceCandidate({
              targetGroup: groupName,
              candidate: JSON.stringify(candidate),
            });
          });
        },
        // onConnectionStateChange
        (username, state) => {
          get().updateParticipantConnectionState(username, state);
        },
        // onParticipantDisconnected
        (username) => {
          trackEvent("[GroupCall] Participant disconnected", { username });
          get().removeParticipant(username);
        },
      );

      // 4. Create a peer connection to generate the offer
      // This offer will be broadcast to all group members by the backend
      // We use "__pending_caller__" as a placeholder - this will be renamed when receiver answers
      await GroupWebRTCService.createPeerConnectionForParticipant(
        "__pending_caller__",
      );
      const offer =
        await GroupWebRTCService.createOfferForParticipant(
          "__pending_caller__",
        );

      // 5. Send call request to backend
      const magicHubClient = useSignalRStore.getState().magicHubClient;

      if (!magicHubClient) {
        trackEvent("[GroupCall] ERROR: magicHubClient is null!");
        throw new Error("SignalR connection not available");
      }

      trackEvent("[GroupCall] Sending callGroup request", {
        targetGroup: groupName,
        callingType,
        offerLength: JSON.stringify(offer).length,
      });

      let callId: string | undefined;
      try {
        callId = await magicHubClient.callGroup({
          targetGroup: groupName,
          callingType,
          offer: JSON.stringify(offer),
        });
        trackEvent("[GroupCall] callGroup response", {
          callId,
          type: typeof callId,
        });
      } catch (signalRError) {
        trackEvent("[GroupCall] SignalR callGroup ERROR", {
          error: String(signalRError),
          message: (signalRError as Error)?.message,
        });
        throw signalRError;
      }

      // NOTE: Do NOT remove __pending_caller__ connection here!
      // It will be renamed to the actual participant username when they answer

      if (callId) {
        set({ callId });
        trackEvent("[GroupCall] Call started with callId", {
          callId,
          groupName,
        });
      } else {
        // Generate a temporary callId for tracking purposes
        const tempCallId = `temp_${Date.now()}`;
        set({ callId: tempCallId });
        trackEvent("[GroupCall] Call started without server callId", {
          tempCallId,
          groupName,
          note: "Backend may not return callId - check if incoming_group_call is received on other devices",
        });
      }
    } catch (error) {
      trackEvent("[GroupCall] Error starting call", {
        error: String(error),
        message: (error as Error)?.message,
        groupName,
      });
      get().resetStore();
      throw error; // Re-throw so UI can handle it
    }
  },

  handleIncomingGroupCall: (data: IncomingGroupCallEvent) => {
    const currentUsername = useUserStore.getState().userName;

    trackEvent("[GroupCall] >>> handleIncomingGroupCall called <<<", {
      data,
      currentUsername,
      currentState: {
        isInGroupCall: get().isInGroupCall,
        hasIncomingData: !!get().incomingGroupCallData,
      },
    });

    // Ignore if we started the call
    if (data.callerUsername === currentUsername) {
      trackEvent("[GroupCall] Ignoring - we are the caller", {
        callerUsername: data.callerUsername,
        currentUsername,
      });
      return;
    }

    // Ignore if already in a group call
    if (get().isInGroupCall) {
      trackEvent("[GroupCall] Ignoring incoming call - already in call");
      return;
    }

    trackEvent("[GroupCall] Setting incomingGroupCallData", {
      callId: data.callId,
      groupName: data.groupName,
      callerUsername: data.callerUsername,
      callingType: data.callingType,
    });

    set({
      incomingGroupCallData: {
        callId: data.callId,
        groupName: data.groupName,
        callerUsername: data.callerUsername,
        callingType: data.callingType,
        offer: data.offer,
      },
    });

    trackEvent("[GroupCall] incomingGroupCallData set successfully", {
      newState: get().incomingGroupCallData,
    });
  },

  acceptGroupCall: async () => {
    const { incomingGroupCallData } = get();
    if (!incomingGroupCallData) return;

    const { callId, groupName, callerUsername, callingType, offer } =
      incomingGroupCallData;

    trackEvent("[GroupCall] Accepting group call", {
      callId,
      groupName,
      callerUsername,
    });

    set({
      callId,
      groupName,
      callingType,
      isCaller: false,
      isInGroupCall: true,
      isLocalVideoEnabled: callingType === CallingType.Video,
      isLocalAudioEnabled: true,
      incomingGroupCallData: null,
      participants: new Map(),
    });

    try {
      // 1. Fetch ICE servers
      await GroupWebRTCService.fetchIceServers();

      // 2. Get local stream
      const stream = await GroupWebRTCService.getLocalStream({
        isVideoEnabled: callingType === CallingType.Video,
        isAudioEnabled: true,
      });
      set({ localStream: stream });

      // 3. Setup callbacks
      GroupWebRTCService.setCallbacks(
        (username, remoteStream) => {
          get().updateParticipantStream(username, remoteStream);
        },
        (username, candidate) => {
          startTransition(() => {
            useSignalRStore.getState().magicHubClient?.sendGroupIceCandidate({
              targetGroup: groupName,
              candidate: JSON.stringify(candidate),
            });
          });
        },
        (username, state) => {
          get().updateParticipantConnectionState(username, state);
        },
        (username) => {
          get().removeParticipant(username);
        },
      );

      // 4. Add caller as participant and create connection
      get().addParticipant(callerUsername);
      await GroupWebRTCService.createPeerConnectionForParticipant(
        callerUsername,
      );

      // 5. Set remote description from offer
      await GroupWebRTCService.setRemoteDescriptionForParticipant(
        callerUsername,
        JSON.parse(offer),
      );

      // 6. Create and send answer
      const answer =
        await GroupWebRTCService.createAnswerForParticipant(callerUsername);

      await useSignalRStore.getState().magicHubClient?.answerGroupCall({
        callId,
        groupName,
        answerType: callingType,
        answer: JSON.stringify(answer),
      });

      trackEvent("[GroupCall] Call accepted and answer sent", {
        callId,
        groupName,
      });
    } catch (error) {
      trackEvent("[GroupCall] Error accepting call", { error });
      get().resetStore();
    }
  },

  declineGroupCall: () => {
    const { incomingGroupCallData } = get();
    if (!incomingGroupCallData) return;

    trackEvent("[GroupCall] Declining group call", incomingGroupCallData);

    startTransition(() => {
      useSignalRStore.getState().magicHubClient?.rejectGroupCall({
        callId: incomingGroupCallData.callId,
        groupName: incomingGroupCallData.groupName,
      });
    });

    set({ incomingGroupCallData: null });
  },

  handleGroupCallAnswered: async (data: GroupCallAnsweredEvent) => {
    trackEvent("[GroupCall] >>> handleGroupCallAnswered called <<<", {
      data,
      currentParticipants: Array.from(get().participants.keys()),
      isInGroupCall: get().isInGroupCall,
      isCaller: get().isCaller,
    });

    const { answerUsername, answer, groupName } = data;
    const currentUsername = useUserStore.getState().userName;
    const { isCaller } = get();

    // Ignore our own answer
    if (answerUsername === currentUsername) {
      trackEvent("[GroupCall] Ignoring own answer", { answerUsername });
      return;
    }

    trackEvent("[GroupCall] Processing answer from", {
      answerUsername,
      hasAnswer: !!answer,
      answerLength: answer?.length,
      isCaller,
    });

    // Add participant if not exists
    if (!get().participants.has(answerUsername)) {
      trackEvent("[GroupCall] Adding new participant", { answerUsername });
      get().addParticipant(answerUsername);
    }

    trackEvent("[GroupCall] Participants after add", {
      participants: Array.from(get().participants.keys()),
    });

    try {
      const parsedAnswer = JSON.parse(answer);

      // Check if we're the caller and have the __pending_caller__ placeholder connection
      // This is the connection we created when starting the call
      const hasPendingCaller =
        GroupWebRTCService.hasParticipant("__pending_caller__");

      trackEvent("[GroupCall] Checking for pending caller connection", {
        hasPendingCaller,
        hasParticipantConnection:
          GroupWebRTCService.hasParticipant(answerUsername),
        isCaller,
      });

      // If we're the caller and have the pending connection, rename it to the actual participant
      if (
        isCaller &&
        hasPendingCaller &&
        !GroupWebRTCService.hasParticipant(answerUsername)
      ) {
        trackEvent(
          "[GroupCall] Renaming __pending_caller__ to actual participant",
          {
            answerUsername,
          },
        );

        const renamed = GroupWebRTCService.renameParticipant(
          "__pending_caller__",
          answerUsername,
        );

        if (renamed) {
          // Now set the remote description (their answer) on the renamed connection
          trackEvent(
            "[GroupCall] Setting remote answer on renamed connection",
            {
              answerUsername,
              answerType: parsedAnswer.type,
            },
          );

          await GroupWebRTCService.setRemoteDescriptionForParticipant(
            answerUsername,
            parsedAnswer,
          );

          trackEvent("[GroupCall] Remote description set successfully", {
            answerUsername,
          });
          return;
        }
      }

      // Check if we have a connection for this participant
      if (!GroupWebRTCService.hasParticipant(answerUsername)) {
        trackEvent("[GroupCall] Creating new peer connection for", {
          answerUsername,
        });
        // Create new peer connection for this participant
        await GroupWebRTCService.createPeerConnectionForParticipant(
          answerUsername,
        );

        // Use Perfect Negotiation pattern - treat their "answer" as an "offer"
        // because we're creating a fresh peer connection and need to negotiate
        // Set the answer as remote description with type "offer"
        const remoteOffer = {
          type: "offer" as RTCSdpType,
          sdp: parsedAnswer.sdp,
        };

        trackEvent("[GroupCall] Setting remote offer (from their answer)", {
          answerUsername,
          sdpType: remoteOffer.type,
        });

        await GroupWebRTCService.setRemoteDescriptionForParticipant(
          answerUsername,
          remoteOffer as RTCSessionDescription,
        );

        // Create and send our answer back
        const ourAnswer =
          await GroupWebRTCService.createAnswerForParticipant(answerUsername);

        trackEvent("[GroupCall] Sending our answer back to participant", {
          answerUsername,
          answerType: ourAnswer?.type,
        });

        // Send our answer to the participant
        const { callId, callingType } = get();
        await useSignalRStore.getState().magicHubClient?.answerGroupCall({
          callId: callId!,
          groupName: groupName ?? get().groupName!,
          answerType: callingType,
          answer: JSON.stringify(ourAnswer),
        });
      } else {
        // We already have a connection - check signaling state
        const signalingState =
          GroupWebRTCService.getSignalingState(answerUsername);

        trackEvent("[GroupCall] Processing answer for existing connection", {
          answerUsername,
          signalingState,
        });

        // If we're in stable state, the connection is already established
        // This might be a response to our role-reversed answer, so we can ignore it
        if (signalingState === "stable") {
          trackEvent("[GroupCall] Connection already stable, ignoring answer", {
            answerUsername,
          });
          return;
        }

        // Otherwise, set the remote description
        await GroupWebRTCService.setRemoteDescriptionForParticipant(
          answerUsername,
          parsedAnswer,
        );
      }
    } catch (error) {
      trackEvent("[GroupCall] Error handling call answered", {
        error: String(error),
        answerUsername,
      });
    }
  },

  handleGroupIceCandidate: async (data: GroupIceCandidateEvent) => {
    const { callerUsername, candidate } = data;
    const currentUsername = useUserStore.getState().userName;

    // Ignore our own ICE candidates
    if (callerUsername === currentUsername) return;

    try {
      await GroupWebRTCService.addIceCandidateForParticipant(
        callerUsername,
        JSON.parse(candidate),
      );
    } catch (error) {
      trackEvent("[GroupCall] Error adding ICE candidate", {
        error,
        callerUsername,
      });
    }
  },

  handleGroupCallEnded: (data: GroupCallEndedEvent) => {
    const { endedUsername } = data;
    const currentUsername = useUserStore.getState().userName;

    trackEvent("[GroupCall] Participant ended call", { endedUsername });

    // If it's us, ignore (we're leaving anyway)
    if (endedUsername === currentUsername) return;

    // Remove the participant who left
    get().removeParticipant(endedUsername);

    // Note: Don't call resetStore() here!
    // The useEffect in the hook will detect participants.size === 0
    // and call handleCallEnd() which properly navigates back and cleans up
    trackEvent("[GroupCall] Participant removed, remaining count:", {
      count: get().participants.size,
    });
  },

  handleGroupCallRejected: (data: GroupCallRejectedEvent) => {
    const { rejectedUsername } = data;

    trackEvent("[GroupCall] Participant rejected call", { rejectedUsername });

    // Remove from participants if they were added
    get().removeParticipant(rejectedUsername);
  },

  handleGroupCameraToggle: (data: GroupCameraToggleEvent) => {
    const { toggledUsername, isEnabled } = data;
    const currentUsername = useUserStore.getState().userName;

    // Ignore our own toggle
    if (toggledUsername === currentUsername) return;

    trackEvent("[GroupCall] Camera toggle", { toggledUsername, isEnabled });

    set((state) => {
      const newParticipants = new Map(state.participants);
      const participant = newParticipants.get(toggledUsername);
      if (participant) {
        newParticipants.set(toggledUsername, {
          ...participant,
          isVideoEnabled: isEnabled,
        });
      }
      return { participants: newParticipants };
    });
  },

  handleGroupMicrophoneToggle: (data: GroupMicrophoneToggleEvent) => {
    const { toggledUsername, isEnabled } = data;
    const currentUsername = useUserStore.getState().userName;

    // Ignore our own toggle
    if (toggledUsername === currentUsername) return;

    trackEvent("[GroupCall] Microphone toggle", { toggledUsername, isEnabled });

    set((state) => {
      const newParticipants = new Map(state.participants);
      const participant = newParticipants.get(toggledUsername);
      if (participant) {
        newParticipants.set(toggledUsername, {
          ...participant,
          isAudioEnabled: isEnabled,
        });
      }
      return { participants: newParticipants };
    });
  },

  leaveGroupCall: () => {
    const { callId, groupName } = get();

    trackEvent("[GroupCall] Leaving group call", { callId, groupName });

    if (callId && groupName) {
      startTransition(() => {
        useSignalRStore.getState().magicHubClient?.endGroupCall({
          callId,
          targetGroup: groupName,
        });
      });
    }

    GroupWebRTCService.closeAllConnections();
    set({
      ...initialState,
      participants: new Map(),
    });
  },

  toggleLocalVideo: (enabled: boolean) => {
    get().setLocalVideoEnabled(enabled);
  },

  toggleLocalAudio: (enabled: boolean) => {
    get().setLocalAudioEnabled(enabled);
  },

  resetStore: () => {
    trackEvent("[GroupCall] Resetting store");
    GroupWebRTCService.closeAllConnections();
    set({
      ...initialState,
      participants: new Map(),
    });
  },
}));
