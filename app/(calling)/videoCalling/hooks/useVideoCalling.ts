import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import WebRTCService from "@/services/webRTC/webRTCService";
import { useSignalRStore, useWebRTCStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { trackEvent } from "@/utils";

export const useVideoCalling = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);

  const setLocalStream = useWebRTCStore((s) => s.setLocalStream);
  const setRemoteStream = useWebRTCStore((s) => s.setRemoteStream);

  const startCall = async () => {
    // 1. Fetch ICE servers first
    await WebRTCService.fetchIceServers();

    // 2. Get local stream
    const stream = await WebRTCService.getLocalStream();
    setLocalStream(stream);

    // 3. Create peer connection
    await WebRTCService.createPeerConnection(
      (remoteStream) => setRemoteStream(remoteStream),
      (candidate) => {
        magicHubClient?.sendIceCandidate({
          targetUsername: "omer-test",
          candidate: JSON.stringify(candidate),
        });
      },
      (state) => trackEvent("Connection state:", state),
    );

    const offer = await WebRTCService.createOffer();
    await magicHubClient?.callUser({
      targetUsername: "omer-test",
      offer: JSON.stringify(offer),
    });
  };

  return {
    t,
    styles,
    localStream,
    remoteStream,
    startCall,
  };
};

const createStyle = () =>
  StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    localVideo: {
      width: 150,
      height: 200,
      position: "absolute",
      top: 200,
      right: 20,
    },
    remoteVideo: { flex: 1 },
  });
