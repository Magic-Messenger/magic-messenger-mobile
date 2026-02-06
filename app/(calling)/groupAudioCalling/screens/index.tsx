import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Icon, PermissionDeniedModal, ThemedText } from "@/components";
import { GroupParticipant } from "@/store/groupWebRTCStore";

import { useGroupAudioCalling } from "../hooks/useGroupAudioCalling";

// Audio wave animation component
const AudioWave: React.FC<{ isActive: boolean; color: string }> = ({
  isActive,
  color,
}) => {
  const bars = [
    useRef(new Animated.Value(20)).current,
    useRef(new Animated.Value(30)).current,
    useRef(new Animated.Value(15)).current,
    useRef(new Animated.Value(25)).current,
    useRef(new Animated.Value(20)).current,
  ];

  useEffect(() => {
    if (isActive) {
      const animations = bars.map((bar, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 40 + Math.random() * 20,
              duration: 300 + index * 50,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 10 + Math.random() * 15,
              duration: 300 + index * 50,
              useNativeDriver: false,
            }),
          ]),
        ),
      );

      animations.forEach((anim) => anim.start());

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    } else {
      bars.forEach((bar) => bar.setValue(20));
    }
  }, [isActive]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        height: 40,
        gap: 3,
      }}
    >
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={{
            width: 3,
            height: bar,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
};

// Remote participant tile for audio calls
const AudioParticipantTile: React.FC<{
  participant: GroupParticipant;
}> = ({ participant }) => {
  const isConnecting =
    participant.connectionState === "new" ||
    participant.connectionState === "connecting";

  return (
    <View style={tileStyles.tile}>
      <View style={tileStyles.content}>
        <View style={tileStyles.avatar}>
          <ThemedText style={tileStyles.avatarText}>
            {participant.username.charAt(0).toUpperCase()}
          </ThemedText>
          {!participant.isAudioEnabled && (
            <View style={tileStyles.mutedBadge}>
              <Icon
                name="microphone-slash"
                type="fontawesome5"
                color="#fff"
                size={10}
              />
            </View>
          )}
        </View>
        <ThemedText style={tileStyles.name} numberOfLines={1}>
          {participant.username}
        </ThemedText>
        {isConnecting ? (
          <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
        ) : (
          <AudioWave isActive={participant.isAudioEnabled} color="#8B5CF6" />
        )}
      </View>
    </View>
  );
};

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    margin: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  name: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 120,
  },
  mutedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    padding: 4,
  },
});

export default function GroupAudioCallingScreen() {
  const {
    styles,
    loading,
    isAudioMuted,
    isSpeakerOn,
    participants,
    currentUsername,
    groupName,
    isLocalAudioEnabled,
    handleCallEnd,
    toggleMicrophone,
    toggleSpeaker,
    // Permission handling
    permissionDenied,
    deniedPermissionType,
    handlePermissionModalClose,
    handleOpenSettings,
  } = useGroupAudioCalling();

  const participantCount = participants.size + 1; // +1 for local user

  const remoteParticipants = useMemo(
    () => Array.from(participants.values()),
    [participants],
  );

  const remoteCount = remoteParticipants.length;

  if (loading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>
            Starting group call...
          </ThemedText>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Render the remote participants grid
  const renderRemoteGrid = () => {
    if (remoteCount === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Waiting for participants...
          </ThemedText>
        </View>
      );
    }

    // 1-3 remote participants: vertical stack
    if (remoteCount <= 3) {
      return (
        <View style={styles.gridContainer}>
          {remoteParticipants.map((participant) => (
            <AudioParticipantTile
              key={participant.username}
              participant={participant}
            />
          ))}
        </View>
      );
    }

    // 4+ remote participants: grid with rows
    const columns = remoteCount <= 4 ? 2 : 3;
    const rows = Math.ceil(remoteCount / columns);

    return (
      <View style={styles.gridContainer}>
        {Array.from({ length: rows }, (_, rowIndex) => {
          const rowParticipants = remoteParticipants.slice(
            rowIndex * columns,
            (rowIndex + 1) * columns,
          );
          return (
            <View key={rowIndex} style={styles.gridRow}>
              {rowParticipants.map((participant) => (
                <AudioParticipantTile
                  key={participant.username}
                  participant={participant}
                />
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        visible={permissionDenied}
        permissionType={deniedPermissionType}
        onOpenSettings={handleOpenSettings}
        onClose={handlePermissionModalClose}
      />

      {/* Remote Participants - Full Screen Dynamic Grid */}
      {renderRemoteGrid()}

      {/* Header - Absolute Overlay */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <ThemedText style={styles.groupName}>{groupName}</ThemedText>
          <ThemedText style={styles.participantCount}>
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </ThemedText>
        </View>
      </View>

      {/* Local User - Floating Avatar (like PiP in video calls) */}
      <View style={styles.localAvatarContainer}>
        <View style={styles.localAvatar}>
          <ThemedText style={styles.localAvatarText}>
            {currentUsername.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={styles.localAvatarName}>You</ThemedText>
        {isAudioMuted && (
          <View style={styles.localMutedBadge}>
            <Icon
              name="microphone-slash"
              type="fontawesome5"
              color="#fff"
              size={10}
            />
          </View>
        )}
      </View>

      {/* Controls - Absolute Overlay */}
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
              size={22}
            />
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonDanger]}
            onPress={handleCallEnd}
            activeOpacity={0.7}
          >
            <Icon name="phone" type="fontawesome5" color="#fff" size={22} />
          </TouchableOpacity>

          {/* Speaker Toggle */}
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
              size={22}
            />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
