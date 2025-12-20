import React from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { RTCView } from "react-native-webrtc";

import { MediaStream } from "@/services/webRTC";
import { heightPixel, widthPixel } from "@/utils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const VIDEO_WIDTH = widthPixel(120);
const VIDEO_HEIGHT = heightPixel(160);
const PADDING = 20;
const INITIAL_TOP = 60;

// Boundaries for dragging
const MIN_X = PADDING;
const MAX_X = SCREEN_WIDTH - VIDEO_WIDTH - PADDING;
const MIN_Y = PADDING;
const MAX_Y = SCREEN_HEIGHT - VIDEO_HEIGHT - 150; // Leave space for controls

interface DraggableLocalVideoProps {
  localStream: MediaStream;
  localVideoKey: number;
  isFrontCamera: boolean;
  isSwitchingCamera: boolean;
}

export const DraggableLocalVideo: React.FC<DraggableLocalVideoProps> = ({
  localStream,
  localVideoKey,
  isFrontCamera,
  isSwitchingCamera,
}) => {
  // Initial position (top-right)
  const translateX = useSharedValue(MAX_X);
  const translateY = useSharedValue(INITIAL_TOP);

  // Context to track starting position
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Calculate new position
      let newX = contextX.value + event.translationX;
      let newY = contextY.value + event.translationY;

      // Clamp to boundaries
      newX = Math.max(MIN_X, Math.min(MAX_X, newX));
      newY = Math.max(MIN_Y, Math.min(MAX_Y, newY));

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      // Snap to nearest edge (left or right)
      const snapToRight = translateX.value > SCREEN_WIDTH / 2 - VIDEO_WIDTH / 2;
      translateX.value = withSpring(snapToRight ? MAX_X : MIN_X, {
        damping: 20,
        stiffness: 200,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.videoWrapper}>
          {isSwitchingCamera ? (
            <View style={styles.switchingContainer}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <RTCView
              key={`local-video-${localVideoKey}`}
              streamURL={localStream.toURL()}
              style={styles.video}
              objectFit="cover"
              mirror={isFrontCamera}
            />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const BORDER_RADIUS = widthPixel(10);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    borderRadius: BORDER_RADIUS + 2,
    borderWidth: 2,
    borderColor: "#fff",
    // Shadow for depth effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
  },
  video: {
    flex: 1,
  },
  switchingContainer: {
    flex: 1,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
});
