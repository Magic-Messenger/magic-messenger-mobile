import React from "react";
import { View } from "react-native";
import { RTCView } from "react-native-webrtc";

import { AppLayout, Button, ThemedText } from "@/components";

import { useVideoCalling } from "../hooks";

export default function VideoCallingScreen() {
  const { t, styles, localStream, remoteStream, startCall } = useVideoCalling();

  return (
    <AppLayout container title={"Video Calling"} showBadge={false}>
      <View>
        <ThemedText weight="semiBold" style={styles.pt2}>
          {t("login.userName", {
            userName: "Mahmut Tuncer",
          })}
        </ThemedText>
      </View>

      <View style={styles.container}>
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        )}
        {remoteStream && (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
          />
        )}

        <Button type="primary" label={"Start Call"} onPress={startCall} />
      </View>
    </AppLayout>
  );
}
