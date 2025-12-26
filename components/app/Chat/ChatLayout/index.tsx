import React from "react";
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  KeyboardControllerView,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Images } from "@/constants";
import { useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { GradientBackground } from "../../../ui/GradientBackground";

interface ChatLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const HEADER_PADDING = spacingPixel(50);
const ANDROID_STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 24;

export function ChatLayout({ header, footer, children }: ChatLayoutProps) {
  const styles = useThemedStyles(createStyle);
  const { height } = useReanimatedKeyboardAnimation();
  const insets = useSafeAreaInsets();

  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, ANDROID_STATUS_BAR_HEIGHT)
      : insets.top;

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: -height.value,
  }));

  return (
    <KeyboardControllerView
      style={styles.keyboardController}
      statusBarTranslucent
      preserveEdgeToEdge
    >
      <GradientBackground
        colors={Colors.backgroundColor as never}
        style={styles.gradient}
      >
        <ImageBackground
          source={Images.backgroundImage}
          style={styles.imageBackground}
          resizeMode="cover"
        />
        <View
          style={[
            styles.container,
            {
              paddingTop: topInset + HEADER_PADDING,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          <View style={styles.headerContainer}>{header}</View>

          <Animated.View style={styles.contentContainer}>
            {children}
          </Animated.View>

          <Animated.View style={[styles.footerContainer, footerAnimatedStyle]}>
            {footer}
          </Animated.View>
        </View>
      </GradientBackground>
    </KeyboardControllerView>
  );
}

const createStyle = () =>
  StyleSheet.create({
    keyboardController: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    imageBackground: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.1,
      height: "60%",
    },
    container: {
      flex: 1,
    },
    headerContainer: {
      zIndex: 10,
    },
    contentContainer: {
      flex: 1,
      overflow: "hidden",
    },
    footerContainer: {
      backgroundColor: "transparent",
      overflow: "hidden",
    },
  });
