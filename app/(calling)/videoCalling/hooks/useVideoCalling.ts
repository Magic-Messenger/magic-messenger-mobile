import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import InCallManager from "react-native-incall-manager";

import { CallingType } from "@/api/models";
import WebRTCService from "@/services/webRTC/webRTCService";
import { StartCallingType, useWebRTCStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, spacingPixel, trackEvent, widthPixel } from "@/utils";

export const useVideoCalling = () => {
  const { t } = useTranslation();
  useKeepAwake();
  const styles = useThemedStyles(createStyle);

  const { targetUsername, callingType, mode } = useLocalSearchParams<
    StartCallingType & { mode?: string }
  >();

  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [localVideoKey, setLocalVideoKey] = useState(0);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const connectionState = useWebRTCStore((s) => s.connectionState);
  const isIncoming = useWebRTCStore((s) => s.isIncoming);
  const isRemoteVideoEnabled = useWebRTCStore((s) => s.isRemoteVideoEnabled);
  const isRemoteAudioEnabled = useWebRTCStore((s) => s.isRemoteAudioEnabled);

  const startCall = useWebRTCStore((s) => s.startCall);
  const endCall = useWebRTCStore((s) => s.endCall);
  const setVideoEnabled = useWebRTCStore((s) => s.setVideoEnabled);
  const setAudioEnabled = useWebRTCStore((s) => s.setAudioEnabled);

  const isVideoCall = callingType === CallingType.Video;

  // ✅ Call activity tracker
  const isCallActiveRef = useRef(true);

  const handleCallEnd = useCallback(() => {
    isCallActiveRef.current = false;
    endCall();
    router.back();
  }, []);

  const toggleMicrophone = useCallback(() => {
    const newMutedState = !isAudioMuted;
    WebRTCService.toggleAudio(!newMutedState);
    setIsAudioMuted(newMutedState);
    setAudioEnabled(!newMutedState);
    trackEvent("Video microphone toggled", {
      isMuted: newMutedState,
      targetUsername,
    });
  }, [isAudioMuted, setAudioEnabled, targetUsername]);

  const toggleCamera = useCallback(() => {
    if (!isVideoCall) return;
    const newVideoOffState = !isVideoOff;
    WebRTCService.toggleVideo(!newVideoOffState);
    setIsVideoOff(newVideoOffState);
    setVideoEnabled(!newVideoOffState);
    trackEvent("Camera toggled", { isOff: newVideoOffState, targetUsername });
  }, [isVideoOff, isVideoCall, setVideoEnabled, targetUsername]);

  const switchCamera = useCallback(async () => {
    if (!isVideoCall || isVideoOff || isSwitchingCamera) return;

    // Hide RTCView during switch to prevent transparent/blank frame
    setIsSwitchingCamera(true);

    try {
      await WebRTCService.switchCamera();

      // Wait for camera to stabilize before showing RTCView again
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update key to force RTCView re-mount with new camera
      setLocalVideoKey((prev) => prev + 1);

      setIsFrontCamera((prev) => {
        const newValue = !prev;
        trackEvent("Camera switched", {
          isFrontCamera: newValue,
          targetUsername,
        });
        return newValue;
      });
    } finally {
      // Small delay before showing to ensure stream is ready
      setTimeout(() => {
        setIsSwitchingCamera(false);
      }, 100);
    }
  }, [isVideoCall, isVideoOff, isSwitchingCamera, targetUsername]);

  // Setup audio mode for video calls - always use speaker
  useEffect(() => {
    // Start InCallManager for video calls with speaker on
    InCallManager.start({ media: "video" });
    // Video calls always use speaker - not toggleable
    InCallManager.setSpeakerphoneOn(true);
    trackEvent("Video call audio mode initialized with speaker on");

    return () => {
      InCallManager.stop();
    };
  }, []);

  useEffect(() => {
    if (!targetUsername) {
      router.back();
      return;
    }

    isCallActiveRef.current = true; // ✅ Mark call as active

    if (mode === "answer") {
      setLoading(false);
    } else {
      startCall({
        targetUsername: targetUsername,
        callingType: CallingType.Video,
      }).finally(() => {
        // ✅ Only update state if call is still active
        if (isCallActiveRef.current) {
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      });
    }
  }, [targetUsername, mode]);

  // Auto end call when connection fails or closes
  useEffect(() => {
    if (
      connectionState === "failed" ||
      connectionState === "closed" ||
      connectionState === "disconnected"
    ) {
      // ✅ Only proceed if call is still active
      if (isCallActiveRef.current) {
        handleCallEnd();
      }
    }
  }, [connectionState]);

  // Force RTCView refresh when connection state changes to connected
  useEffect(() => {
    if (connectionState === "connected" && isCallActiveRef.current) {
      // Show loading state while WebRTC stabilizes
      setIsSwitchingCamera(true);

      // Small delay to let WebRTC stabilize, then refresh RTCView
      const timer = setTimeout(() => {
        if (isCallActiveRef.current) {
          setLocalVideoKey((prev) => prev + 1);
          setIsSwitchingCamera(false);
          trackEvent("RTCView refreshed on connection", { connectionState });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [connectionState]);

  return {
    t,
    styles,
    loading,
    connectionState,
    isIncoming,
    isVideoCall,
    isAudioMuted,
    isVideoOff,
    isFrontCamera,
    isSwitchingCamera,
    localVideoKey,
    isRemoteVideoEnabled,
    isRemoteAudioEnabled,
    targetUsername,
    callingType,
    handleCallEnd,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    remoteVideo: {
      flex: 1,
    },
    localVideo: {
      width: widthPixel(120),
      height: heightPixel(160),
      position: "absolute",
      top: 60,
      right: 20,
      borderRadius: widthPixel(12),
      borderWidth: 2,
      borderColor: "#fff",
      overflow: "hidden",
      backgroundColor: "#000",
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
    },
    localVideoSwitching: {
      flex: 1,
      backgroundColor: "#222",
      justifyContent: "center",
      alignItems: "center",
    },
    waitingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    waitingText: {
      color: colors.background,
      fontSize: widthPixel(24),
      fontWeight: "600",
    },
    stateText: {
      color: colors.background,
      fontSize: widthPixel(14),
      marginTop: 10,
    },
    targetUsername: {
      color: colors.background,
      fontSize: widthPixel(18),
      marginTop: 8,
    },
    callDuration: {
      color: colors.background,
      fontSize: widthPixel(16),
      marginTop: spacingPixel(4),
    },
    controls: {
      position: "absolute",
      bottom: 50,
      left: 0,
      right: 0,
      paddingHorizontal: spacingPixel(30),
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
    /* TEMP */
    debugInfo: {
      position: "absolute",
      top: 100,
      left: 20,
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: 10,
      borderRadius: 8,
    },
    debugText: {
      color: "#fff",
      fontSize: 12,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#444",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    avatarText: {
      color: colors.background,
      fontSize: widthPixel(40),
      fontWeight: "bold",
    },
    connectionStatus: {
      position: "absolute",
      top: 40,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    connectionStatusText: {
      color: colors.background,
      fontSize: widthPixel(14),
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
    },
    cameraOffBadge: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
      borderRadius: 50,
    },
    remoteMutedIndicator: {
      position: "absolute",
      top: 120,
      left: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 8,
    },
    remoteMutedText: {
      color: colors.background,
      fontSize: widthPixel(14),
    },
  });
