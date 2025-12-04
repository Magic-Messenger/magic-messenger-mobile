import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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

export function ChatLayout({ header, footer, children }: ChatLayoutProps) {
  const styles = useThemedStyles(createStyle);
  const { height } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: -height.value,
  }));

  return (
    <GradientBackground
      colors={Colors.backgroundColor as never}
      style={styles.gradient}
    >
      <ImageBackground
        source={Images.backgroundImage}
        style={styles.imageBackground}
        resizeMode="cover"
      />
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.container, { paddingTop: HEADER_PADDING }]}
      >
        <View style={styles.headerContainer}>{header}</View>

        <View style={styles.contentContainer}>{children}</View>

        <Animated.View style={[styles.footerContainer, animatedStyle]}>
          {footer}
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyle = () =>
  StyleSheet.create({
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
    },
    footerContainer: {
      backgroundColor: "transparent",
    },
  });
