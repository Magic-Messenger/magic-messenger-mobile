import React from "react";
import { View } from "react-native";
import { RTCView } from "react-native-webrtc";

import { AppLayout, Button, ThemedText } from "@/components";

import { useVideoCalling } from "../hooks";

export default function VideoCallingScreen() {
  const {
    t,
    styles,
    loading,
    localStream,
    remoteStream,
    connectionState,
    isIncoming,
    startCall,
    handleCallEnd,
  } = useVideoCalling();

  return (
    <AppLayout
      container
      title={"Video Calling"}
      showBadge={false}
      loading={loading}
    >
      <View style={styles.container}>
        {/* Remote Video */}
        {remoteStream && (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        )}

        {/* Local Video */}
        {localStream && (
          <>
            <View style={styles.waitingContainer}>
              <ThemedText style={styles.waitingText}>
                {isIncoming ? "Connecting..." : "Calling..."}
              </ThemedText>
              <ThemedText style={styles.stateText}>
                State: {connectionState}
              </ThemedText>
            </View>

            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
            />
          </>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/*   <Button
            type="primary"
            label="Start Call"
            onPress={() =>
              startCall({
                targetUsername: "omer-call",
                callingType: "Video",
              })
            }
          /> */}
          <Button type="danger" label="End Call" onPress={handleCallEnd} />
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
