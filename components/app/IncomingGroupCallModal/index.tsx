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
import { useGroupWebRTCStore } from "@/store";
import { trackEvent } from "@/utils";

import { Icon } from "../../ui";
import { ThemedText } from "../ThemedText";

export const IncomingGroupCallModal = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const incomingGroupCallData = useGroupWebRTCStore(
    (s) => s.incomingGroupCallData,
  );
  const isInGroupCall = useGroupWebRTCStore((s) => s.isInGroupCall);
  const acceptGroupCall = useGroupWebRTCStore((s) => s.acceptGroupCall);
  const declineGroupCall = useGroupWebRTCStore((s) => s.declineGroupCall);

  // Debug log when modal should show
  useEffect(() => {
    if (incomingGroupCallData) {
      trackEvent("[IncomingGroupCallModal] Modal should be visible", {
        callId: incomingGroupCallData.callId,
        groupName: incomingGroupCallData.groupName,
        callerUsername: incomingGroupCallData.callerUsername,
        callingType: incomingGroupCallData.callingType,
      });
    }
  }, [incomingGroupCallData]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Memoize call data calculations
  const isVideoCall = useMemo(
    () => incomingGroupCallData?.callingType === CallingType.Video,
    [incomingGroupCallData?.callingType],
  );

  const groupInitial = useMemo(
    () => incomingGroupCallData?.groupName?.charAt(0)?.toUpperCase?.() ?? "G",
    [incomingGroupCallData?.groupName],
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

    if (incomingGroupCallData) {
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [incomingGroupCallData]);

  // Separate pulse animation effect
  useEffect(() => {
    if (incomingGroupCallData) {
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
  }, [incomingGroupCallData, pulseAnim]);

  const handleAccept = useCallback(async () => {
    if (!incomingGroupCallData) return;

    const groupName = incomingGroupCallData.groupName;
    const callingType = incomingGroupCallData.callingType;

    const pathname =
      callingType === CallingType.Audio
        ? "/(calling)/groupAudioCalling/screens"
        : "/(calling)/groupVideoCalling/screens";

    trackEvent("[IncomingGroupCallModal] Accepting call", {
      groupName,
      callingType,
      pathname,
    });

    // Accept the call and navigate
    await acceptGroupCall();

    trackEvent("[IncomingGroupCallModal] Navigating to", { pathname });

    startTransition(() => {
      router.push({
        pathname,
        params: {
          groupName,
          callingType,
          mode: "answer",
        },
      });
    });
  }, [incomingGroupCallData, acceptGroupCall]);

  const handleDecline = useCallback(() => {
    declineGroupCall();
  }, [declineGroupCall]);

  // Don't show modal if no incoming call or already in group call
  if (!incomingGroupCallData || isInGroupCall) return null;

  // Show full modal for incoming group call
  return (
    <Modal
      visible={!!incomingGroupCallData}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Group Icon with pulse animation */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.avatar}>
              <Icon name="users" type="fontawesome5" color="#fff" size={48} />
            </View>
          </Animated.View>

          {/* Group Info */}
          <ThemedText style={styles.groupName}>
            {incomingGroupCallData.groupName}
          </ThemedText>
          <ThemedText style={styles.callerInfo}>
            {incomingGroupCallData.callerUsername}{" "}
            {t("incomingCall.startedCall", { defaultValue: "started a call" })}
          </ThemedText>
          <ThemedText style={styles.callType}>
            {t("incomingCall.groupCall", { defaultValue: "Group" })}{" "}
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
    backgroundColor: "#6B5CE7",
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
  groupName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  callerInfo: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  callType: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 48,
    textAlign: "center",
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
