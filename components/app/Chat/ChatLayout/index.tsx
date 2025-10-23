import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Images } from "@/constants";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

interface ChatLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function ChatLayout({ header, footer, children }: ChatLayoutProps) {
  const styles = useThemedStyles(createStyle);

  return (
    <LinearGradient
      colors={Colors.backgroundColor as never}
      style={[styles.gradient]}
    >
      <ImageBackground
        source={Images.backgroundImage}
        style={styles.imageBackground}
        resizeMode="cover"
      />
      <SafeAreaView style={{ flex: 1, paddingTop: spacingPixel(50) }}>
        {header ? header : <></>}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {children}
          {footer ? footer : <></>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
  });
