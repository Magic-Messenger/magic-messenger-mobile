import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";
import InCallManager from "react-native-incall-manager";

import { CallingType } from "@/api/models";
import WebRTCService from "@/services/webRTC/webRTCService";
import { StartCallingType, useWebRTCStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { trackEvent } from "@/utils";

export const useAudioCalling = () => {
  const { t } = useTranslation();
  useKeepAwake();
  const styles = useThemedStyles(createStyle);

  const { targetUsername, callingType, mode } = useLocalSearchParams<
    StartCallingType & { mode?: string }
  >();

  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const durationIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const isCallActiveRef = useRef(true); // ✅ Call activity tracker

  const connectionState = useWebRTCStore((s) => s.connectionState);
  const isIncoming = useWebRTCStore((s) => s.isIncoming);
  const isRemoteAudioEnabled = useWebRTCStore((s) => s.isRemoteAudioEnabled);

  const startCall = useWebRTCStore((s) => s.startCall);
  const endCall = useWebRTCStore((s) => s.endCall);
  const setAudioEnabled = useWebRTCStore((s) => s.setAudioEnabled);

  const handleCallEnd = useCallback(() => {
    isCallActiveRef.current = false; // ✅ Mark call as inactive

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    trackEvent("Audio call ended by user", { targetUsername, callDuration });
    endCall();
    router.back();
  }, [endCall, targetUsername, callDuration]);

  const toggleMicrophone = useCallback(() => {
    const newMutedState = !isAudioMuted;
    WebRTCService.toggleAudio(!newMutedState);
    setIsAudioMuted(newMutedState);
    setAudioEnabled(!newMutedState);
    trackEvent("Audio microphone toggled", {
      isMuted: newMutedState,
      targetUsername,
    });
  }, [isAudioMuted, setAudioEnabled, targetUsername]);

  const toggleSpeaker = useCallback(() => {
    const newSpeakerState = !isSpeakerOn;

    try {
      InCallManager.setSpeakerphoneOn(newSpeakerState);
      setIsSpeakerOn(newSpeakerState);
      trackEvent("Speaker toggled", {
        isSpeakerOn: newSpeakerState,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error("Failed to toggle speaker:", error);
      trackEvent("Speaker toggle failed", { error });
    }
  }, [isSpeakerOn]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Setup audio mode for calls using InCallManager
  useEffect(() => {
    // Start InCallManager for audio calls (media: false = voice call mode)
    InCallManager.start({ media: "audio" });
    // Default to earpiece for audio calls
    InCallManager.setSpeakerphoneOn(false);
    trackEvent("Audio mode initialized for call with InCallManager");

    return () => {
      // Stop InCallManager on cleanup
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
        callingType: CallingType.Audio,
      }).finally(() => {
        // ✅ Only update state if call is still active
        if (isCallActiveRef.current) {
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      });
    }

    // ✅ Cleanup only clears intervals, doesn't call endCall
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      trackEvent("Audio call cleanup - component unmounting", {
        targetUsername,
        mode,
      });
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
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
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
      // ✅ Only proceed if call is still active
      if (isCallActiveRef.current) {
        trackEvent("Audio call auto-ending", {
          connectionState,
          targetUsername,
          callDuration,
        });
        handleCallEnd();
      }
    }
  }, [connectionState, handleCallEnd, targetUsername, callDuration]);

  return {
    t,
    styles,
    loading,
    connectionState,
    isIncoming,
    isAudioMuted,
    isRemoteAudioEnabled,
    isSpeakerOn,
    callDuration,
    targetUsername,
    callingType,
    formatDuration,
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
    remoteMutedBadge: {
      position: "absolute",
      bottom: -10,
      right: -10,
      backgroundColor: "#FF3B30",
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "#1a1a2e",
    },
  });
