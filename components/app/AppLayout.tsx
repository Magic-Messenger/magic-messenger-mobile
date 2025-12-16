import React, { memo, useMemo } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Colors, Images, spacing } from "@/constants";
import { useThemedStyles } from "@/theme";

import { needsBottomSafeArea, spacingPixel } from "../../utils/pixelHelper";
import { GradientBackground } from "../ui/GradientBackground";
import { ThemedText } from "./ThemedText";
import { TorBadge } from "./TorBadge";

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  container?: boolean;
  footer?: React.ReactNode;
  safeAreaBottom?: boolean;
  safeAreaPadding?: boolean;
  loading?: boolean;
  title?: string | React.ReactNode;
  showBadge?: boolean;
  keyboardAvoiding?: boolean;
}

function AppLayout({
  children,
  loading = false,
  container = false,
  scrollable = false,
  safeAreaBottom,
  safeAreaPadding = true,
  title,
  showBadge = true,
  footer,
  keyboardAvoiding = false,
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(createStyle);

  const shouldApplyBottomSafeArea = useMemo(() => {
    if (safeAreaBottom !== undefined) {
      return safeAreaBottom;
    }
    return needsBottomSafeArea() || insets.bottom > 0;
  }, [safeAreaBottom, insets.bottom]);

  // Memoize container type to prevent unnecessary re-renders
  const Container: React.ElementType = useMemo(() => {
    if (keyboardAvoiding) return KeyboardAwareScrollView;
    if (scrollable) return ScrollView;
    return View;
  }, [keyboardAvoiding, scrollable]);

  // Memoize container props to prevent unnecessary re-renders
  const containerProps = useMemo(() => {
    const baseContentStyle = [
      styles.content,
      safeAreaPadding ? styles.contentPadding : undefined,
    ];

    if (keyboardAvoiding) {
      return {
        enableOnAndroid: true,
        enableAutomaticScroll: true,
        keyboardShouldPersistTaps: "handled" as const,
        contentContainerStyle: baseContentStyle,
        showsVerticalScrollIndicator: false,
        showsHorizontalScrollIndicator: false,
        bounces: false,
        overScrollMode: "never" as const,
      };
    }

    if (scrollable) {
      return {
        contentContainerStyle: baseContentStyle,
        keyboardShouldPersistTaps: "handled" as const,
        showsVerticalScrollIndicator: false,
        showsHorizontalScrollIndicator: false,
        bounces: false,
        overScrollMode: "never" as const,
      };
    }

    return { style: baseContentStyle };
  }, [
    keyboardAvoiding,
    scrollable,
    styles.content,
    styles.contentPadding,
    safeAreaPadding,
    shouldApplyBottomSafeArea,
    insets.bottom,
  ]);

  return (
    <View style={styles.wrapper}>
      <GradientBackground
        colors={Colors.backgroundColor as never}
        style={[styles.gradient, container ? styles.container : undefined]}
      >
        <ImageBackground
          source={Images.backgroundImage}
          style={styles.imageBackground}
          resizeMode="cover"
        />
        <SafeAreaView
          style={styles.safeArea}
          edges={
            shouldApplyBottomSafeArea || !!footer
              ? ["top", "left", "right", "bottom"]
              : ["top", "left", "right"]
          }
        >
          <Container {...containerProps}>
            <Animated.View
              pointerEvents={showBadge ? "auto" : "none"}
              style={[
                styles.header,
                !showBadge && styles.headerHidden,
                !container && styles.container,
              ]}
            >
              {typeof title === "string" ? (
                <ThemedText type="title" weight="semiBold">
                  {title}
                </ThemedText>
              ) : (
                title
              )}

              <View style={styles.headerRight}>
                <TorBadge />
              </View>
            </Animated.View>

            {children}
          </Container>

          {footer && (
            <View
              style={{
                paddingTop: spacingPixel(16),
                paddingBottom: shouldApplyBottomSafeArea ? spacingPixel(16) : 0,
              }}
            >
              {footer}
            </View>
          )}
        </SafeAreaView>
      </GradientBackground>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const createStyle = () =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
    },
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
    contentPadding: {
      ...spacing({
        pt: 45,
      }),
    },
    container: {
      ...spacing({
        pl: 20,
        pr: 20,
      }),
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacingPixel(8),
      marginBottom: spacingPixel(20),
    },
    headerHidden: {
      height: 0,
      display: "none",
      overflow: "hidden",
    },
    headerRight: {
      flex: 1,
      alignItems: "flex-end",
    },
  });

export default memo(AppLayout);
