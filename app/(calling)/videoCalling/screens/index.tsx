import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { RTCView } from "react-native-webrtc";

import { Icon, ThemedText } from "@/components";

import { useVideoCalling } from "../hooks";

export default function VideoCallingScreen() {
  const {
    styles,
    loading,
    localStream,
    remoteStream,
    connectionState,
    isIncoming,
    isVideoCall,
    isAudioMuted,
    isVideoOff,
    isRemoteVideoEnabled,
    targetUsername,
    handleCallEnd,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
  } = useVideoCalling();

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

      {/* Remote Video - Full Screen Background */}
      {isVideoCall && remoteStream && isConnected && isRemoteVideoEnabled ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.waitingContainer}>
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>
              {targetUsername?.charAt(0).toUpperCase() || "?"}
            </ThemedText>
          </View>
          <ThemedText style={styles.waitingText}>
            {getConnectionStatusText()}
          </ThemedText>
          <ThemedText style={styles.targetUsername}>
            {targetUsername}
          </ThemedText>
        </View>
      )}

      {/* Connection Status Badge */}
      {isConnected && (
        <View style={styles.connectionStatus}>
          <ThemedText style={styles.connectionStatusText}>
            {getConnectionStatusText()}
          </ThemedText>
        </View>
      )}

      {/* Local Video - Picture in Picture */}
      {isVideoCall && localStream && !isVideoOff && (
        <View style={styles.localVideo}>
          <RTCView
            streamURL={localStream.toURL()}
            style={{ flex: 1 }}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Local Video Disabled Placeholder */}
      {isVideoCall && isVideoOff && (
        <View style={styles.localVideoDisabled}>
          <Icon name="video-slash" type="fontawesome5" color="#fff" size={24} />
        </View>
      )}

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

          {/* Camera Toggle - Only for Video Calls */}
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

          {/* Switch Camera - Only for Video Calls */}
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

      {/* Debug Info - Can be removed in production */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <ThemedText style={styles.debugText}>
            Role: {isIncoming ? "Callee" : "Caller"}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            State: {connectionState}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Local: {localStream ? "OK" : "-"} | Remote:{" "}
            {remoteStream ? "OK" : "-"}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Audio: {isAudioMuted ? "Muted" : "On"} | Video:{" "}
            {isVideoOff ? "Off" : "On"}
          </ThemedText>
        </View>
      )}
    </View>
  );
}
