import { Colors, commonStyle, Images, spacing } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { TorBadge } from "./TorBadge";

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  container?: boolean;
  footer?: React.ReactNode;
  safeAreaPadding?: boolean;
  loading?: boolean;
  title?: string | React.ReactNode;
  showBadge?: boolean;
}

export function AppLayout({
  children,
  loading = false,
  container = false,
  scrollable = false,
  safeAreaPadding = true,
  title,
  showBadge = true,
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
      <SafeAreaView
        style={[
          styles.safeArea,
          safeAreaPadding ? { ...spacing({ mt: 45 }) } : undefined,
        ]}
      >
        {loading ? (
          <View
            style={[
              commonStyle.flex,
              commonStyle.alignItemsCenter,
              commonStyle.justifyContentCenter,
            ]}
          >
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <Container
              contentContainerStyle={styles.content}
              style={styles.content}
            >
              {showBadge && (
                <View
                  style={[
                    commonStyle.flexRow,
                    commonStyle.alignItemsCenter,
                    commonStyle.mt2,
                    commonStyle.mb5,
                    !container ? styles.container : undefined,
                  ]}
                >
                  {typeof title === "string" ? (
                    <ThemedText type="title" weight="semiBold">
                      {title}
                    </ThemedText>
                  ) : (
                    title
                  )}

                  <View
                    style={[
                      commonStyle.flex,
                      commonStyle.justifyContentEnd,
                      commonStyle.alignItemsEnd,
                    ]}
                  >
                    <TorBadge />
                  </View>
                </View>
              )}

              {children}
            </Container>
          </>
        )}

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
    position: "relative",
  },
  container: {
    ...spacing({
      pl: 20,
      pr: 20,
    }),
  },
});
