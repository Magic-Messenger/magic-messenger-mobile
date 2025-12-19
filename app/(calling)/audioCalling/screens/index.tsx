import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  TouchableOpacity,
  View,
} from "react-native";

import { Icon, ThemedText } from "@/components";

import { useAudioCalling } from "../hooks";

const AudioWaveAnimation = ({ isActive }: { isActive: boolean }) => {
  const animations = useRef(
    Array(5)
      .fill(0)
      .map(() => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (isActive) {
      const animateWaves = () => {
        const animationSequence = animations.map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 300 + Math.random() * 200,
                  easing: Easing.ease,
                  useNativeDriver: false,
                }),
                Animated.timing(anim, {
                  toValue: 0.3,
                  duration: 300 + Math.random() * 200,
                  easing: Easing.ease,
                  useNativeDriver: false,
                }),
              ]),
            ),
          ]),
        );
        Animated.parallel(animationSequence).start();
      };
      animateWaves();
    } else {
      animations.forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0.3);
      });
    }
  }, [isActive, animations]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        height: 40,
      }}
    >
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            width: 4,
            marginHorizontal: 3,
            backgroundColor: "#4CAF50",
            borderRadius: 2,
            height: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 40],
            }),
          }}
        />
      ))}
    </View>
  );
};

export default function AudioCallingScreen() {
  const {
    styles,
    loading,
    connectionState,
    isIncoming,
    isAudioMuted,
    isSpeakerOn,
    callDuration,
    targetUsername,
    formatDuration,
    handleCallEnd,
    toggleMicrophone,
    toggleSpeaker,
  } = useAudioCalling();

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case "new":
      case "connecting":
        return isIncoming ? "Connecting..." : "Calling...";
      case "connected":
        return "Connected";
      case "disconnected":
        return "Reconnecting...";
      case "failed":
        return "Connection Failed";
      case "closed":
        return "Call Ended";
      default:
        return connectionState;
    }
  };

  const isConnected = connectionState === "connected";

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator />}
      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={styles.connectionStatusBadge}>
          <ThemedText style={styles.connectionStatusText}>
            {getConnectionStatusText()}
          </ThemedText>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>
              {targetUsername?.charAt(0).toUpperCase() || "?"}
            </ThemedText>
          </View>
        </View>

        {/* Caller Info */}
        <View style={styles.callerInfo}>
          <ThemedText style={styles.callerName}>{targetUsername}</ThemedText>
          <ThemedText style={styles.callStatus}>
            {isConnected ? "In Call" : getConnectionStatusText()}
          </ThemedText>
          {isConnected && (
            <ThemedText style={styles.callDuration}>
              {formatDuration(callDuration)}
            </ThemedText>
          )}
        </View>

        {/* Audio Wave Animation */}
        <AudioWaveAnimation isActive={isConnected && !isAudioMuted} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          {/* Mute/Unmute Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isAudioMuted && styles.controlButtonActive,
            ]}
            onPress={toggleMicrophone}
            activeOpacity={0.7}
          >
            <Icon
              name={isAudioMuted ? "microphone-slash" : "microphone"}
              type="fontawesome5"
              color={isAudioMuted ? "#000" : "#fff"}
              size={24}
            />
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonDanger]}
            onPress={handleCallEnd}
            activeOpacity={0.7}
          >
            <Icon name="phone" type="fontawesome5" color="#fff" size={26} />
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isSpeakerOn && styles.controlButtonActive,
            ]}
            onPress={toggleSpeaker}
            activeOpacity={0.7}
          >
            <Icon
              name={isSpeakerOn ? "volume-up" : "volume-down"}
              type="fontawesome5"
              color={isSpeakerOn ? "#000" : "#fff"}
              size={24}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
