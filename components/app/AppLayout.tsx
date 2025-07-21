import { Colors, Images, spacing } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  container?: boolean;
  footer?: React.ReactNode;
}

export function AppLayout({
  children,
  container = false,
  scrollable = false,
  footer,
}: AppLayoutProps) {
  const Container = scrollable ? ScrollView : View;

  return (
    <LinearGradient
      colors={Colors.backgroundColor as never}
      style={[styles.gradient, container ? styles.container : undefined]}
    >
      <ImageBackground
        source={Images.backgroundImage}
        style={styles.imageBackground}
        resizeMode="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <Container
          contentContainerStyle={styles.content}
          style={styles.content}
        >
          {children}
        </Container>
        {footer && <>{footer}</>}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  container: {
    ...spacing({
      pl: 20,
      pr: 20,
    }),
  },
});
