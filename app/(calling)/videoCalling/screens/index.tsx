import React from "react";
import { View } from "react-native";
import { RTCView } from "react-native-webrtc";

import { AppLayout, Button, ThemedText } from "@/components";

import { useVideoCalling } from "../hooks";

export default function VideoCallingScreen() {
  const {
    t,
    styles,
    localStream,
    remoteStream,
    connectionState,
    isIncoming,
    endCall,
  } = useVideoCalling();

  return (
    <AppLayout container title={"Video Calling"} showBadge={false}>
      <View style={styles.container}>
        {/* Remote Video */}
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <View style={styles.waitingContainer}>
            <ThemedText style={styles.waitingText}>
              {isIncoming ? "Connecting..." : "Calling..."}
            </ThemedText>
            <ThemedText style={styles.stateText}>
              State: {connectionState}
            </ThemedText>
          </View>
        )}

        {/* Local Video */}
        {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <Button type="danger" label="End Call" onPress={endCall} />
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <ThemedText style={styles.debugText}>
            Role: {isIncoming ? "Callee" : "Caller"}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            State: {connectionState}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            Local: {localStream ? "✓" : "✗"} | Remote:{" "}
            {remoteStream ? "✓" : "✗"}
          </ThemedText>
        </View>
      </View>
    </AppLayout>
  );
}
