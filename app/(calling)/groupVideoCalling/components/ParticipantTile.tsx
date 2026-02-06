import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RTCView } from "react-native-webrtc";

import { Icon, ThemedText } from "@/components";
import { GroupParticipant } from "@/store/groupWebRTCStore";
import { ColorDto, useThemedStyles } from "@/theme";

interface ParticipantTileProps {
  participant: GroupParticipant;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
}) => {
  const styles = useThemedStyles(createStyles);

  const { stream, isVideoEnabled, isAudioEnabled, connectionState, username } =
    participant;

  const isConnecting =
    connectionState === "new" || connectionState === "connecting";

  const hasEnabledVideoTrack = useMemo(() => {
    if (!stream) return false;
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks.some((t) => t.enabled);
  }, [stream]);

  const shouldShowVideo = stream && isVideoEnabled && hasEnabledVideoTrack;

  return (
    <View style={styles.tile}>
      {shouldShowVideo ? (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.video}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.avatarContainer}>
          <ThemedText style={styles.avatarText}>
            {username.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      )}

      {/* Participant name badge */}
      <View style={styles.nameBadge}>
        <ThemedText style={styles.nameText} numberOfLines={1}>
          {username}
        </ThemedText>
        {!isAudioEnabled && (
          <Icon
            name="microphone-slash"
            type="fontawesome5"
            color="#ff4444"
            size={12}
          />
        )}
      </View>

      {/* Connection indicator */}
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator color="#fff" size="small" />
          <ThemedText style={styles.connectingText}>Connecting...</ThemedText>
        </View>
      )}

      {/* Video disabled indicator */}
      {!shouldShowVideo && !isConnecting && (
        <View style={styles.videoDisabledBadge}>
          <Icon name="video-slash" type="fontawesome5" color="#fff" size={16} />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#333",
      margin: 2,
    },
    video: {
      flex: 1,
    },
    avatarContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#444",
    },
    avatarText: {
      color: "#fff",
      fontSize: 42,
      fontWeight: "bold",
    },
    nameBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      right: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    nameText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "500",
      flex: 1,
    },
    connectingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    connectingText: {
      color: "#fff",
      fontSize: 12,
      marginTop: 8,
    },
    videoDisabledBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: 6,
      borderRadius: 4,
    },
  });
