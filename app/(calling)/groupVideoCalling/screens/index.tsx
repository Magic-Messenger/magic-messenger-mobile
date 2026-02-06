import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Icon, PermissionDeniedModal, ThemedText } from "@/components";

import { DraggableLocalVideo } from "../../videoCalling/components/DraggableLocalVideo";
import { ParticipantGrid } from "../components/ParticipantGrid";
import { useGroupVideoCalling } from "../hooks/useGroupVideoCalling";

export default function GroupVideoCallingScreen() {
  const {
    styles,
    loading,
    isVideoCall,
    isAudioMuted,
    isVideoOff,
    isFrontCamera,
    isSwitchingCamera,
    participants,
    localStream,
    groupName,
    isLocalVideoEnabled,
    handleCallEnd,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    // Permission handling
    permissionDenied,
    deniedPermissionType,
    handlePermissionModalClose,
    handleOpenSettings,
  } = useGroupVideoCalling();

  const participantCount = participants.size + 1; // +1 for local user

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
      <View style={styles.gridContainer}>
        <ParticipantGrid participants={participants} />
      </View>

      {/* Header - Absolute Overlay */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <ThemedText style={styles.groupName}>{groupName}</ThemedText>
          <ThemedText style={styles.participantCount}>
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </ThemedText>
        </View>
      </View>

      {/* Local Video - Draggable PiP (like normal 1:1 call) */}
      {isVideoCall && localStream && !isVideoOff && (
        <DraggableLocalVideo
          localStream={localStream}
          localVideoKey={0}
          isFrontCamera={isFrontCamera}
          isSwitchingCamera={isSwitchingCamera}
        />
      )}

      {/* Local Video Disabled Placeholder */}
      {isVideoCall && isVideoOff && (
        <View style={styles.localVideoDisabled}>
          <Icon name="video-slash" type="fontawesome5" color="#fff" size={24} />
        </View>
      )}

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

          {/* Camera Toggle */}
          {isVideoCall && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                isVideoOff && styles.controlButtonActive,
              ]}
              onPress={toggleCamera}
              activeOpacity={0.7}
            >
              <Icon
                name={isVideoOff ? "video-slash" : "video"}
                type="fontawesome5"
                color={isVideoOff ? "#000" : "#fff"}
                size={22}
              />
            </TouchableOpacity>
          )}

          {/* Switch Camera */}
          {isVideoCall && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                isVideoOff && styles.controlButtonDisabled,
              ]}
              onPress={switchCamera}
              activeOpacity={0.7}
              disabled={isVideoOff}
            >
              <Icon
                name="camera-reverse"
                type="ionicons"
                color="#fff"
                size={26}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
