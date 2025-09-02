import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
  keyboardAvoiding?: boolean;
  container?: boolean;
  footer?: React.ReactNode;
  safeAreaPadding?: boolean;
  loading?: boolean;
  title?: string | React.ReactNode;
  showBadge?: boolean;
  // KeyboardAwareScrollView için ek props
  enableOnAndroid?: boolean;
  extraScrollHeight?: number;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

export function AppLayout({
  children,
  loading = false,
  container = false,
  scrollable = false,
  keyboardAvoiding = false,
  safeAreaPadding = true,
  title,
  showBadge = true,
  footer,
  enableOnAndroid = true,
  extraScrollHeight = 0,
  keyboardShouldPersistTaps = "handled",
}: AppLayoutProps) {
  const styles = useThemedStyles(createStyle);

  // KeyboardAware + KeyboardAvoiding kombinasyonu için container seçimi
  const getContainer = () => {
    if (keyboardAvoiding && scrollable) {
      return KeyboardAwareScrollView;
    } else if (scrollable) {
      return ScrollView;
    }
    return View;
  };

  const Container = getContainer();

  // Container props'larını dinamik olarak oluştur
  const getContainerProps = () => {
    const baseProps: any = {};

    if (keyboardAvoiding && scrollable) {
      // KeyboardAwareScrollView props
      return {
        ...baseProps,
        style: styles.flex,
        contentContainerStyle: { flexGrow: 1 },
        enableOnAndroid,
        extraScrollHeight,
        keyboardShouldPersistTaps,
        showsVerticalScrollIndicator: false,
        bounces: false,
        enableResetScrollToCoords: false,
      };
    } else if (scrollable) {
      // ScrollView props
      return {
        ...baseProps,
        style: styles.flex,
        contentContainerStyle: { flexGrow: 1 },
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps,
      };
    }

    // Sadece View için
    return {
      ...baseProps,
      style: styles.flex,
    };
  };

  const MainContent = () => (
    <Container {...getContainerProps()}>
      <View style={styles.content}>
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
      </View>
    </Container>
  );

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
        ) : keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 20}
          >
            <MainContent />
            {footer && <View style={styles.footerContainer}>{footer}</View>}
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.flex}>
            <MainContent />
            {footer && <View style={styles.footerContainer}>{footer}</View>}
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
      flex: 1,
      flexGrow: 1,
      position: "relative",
    },
    container: {
      ...spacing({
        pl: 20,
        pr: 20,
      }),
    },
    footerContainer: {
      ...spacing({
        pb: 10,
      }),
    },
  });
