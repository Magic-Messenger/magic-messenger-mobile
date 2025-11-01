import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatDto } from "@/api/models";
import { Colors, Images, spacing } from "@/constants";
import { useSignalRStore, useUserStore } from "@/store";
import { useColor, useThemedStyles } from "@/theme";
import { showToast, trackEvent } from "@/utils";

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
  safeAreaBottom = false,
  safeAreaPadding = true,
  title,
  showBadge = true,
  footer,
  keyboardAvoiding = false,
}: AppLayoutProps) {
  const { t } = useTranslation();
  const colors = useColor();
  const styles = useThemedStyles(createStyle);
  const { userName } = useUserStore();
  const pathname = usePathname();

  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

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
        overScrollMode: "never" as const, // Android
      };
    }

    if (scrollable) {
      return {
        contentContainerStyle: baseContentStyle,
        keyboardShouldPersistTaps: "handled" as const,
        showsVerticalScrollIndicator: false,
        showsHorizontalScrollIndicator: false,
        bounces: false,
        overScrollMode: "never" as const, // Android
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

  const handleMessageReceived = useCallback(
    ({ chat }: { chat: ChatDto }) => {
      trackEvent("chat_message_received", chat);
      if (chat?.chatId) {
        showToast({
          type: "success",
          text1: t("common.newMessageReceived"),
          text2: t("common.newMessageReceivedDesc", {
            title: chat?.isGroupChat
              ? chat?.groupName
              : chat?.contact?.nickname,
          }),
          text2Style: {
            color: colors.colors.text,
          },
          onPress: () => {
            if (chat.isGroupChat) {
              router.push({
                pathname: "/groupChatDetail/screens",
                params: {
                  chatId: chat?.chatId,
                  groupKey: chat?.groupKey,
                  groupNonce: chat?.groupNonce,
                  userName,
                  groupAccountCount: chat?.groupAccountCount,
                  groupAdminAccount: chat?.groupAdminAccount,
                  isGroupChat: (chat?.isGroupChat as never) ?? false,
                },
              });
            } else {
              router.push({
                pathname: "/chatDetail/screens",
                params: {
                  chatId: chat?.chatId,
                  publicKey: chat?.contact?.publicKey,
                  userName: chat?.contact?.contactUsername,
                  isGroupChat: (chat?.isGroupChat as never) ?? false,
                },
              });
            }
          },
        });
      }
    },
    [t, router, showToast],
  );

  useEffect(() => {
    if (
      magicHubClient &&
      pathname !== "/chatDetail/screens" &&
      pathname !== "/groupChatDetail/screens"
    ) {
      magicHubClient.on("message_received", handleMessageReceived as never);
      magicHubClient.on(
        "group_message_received",
        handleMessageReceived as never,
      );
    }

    return () => {
      if (magicHubClient) {
        magicHubClient.off("message_received");
        magicHubClient.off("group_message_received");
      }
    };
  }, [magicHubClient, pathname]);

  return (
    <View style={styles.wrapper}>
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
          style={styles.safeArea}
          edges={
            safeAreaBottom || !!footer
              ? ["top", "left", "right", "bottom"]
              : ["top", "left", "right"]
          }
        >
          <Container {...containerProps}>
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
        </SafeAreaView>
      </LinearGradient>

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
  });

export default memo(AppLayout);
