import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { heightPixel, widthPixel } from "../../../utils/pixelHelper";
import { Icon } from "../Icon";

export function VideoPreview({ source = "VideoPreview" }: { source: string }) {
  const [started, setStarted] = useState(false);

  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
  });

  const handlePress = () => {
    player.play();
    setStarted(true);
  };

  if (!source) {
    return null;
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={started}
      />
      {!started && (
        <TouchableOpacity style={styles.overlay} onPress={handlePress}>
          <Icon type="feather" name="play" size={40} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: widthPixel(200), height: heightPixel(200) },
  video: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playText: { fontSize: 50, color: "white" },
});
