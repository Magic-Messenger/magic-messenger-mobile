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
import { heightPixel, spacingPixel, trackEvent, widthPixel } from "@/utils";

type GroupCallingParams = {
  groupName: string;
  chatId?: string;
  callingType: CallingType;
  mode?: "answer" | "start";
};

export const useGroupVideoCalling = () => {
  const { t } = useTranslation();
  useKeepAwake();
  const styles = useThemedStyles(createStyle);

  const { groupName, chatId, callingType, mode } =
    useLocalSearchParams<GroupCallingParams>();

  const currentUsername = useUserStore((s) => s.userName) ?? "";

  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

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
  const isLocalVideoEnabled = useGroupWebRTCStore((s) => s.isLocalVideoEnabled);
  const isLocalAudioEnabled = useGroupWebRTCStore((s) => s.isLocalAudioEnabled);

  const startGroupCall = useGroupWebRTCStore((s) => s.startGroupCall);
  const acceptGroupCall = useGroupWebRTCStore((s) => s.acceptGroupCall);
  const leaveGroupCall = useGroupWebRTCStore((s) => s.leaveGroupCall);
  const toggleLocalVideo = useGroupWebRTCStore((s) => s.toggleLocalVideo);
  const toggleLocalAudio = useGroupWebRTCStore((s) => s.toggleLocalAudio);
  const resetStore = useGroupWebRTCStore((s) => s.resetStore);

  const isVideoCall = callingType === CallingType.Video;

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
    trackEvent("[GroupCall] Microphone toggled", {
      isMuted: newMutedState,
      groupName,
    });
  }, [isAudioMuted, toggleLocalAudio, groupName]);

  const toggleCamera = useCallback(() => {
    if (!isVideoCall) return;
    const newVideoOffState = !isVideoOff;
    GroupWebRTCService.toggleVideo(!newVideoOffState);
    setIsVideoOff(newVideoOffState);
    toggleLocalVideo(!newVideoOffState);
    trackEvent("[GroupCall] Camera toggled", {
      isOff: newVideoOffState,
      groupName,
    });
  }, [isVideoOff, isVideoCall, toggleLocalVideo, groupName]);

  const switchCamera = useCallback(async () => {
    if (!isVideoCall || isVideoOff || isSwitchingCamera) return;

    setIsSwitchingCamera(true);

    try {
      GroupWebRTCService.switchCamera();
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIsFrontCamera((prev) => {
        const newValue = !prev;
        trackEvent("[GroupCall] Camera switched", {
          isFrontCamera: newValue,
          groupName,
        });
        return newValue;
      });
    } finally {
      setTimeout(() => {
        setIsSwitchingCamera(false);
      }, 100);
    }
  }, [isVideoCall, isVideoOff, isSwitchingCamera, groupName]);

  // Setup audio mode for video calls
  useEffect(() => {
    InCallManager.start({ media: "video" });
    InCallManager.setSpeakerphoneOn(true);
    trackEvent("[GroupCall] Video call audio mode initialized");

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

  // Initialize call
  useEffect(() => {
    if (!groupName) {
      safeGoBack();
      return;
    }

    const initializeCall = async () => {
      // Check permissions before starting or answering call
      const hasPermission = await checkAndRequestPermissions("both");

      if (!hasPermission) {
        trackEvent("[GroupCall] Permission denied", { groupName });
        setLoading(false);
        return;
      }

      try {
        if (mode === "answer") {
          await acceptGroupCall();
        } else {
          await startGroupCall({
            groupName,
            callingType: callingType ?? CallingType.Video,
          });
        }
      } catch (error) {
        trackEvent("[GroupCall] Error initializing call", { error, groupName });
        resetStore();
        safeGoBack();
      } finally {
        if (isCallActiveRef.current) {
          setTimeout(() => setLoading(false), 500);
        }
      }
    };

    initializeCall();
  }, [groupName, mode, callingType, checkAndRequestPermissions, safeGoBack]);

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
      trackEvent("[GroupCall] All participants left, ending call");
      handleCallEnd();
    }
  }, [loading, isInGroupCall, participants.size, handleCallEnd]);

  return {
    t,
    styles,
    loading,
    isVideoCall,
    isAudioMuted,
    isVideoOff,
    isFrontCamera,
    isSwitchingCamera,
    isLocalVideoEnabled,
    isLocalAudioEnabled,
    participants,
    localStream,
    currentUsername,
    groupName,
    chatId,
    handleCallEnd,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
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
    localVideoDisabled: {
      width: widthPixel(120),
      height: heightPixel(160),
      position: "absolute",
      top: 60,
      right: 20,
      borderRadius: widthPixel(12),
      borderWidth: 2,
      borderColor: colors.background,
      backgroundColor: "#333",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
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
    controlButtonDisabled: {
      opacity: 0.5,
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

export { createStyle as groupVideoCallingStyles };
