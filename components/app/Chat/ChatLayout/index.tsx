import React from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
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
        {header}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {children}
          {footer}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyle = () =>
  StyleSheet.create({
    gradient: {
      flex: 1,
      position: "relative",
    },
    imageBackground: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      opacity: 0.1,
      height: "60%",
    },
    container: {
      flex: 1,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
  });
