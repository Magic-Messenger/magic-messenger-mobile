import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import InCallManager from "react-native-incall-manager";

import { CallingType } from "@/api/models";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import GroupWebRTCService from "@/services/webRTC/groupWebRTCService";
import { useGroupWebRTCStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel, trackEvent, widthPixel } from "@/utils";

type GroupCallingParams = {
  groupName: string;
  chatId?: string;
  callingType: CallingType;
  mode?: "answer" | "start";
};

export const useGroupAudioCalling = () => {
  const { t } = useTranslation();
  useKeepAwake();
  const styles = useThemedStyles(createStyle);

  const { groupName, chatId, callingType, mode } =
    useLocalSearchParams<GroupCallingParams>();

  const currentUsername = useUserStore((s) => s.userName) ?? "";

  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  // Permission handling
  const {
    permissionDenied,
    deniedPermissionType,
    checkAndRequestPermissions,
    openSettings,
    resetPermissionDenied,
  } = useMediaPermissions();

  // Store selectors
  const participants = useGroupWebRTCStore((s) => s.participants);
  const localStream = useGroupWebRTCStore((s) => s.localStream);
  const isInGroupCall = useGroupWebRTCStore((s) => s.isInGroupCall);
  const isLocalAudioEnabled = useGroupWebRTCStore((s) => s.isLocalAudioEnabled);

  const startGroupCall = useGroupWebRTCStore((s) => s.startGroupCall);
  const acceptGroupCall = useGroupWebRTCStore((s) => s.acceptGroupCall);
  const leaveGroupCall = useGroupWebRTCStore((s) => s.leaveGroupCall);
  const toggleLocalAudio = useGroupWebRTCStore((s) => s.toggleLocalAudio);
  const resetStore = useGroupWebRTCStore((s) => s.resetStore);

  // Call activity tracker
  const isCallActiveRef = useRef(true);

  const handleCallEnd = useCallback(() => {
    isCallActiveRef.current = false;
    leaveGroupCall();

    // Safe navigation
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat/home");
    }
  }, [leaveGroupCall]);

  const toggleMicrophone = useCallback(() => {
    const newMutedState = !isAudioMuted;
    GroupWebRTCService.toggleAudio(!newMutedState);
    setIsAudioMuted(newMutedState);
    toggleLocalAudio(!newMutedState);
    trackEvent("[GroupAudioCall] Microphone toggled", {
      isMuted: newMutedState,
      groupName,
    });
  }, [isAudioMuted, toggleLocalAudio, groupName]);

  const toggleSpeaker = useCallback(() => {
    const newSpeakerState = !isSpeakerOn;
    InCallManager.setSpeakerphoneOn(newSpeakerState);
    setIsSpeakerOn(newSpeakerState);
    trackEvent("[GroupAudioCall] Speaker toggled", {
      isSpeakerOn: newSpeakerState,
      groupName,
    });
  }, [isSpeakerOn, groupName]);

  // Setup audio mode for audio calls
  useEffect(() => {
    InCallManager.start({ media: "audio" });
    InCallManager.setSpeakerphoneOn(false);
    trackEvent("[GroupAudioCall] Audio call mode initialized");

    return () => {
      InCallManager.stop();
    };
  }, []);

  // Reset call active ref on mount
  useEffect(() => {
    isCallActiveRef.current = true;
    return () => {
      isCallActiveRef.current = false;
    };
  }, []);

  // Safe navigation helper
  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat/home");
    }
  }, []);

  // Handle permission denied
  const handlePermissionModalClose = useCallback(() => {
    resetPermissionDenied();
    safeGoBack();
  }, [resetPermissionDenied, safeGoBack]);

  // Handle open settings from permission modal
  const handleOpenSettings = useCallback(() => {
    openSettings();
    resetPermissionDenied();
    safeGoBack();
  }, [openSettings, resetPermissionDenied, safeGoBack]);

  // Track if call ever had participants (to distinguish between waiting for join vs everyone left)
  const hadParticipantsRef = useRef(false);

  // Update hadParticipants when participants join
  useEffect(() => {
    if (participants.size > 0) {
      hadParticipantsRef.current = true;
    }
  }, [participants.size]);

  // Auto end call when all participants have left (but only if we had participants before)
  useEffect(() => {
    if (
      !loading &&
      isInGroupCall &&
      participants.size === 0 &&
      hadParticipantsRef.current
    ) {
      trackEvent("[GroupAudioCall] All participants left, ending call");
      handleCallEnd();
    }
  }, [loading, isInGroupCall, participants.size, handleCallEnd]);

  // Initialize call
  useEffect(() => {
    if (!groupName) {
      safeGoBack();
      return;
    }

    const initializeCall = async () => {
      // Check permissions before starting or answering call
      const hasPermission = await checkAndRequestPermissions("microphone");

      if (!hasPermission) {
        trackEvent("[GroupAudioCall] Permission denied", { groupName });
        setLoading(false);
        return;
      }

      try {
        if (mode === "answer") {
          await acceptGroupCall();
        } else {
          await startGroupCall({
            groupName,
            callingType: CallingType.Audio,
          });
        }
      } catch (error) {
        trackEvent("[GroupAudioCall] Error initializing call", {
          error,
          groupName,
        });
        resetStore();
        safeGoBack();
      } finally {
        if (isCallActiveRef.current) {
          setTimeout(() => setLoading(false), 500);
        }
      }
    };

    initializeCall();
  }, [groupName, mode, checkAndRequestPermissions, safeGoBack]);

  return {
    t,
    styles,
    loading,
    isAudioMuted,
    isSpeakerOn,
    participants,
    localStream,
    currentUsername,
    groupName,
    chatId,
    isLocalAudioEnabled,
    handleCallEnd,
    toggleMicrophone,
    toggleSpeaker,
    // Permission handling
    permissionDenied,
    deniedPermissionType,
    handlePermissionModalClose,
    handleOpenSettings,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: spacingPixel(50),
      paddingHorizontal: spacingPixel(20),
      paddingBottom: spacingPixel(12),
      alignItems: "center",
      zIndex: 10,
    },
    headerBadge: {
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: spacingPixel(16),
      paddingVertical: spacingPixel(8),
      borderRadius: 20,
      alignItems: "center",
    },
    groupName: {
      color: "#fff",
      fontSize: widthPixel(16),
      fontWeight: "600",
    },
    participantCount: {
      color: "rgba(255,255,255,0.8)",
      fontSize: widthPixel(12),
      marginTop: spacingPixel(2),
    },
    gridContainer: {
      flex: 1,
    },
    gridRow: {
      flex: 1,
      flexDirection: "row",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      color: "rgba(255,255,255,0.6)",
      fontSize: widthPixel(16),
    },
    localAvatarContainer: {
      position: "absolute",
      top: spacingPixel(110),
      right: spacingPixel(20),
      alignItems: "center",
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 16,
      padding: spacingPixel(10),
    },
    localAvatar: {
      width: widthPixel(50),
      height: widthPixel(50),
      borderRadius: widthPixel(25),
      backgroundColor: "#555",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    localAvatarText: {
      color: "#fff",
      fontSize: widthPixel(20),
      fontWeight: "bold",
    },
    localAvatarName: {
      color: "rgba(255,255,255,0.8)",
      fontSize: widthPixel(10),
      marginTop: spacingPixel(4),
    },
    localMutedBadge: {
      position: "absolute",
      top: spacingPixel(48),
      right: spacingPixel(6),
      backgroundColor: "#ff4444",
      borderRadius: 10,
      padding: 4,
    },
    controls: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacingPixel(30),
      paddingBottom: spacingPixel(50),
      paddingTop: spacingPixel(20),
      zIndex: 10,
    },
    controlsRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    controlButtonActive: {
      backgroundColor: colors.background,
    },
    controlButtonDanger: {
      backgroundColor: colors.danger,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: "#fff",
      fontSize: widthPixel(16),
      marginTop: spacingPixel(16),
    },
  });

export { createStyle as groupAudioCallingStyles };
