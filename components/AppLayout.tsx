import { Colors, Images } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function AppLayout({ children, scrollable = false }: AppLayoutProps) {
  const Container = scrollable ? ScrollView : View;

  return (
    <LinearGradient
      colors={Colors.backgroundColor as never}
      style={styles.gradient}
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
});
