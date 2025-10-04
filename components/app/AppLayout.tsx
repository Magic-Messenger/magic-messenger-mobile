import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Images, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";

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
  keyboardAvoiding?: boolean;
}

function AppLayout({
  children,
  loading = false,
  container = false,
  scrollable = false,
  safeAreaPadding = true,
  title,
  showBadge = true,
  footer,
  keyboardAvoiding = false,
}: AppLayoutProps) {
  const styles = useThemedStyles(createStyle);

  let Container: React.ElementType = View;

  if (keyboardAvoiding) {
    Container = KeyboardAwareScrollView;
  } else if (scrollable) {
    Container = ScrollView;
  }

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
        <Container
          {...(keyboardAvoiding
            ? {
                enableOnAndroid: true,
                enableAutomaticScroll: true,
                keyboardShouldPersistTaps: "handled",
                contentContainerStyle: styles.content,
                showsVerticalScrollIndicator: false,
                showsHorizontalScrollIndicator: false,
              }
            : scrollable
              ? {
                  contentContainerStyle: styles.content,
                  keyboardShouldPersistTaps: "handled",
                  showsVerticalScrollIndicator: false,
                  showsHorizontalScrollIndicator: false,
                }
              : { style: styles.content })}
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

        {footer && <>{footer}</>}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
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
  });

export default AppLayout;
