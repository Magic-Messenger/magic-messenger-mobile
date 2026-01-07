import { Audio } from "expo-av";
import { router } from "expo-router";
import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CallingType } from "@/api/models";
import { useWebRTCStore } from "@/store";

import { Icon } from "../../ui";
import { ThemedText } from "../ThemedText";

export const IncomingCallModal = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const incomingCallData = useWebRTCStore((s) => s.incomingCallData);
  const connectionState = useWebRTCStore((s) => s.connectionState);
  const isSwitchingCall = useWebRTCStore((s) => s.isSwitchingCall);
  const isCaller = useWebRTCStore((s) => s.isCaller);
  const isIncoming = useWebRTCStore((s) => s.isIncoming);
  const acceptIncomingCall = useWebRTCStore((s) => s.acceptIncomingCall);
  const declineIncomingCall = useWebRTCStore((s) => s.declineIncomingCall);
  const endCall = useWebRTCStore((s) => s.endCall);
  const setIsSwitchingCall = useWebRTCStore((s) => s.setIsSwitchingCall);

  // Check if user is in an active call
  // - "connected" or "connecting" means call is in progress
  // - "new" with isCaller/isIncoming means call just started (before WebRTC connects)
  const isInActiveCall = useMemo(
    () =>
      connectionState === "connected" ||
      connectionState === "connecting" ||
      (connectionState === "new" && (isCaller || isIncoming)),
    [connectionState, isCaller, isIncoming],
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Memoize call data calculations
  const isVideoCall = useMemo(
    () => incomingCallData?.callingType === CallingType.Video,
    [incomingCallData?.callingType],
  );

  const callerInitial = useMemo(
    () => incomingCallData?.callerUsername?.charAt(0)?.toUpperCase?.() ?? "",
    [incomingCallData?.callerUsername],
  );

  // Play ringtone when incoming call
  useEffect(() => {
    const playRingtone = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/ringtone.mp3"),
          {
            isLooping: true,
            volume: 1.0,
          },
        );

        soundRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.error("Failed to play ringtone:", error);
      }
    };

    const stopRingtone = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        } catch (error) {
          console.error("Failed to stop ringtone:", error);
        }
      }
    };

    if (incomingCallData) {
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [incomingCallData]);

  // Separate pulse animation effect
  useEffect(() => {
    if (incomingCallData) {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );

      pulseAnimRef.current = pulse;
      pulse.start();

      return () => {
        pulse.stop();
        pulseAnimRef.current = null;
      };
    }
  }, [incomingCallData, pulseAnim]);

  const handleAccept = useCallback(async () => {
    if (!incomingCallData) return;

    // Store call data locally before any state changes
    const callerUsername = incomingCallData.callerUsername;
    const callingType = incomingCallData.callingType;

    const pathname =
      callingType === CallingType.Audio
        ? "/(calling)/audioCalling/screens"
        : "/(calling)/videoCalling/screens";

    // If in active call, handle transition
    if (isInActiveCall) {
      // Set flag to prevent auto-close in call screens
      setIsSwitchingCall(true);

      // Navigate immediately with switchingCall flag
      // The new screen will handle cleanup and accept
      router.replace({
        pathname,
        params: {
          targetUsername: callerUsername,
          callingType,
          mode: "answer",
          switching: "true",
        },
      });
    } else {
      // Normal flow - not in active call
      await acceptIncomingCall();

      startTransition(() => {
        router.push({
          pathname,
          params: {
            targetUsername: callerUsername,
            callingType,
            mode: "answer",
          },
        });
      });
    }
  }, [incomingCallData, isInActiveCall, endCall, setIsSwitchingCall]);

  const handleDecline = useCallback(() => {
    declineIncomingCall();
  }, [declineIncomingCall]);

  // Don't show modal/banner if no incoming call or if we're currently switching calls
  if (!incomingCallData || isSwitchingCall) return null;

  // Show banner when user is in active call
  if (isInActiveCall) {
    return (
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            top: insets.top + 10,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.bannerContent}>
          {/* Caller Avatar */}
          <View style={styles.bannerAvatar}>
            <ThemedText style={styles.bannerAvatarText}>
              {callerInitial}
            </ThemedText>
          </View>

          {/* Caller Info */}
          <View style={styles.bannerInfo}>
            <ThemedText style={styles.bannerCallerName} numberOfLines={1}>
              {incomingCallData.callerUsername}
            </ThemedText>
            <ThemedText style={styles.bannerCallType}>
              {t("incomingCall.incoming")}{" "}
              {isVideoCall ? t("common.video") : t("common.audio")}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={styles.bannerButtons}>
            {/* Decline Button */}
            <TouchableOpacity
              style={[styles.bannerButton, styles.bannerDeclineButton]}
              onPress={handleDecline}
              activeOpacity={0.7}
            >
              <Icon name="phone" type="fontawesome5" color="#fff" size={16} />
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.bannerButton, styles.bannerAcceptButton]}
              onPress={handleAccept}
              activeOpacity={0.7}
            >
              <Icon
                name={isVideoCall ? "video" : "phone"}
                type="fontawesome5"
                color="#fff"
                size={16}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Show full modal when not in active call
  return (
    <Modal
      visible={!!incomingCallData}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Avatar with pulse animation */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{callerInitial}</ThemedText>
            </View>
          </Animated.View>

          {/* Caller Info */}
          <ThemedText style={styles.callerName}>
            {incomingCallData.callerUsername}
          </ThemedText>
          <ThemedText style={styles.callType}>
            {t("incomingCall.incoming")}{" "}
            {isVideoCall ? t("common.video") : t("common.audio")}{" "}
            {t("incomingCall.call")}
          </ThemedText>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Decline Button */}
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.7}
            >
              <Icon name="phone" type="fontawesome5" color="#fff" size={28} />
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              activeOpacity={0.7}
            >
              <Icon
                name={isVideoCall ? "video" : "phone"}
                type="fontawesome5"
                color="#fff"
                size={28}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Banner styles (for active call)
  bannerContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 50, 0.95)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4a4a6a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  bannerInfo: {
    flex: 1,
    marginRight: 12,
  },
  bannerCallerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bannerCallType: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  bannerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  bannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerDeclineButton: {
    backgroundColor: "#FF3B30",
    transform: [{ rotate: "135deg" }],
  },
  bannerAcceptButton: {
    backgroundColor: "#34C759",
  },

  // Full modal styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4a4a6a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  callerName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
  },
  callType: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 48,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#FF3B30",
    transform: [{ rotate: "135deg" }],
  },
  acceptButton: {
    backgroundColor: "#34C759",
  },
});
