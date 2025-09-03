import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useMemo } from "react";
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
  enableOnAndroid?: boolean;
  extraScrollHeight?: number;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

// Memoized Badge Component
const MemoizedBadge = memo(() => <TorBadge />);

// Memoized Title Component
const MemoizedTitle = memo(({ title }: { title: string | React.ReactNode }) => {
  if (typeof title === "string") {
    return (
      <ThemedText type="title" weight="semiBold">
        {title}
      </ThemedText>
    );
  }
  return <>{title}</>;
});

// Loading Overlay Component - Tamamen ayrı memoized component
const LoadingOverlay = memo(({ loading }: { loading: boolean }) => {
  if (!loading) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    </View>
  );
});

const AppLayout = ({
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
}: AppLayoutProps) => {
  const styles = useThemedStyles(createStyle);

  // Container component'ini memoize et
  const Container = useMemo(() => {
    if (keyboardAvoiding && scrollable) {
      return KeyboardAwareScrollView;
    } else if (scrollable) {
      return ScrollView;
    }
    return View;
  }, [keyboardAvoiding, scrollable]);

  // Container props'larını memoize et
  const containerProps = useMemo(() => {
    const baseProps: any = {};

    if (keyboardAvoiding && scrollable) {
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
      return {
        ...baseProps,
        style: styles.flex,
        contentContainerStyle: { flexGrow: 1 },
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps,
      };
    }

    return {
      ...baseProps,
      style: styles.flex,
    };
  }, [
    keyboardAvoiding,
    scrollable,
    styles.flex,
    enableOnAndroid,
    extraScrollHeight,
    keyboardShouldPersistTaps,
  ]);

  // SafeAreaView style'ını memoize et
  const safeAreaStyle = useMemo(
    () => [
      styles.safeArea,
      safeAreaPadding ? { ...spacing({ mt: 45 }) } : undefined,
    ],
    [styles.safeArea, safeAreaPadding],
  );

  // LinearGradient style'ını memoize et
  const gradientStyle = useMemo(
    () => [styles.gradient, container ? styles.container : undefined],
    [styles.gradient, styles.container, container],
  );

  // Badge container style'ını memoize et
  const badgeContainerStyle = useMemo(
    () => [
      styles.flexRow,
      styles.alignItemsCenter,
      styles.mt2,
      styles.mb5,
      !container ? styles.container : undefined,
    ],
    [
      styles.flexRow,
      styles.alignItemsCenter,
      styles.mt2,
      styles.mb5,
      styles.container,
      container,
    ],
  );

  // Badge flex style'ını memoize et
  const badgeFlexStyle = useMemo(
    () => [styles.flex, styles.justifyContentEnd, styles.alignItemsEnd],
    [styles.flex, styles.justifyContentEnd, styles.alignItemsEnd],
  );

  // Main Content Component'ini memoize et - loading dependency'sini tamamen kaldırdık
  const MainContent = useCallback(
    () => (
      <Container {...containerProps}>
        <View style={styles.content}>
          {showBadge && (
            <View style={badgeContainerStyle}>
              {title && <MemoizedTitle title={title} />}
              <View style={badgeFlexStyle}>
                <MemoizedBadge />
              </View>
            </View>
          )}
          {children}
        </View>
      </Container>
    ),
    [
      Container,
      containerProps,
      styles.content,
      showBadge,
      badgeContainerStyle,
      title,
      badgeFlexStyle,
      children,
    ],
  );

  // KeyboardAvoidingView props'larını memoize et
  const keyboardAvoidingProps = useMemo(
    () => ({
      style: styles.flex,
      behavior:
        Platform.OS === "ios" ? ("padding" as const) : ("height" as const),
      keyboardVerticalOffset: Platform.OS === "ios" ? 50 : 20,
    }),
    [styles.flex],
  );

  return (
    <LinearGradient
      colors={Colors.backgroundColor as never}
      style={gradientStyle}
    >
      <ImageBackground
        source={Images.backgroundImage}
        style={styles.imageBackground}
        resizeMode="cover"
      />
      <SafeAreaView style={safeAreaStyle}>
        <View style={styles.flex}>
          {keyboardAvoiding ? (
            <KeyboardAvoidingView {...keyboardAvoidingProps}>
              <MainContent />
              {footer && <View style={styles.footerContainer}>{footer}</View>}
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.flex}>
              <MainContent />
              {footer && <View style={styles.footerContainer}>{footer}</View>}
            </View>
          )}

          {/* Loading Overlay - Ana content'ten tamamen bağımsız */}
          <LoadingOverlay loading={loading} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Props comparison function for memo
const areEqual = (prevProps: AppLayoutProps, nextProps: AppLayoutProps) => {
  // Shallow comparison of props
  const keys = Object.keys(nextProps) as (keyof AppLayoutProps)[];

  for (const key of keys) {
    if (key === "children") {
      // Children için React.memo kullanıldığında özel karşılaştırma yapabiliriz
      // Ancak genellikle children her zaman değişir, bu yüzden dikkatli olmak gerekir
      continue;
    }

    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

export default memo(AppLayout, areEqual);

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

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
