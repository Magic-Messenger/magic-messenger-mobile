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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// Header Component
interface BackgroundProps {
  children: React.ReactNode;
}

// Background Component
const Background = memo(({ children }: BackgroundProps) => {
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
      {children}
    </GradientBackground>
  );
});

// Header Component
interface HeaderProps {
  title?: string | React.ReactNode;
  showBadge: boolean;
  container: boolean;
}

const Header = memo(({ title, showBadge, container }: HeaderProps) => {
  const styles = useThemedStyles(createStyle);

  return (
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
  );
});

// Footer Component
interface FooterProps {
  footer: React.ReactNode;
  container: boolean;
  shouldApplyBottomSafeArea: boolean;
}

const Footer = memo(
  ({ footer, container, shouldApplyBottomSafeArea }: FooterProps) => {
    const styles = useThemedStyles(createStyle);
    return (
      <View
        style={[
          {
            paddingTop: spacingPixel(16),
            paddingBottom: shouldApplyBottomSafeArea ? spacingPixel(16) : 0,
          },
          container ? styles.container : {},
        ]}
      >
        {footer}
      </View>
    );
  },
);

// Loading Overlay Component
const LoadingOverlay = memo(() => {
  const styles = useThemedStyles(createStyle);

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" />
    </View>
  );
});

// Content Wrapper Component
interface ContentWrapperProps {
  children: React.ReactNode;
  Container: React.ElementType;
  containerProps: any;
  title?: string | React.ReactNode;
  showBadge: boolean;
  container: boolean;
  footer?: React.ReactNode;
  shouldApplyBottomSafeArea: boolean;
}

const ContentWrapper = memo(
  ({
    children,
    Container,
    containerProps,
    title,
    showBadge,
    container,
    footer,
    shouldApplyBottomSafeArea,
  }: ContentWrapperProps) => {
    const styles = useThemedStyles(createStyle);

    return (
      <View style={styles.safeArea}>
        <Container {...containerProps}>
          <Header title={title} showBadge={showBadge} container={container} />
          {children}
        </Container>

        {footer && (
          <Footer
            footer={footer}
            container={container}
            shouldApplyBottomSafeArea={shouldApplyBottomSafeArea}
          />
        )}
      </View>
    );
  },
);

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

  const Container: React.ElementType = useMemo(() => {
    if (keyboardAvoiding) return KeyboardAwareScrollView;
    if (scrollable) return ScrollView;
    return View;
  }, [keyboardAvoiding, scrollable]);

  const containerProps = useMemo(() => {
    const baseContentStyle = [
      styles.content,
      container && styles.container,
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
  ]);

  const safeAreaStyle = useMemo(
    () => ({
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: shouldApplyBottomSafeArea ? insets.bottom : 0,
    }),
    [
      insets.top,
      insets.left,
      insets.right,
      insets.bottom,
      shouldApplyBottomSafeArea,
    ],
  );

  return (
    <View style={styles.wrapper}>
      <Background>
        <View style={[styles.safeAreaContainer, safeAreaStyle]}>
          <ContentWrapper
            Container={Container}
            containerProps={containerProps}
            title={title}
            showBadge={showBadge}
            container={container}
            footer={footer}
            shouldApplyBottomSafeArea={shouldApplyBottomSafeArea}
          >
            {children}
          </ContentWrapper>
        </View>
      </Background>

      {loading && <LoadingOverlay />}
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
    safeAreaContainer: {
      flex: 1,
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
