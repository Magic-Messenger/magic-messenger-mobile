import { Colors, Images, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
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
  const styles = useThemedStyles(createStyle);

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
              styles.flex,
              styles.alignItemsCenter,
              styles.justifyContentCenter,
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
                    styles.flexRow,
                    styles.alignItemsCenter,
                    styles.mt2,
                    styles.mb5,
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
                      styles.flex,
                      styles.justifyContentEnd,
                      styles.alignItemsEnd,
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

const createStyle = (colors: ColorDto) =>
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
