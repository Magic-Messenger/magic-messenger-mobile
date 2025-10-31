import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useWebRTCStore } from "@/store";
import { useThemedStyles } from "@/theme";

export const useVideoCalling = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const connectionState = useWebRTCStore((s) => s.connectionState);
  const isIncoming = useWebRTCStore((s) => s.isIncoming);

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);

  const startCall = useWebRTCStore((s) => s.startCall);
  const endCall = useWebRTCStore((s) => s.endCall);

  return {
    t,
    styles,
    localStream,
    remoteStream,
    connectionState,
    isIncoming,
    startCall,
    endCall,
  };
};

const createStyle = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    remoteVideo: { flex: 1 },
    localVideo: {
      width: 120,
      height: 160,
      position: "absolute",
      top: 60,
      right: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#fff",
    },
    waitingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    waitingText: { color: "#fff", fontSize: 18 },
    stateText: { color: "#888", fontSize: 14, marginTop: 10 },
    controls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    debugInfo: {
      position: "absolute",
      top: 40,
      left: 20,
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: 10,
      borderRadius: 5,
    },
    debugText: { color: "#fff", fontSize: 12 },
  });
