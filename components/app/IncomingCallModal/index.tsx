import { Audio } from "expo-av";
import { router } from "expo-router";
import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { CallingType } from "@/api/models";
import { useWebRTCStore } from "@/store";

import { Icon } from "../../ui";
import { ThemedText } from "../ThemedText";

export const IncomingCallModal = () => {
  const incomingCallData = useWebRTCStore((s) => s.incomingCallData);
  const acceptIncomingCall = useWebRTCStore((s) => s.acceptIncomingCall);
  const declineIncomingCall = useWebRTCStore((s) => s.declineIncomingCall);

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
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
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

    const { callerUsername, callingType } = incomingCallData;

    await acceptIncomingCall();

    const pathname =
      callingType === CallingType.Audio
        ? "/(calling)/audioCalling/screens"
        : "/(calling)/videoCalling/screens";

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
  }, [incomingCallData, acceptIncomingCall]);

  const handleDecline = useCallback(() => {
    declineIncomingCall();
  }, [declineIncomingCall]);

  if (!incomingCallData) return null;

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
            Incoming {isVideoCall ? "Video" : "Audio"} Call
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
