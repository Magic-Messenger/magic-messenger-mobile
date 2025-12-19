import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { CallingType } from "@/api/models";
import WebRTCService from "@/services/webRTC/webRTCService";
import { StartCallingType, useWebRTCStore } from "@/store";
import { useThemedStyles } from "@/theme";

export const useAudioCalling = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const { targetUsername, callingType, mode } = useLocalSearchParams<
    StartCallingType & { mode?: string }
  >();

  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const durationIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  const connectionState = useWebRTCStore((s) => s.connectionState);
  const isIncoming = useWebRTCStore((s) => s.isIncoming);

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);

  const startCall = useWebRTCStore((s) => s.startCall);
  const endCall = useWebRTCStore((s) => s.endCall);

  const handleCallEnd = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    endCall();
    router.back();
  }, [endCall]);

  const toggleMicrophone = useCallback(() => {
    const newMutedState = !isAudioMuted;
    WebRTCService.toggleAudio(!newMutedState);
    setIsAudioMuted(newMutedState);
  }, [isAudioMuted]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
    // Note: Speaker toggle implementation depends on the platform
    // For React Native, you might need to use a library like react-native-incall-manager
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (!targetUsername) {
      router.back();
      return;
    }

    if (mode === "answer") {
      setLoading(false);
      return;
    }

    startCall({
      targetUsername: targetUsername,
      callingType: CallingType.Audio,
    }).finally(() => {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [targetUsername, mode]);

  // Start call duration timer when connected
  useEffect(() => {
    if (connectionState === "connected") {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (
      connectionState === "disconnected" ||
      connectionState === "failed" ||
      connectionState === "closed"
    ) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [connectionState]);

  // Auto end call when connection fails or closes
  useEffect(() => {
    if (
      connectionState === "failed" ||
      connectionState === "closed" ||
      connectionState === "disconnected"
    ) {
      const timeout = setTimeout(() => {
        handleCallEnd();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [connectionState, handleCallEnd]);

  return {
    t,
    styles,
    loading,
    localStream,
    remoteStream,
    connectionState,
    isIncoming,
    isAudioMuted,
    isSpeakerOn,
    callDuration,
    targetUsername,
    callingType,
    formatDuration,
    startCall,
    handleCallEnd,
    toggleMicrophone,
    toggleSpeaker,
  };
};

const createStyle = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#1a1a2e",
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    avatarContainer: {
      marginBottom: 30,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#4a4a6a",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarText: {
      color: "#fff",
      fontSize: 48,
      fontWeight: "bold",
    },
    callerInfo: {
      alignItems: "center",
      marginBottom: 20,
    },
    callerName: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "600",
      marginBottom: 8,
    },
    callStatus: {
      color: "#aaa",
      fontSize: 16,
    },
    callDuration: {
      color: "#4CAF50",
      fontSize: 18,
      fontWeight: "500",
      marginTop: 8,
    },
    controls: {
      position: "absolute",
      bottom: 60,
      left: 0,
      right: 0,
      paddingHorizontal: 40,
    },
    controlsRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
    },
    controlButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    controlButtonActive: {
      backgroundColor: "#fff",
    },
    controlButtonDanger: {
      backgroundColor: "#FF3B30",
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    waveContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      height: 40,
    },
    waveBar: {
      width: 4,
      marginHorizontal: 3,
      backgroundColor: "#4CAF50",
      borderRadius: 2,
    },
    connectionStatus: {
      position: "absolute",
      top: 100,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    connectionStatusBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    connectionStatusText: {
      color: "#fff",
      fontSize: 14,
    },
  });
