import "@/i18n";

import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppLayout, ThemedText } from "@/components";
import { Images } from "@/constants";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "@/services";
import { useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import {
  checkUserCredentials,
  generateKeyPairs,
  heightPixel,
  spacingPixel,
  trackEvent,
  widthPixel,
} from "@/utils";

export default function IndexPage() {
  const { t } = useTranslation();
  const rehydrated = useUserStore((state) => state.rehydrated);

  const styles = useThemedStyles(createStyle);

  const [connected, setConnected] = useState<boolean>(false);
  const [dots, setDots] = useState<string>("");

  useEffect(() => {
    if (!rehydrated) return; // 👈 wait for the store to be ready

    const userPublicKeyCheck = checkUserCredentials();
    if (!userPublicKeyCheck) {
      generateKeyPairs();
    }
    registerForPushNotificationsAsync();
    setupNotificationListeners();

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) {
          return "";
        }
        return prev + ".";
      });
    }, 1000);

    const timeout = setTimeout(() => {
      setConnected(true);
      clearTimeout(interval);

      setTimeout(() => {
        const currentUser = useUserStore.getState().userName;
        if (currentUser) {
          router.replace("/(auth)/login/screens/login");
        } else {
          router.replace("/(auth)/preLogin");
        }
      }, 500);
    }, 3000);

    return () => {
      clearTimeout(interval);
      clearTimeout(timeout);
    };
  }, [rehydrated]);

  useMemo(() => {
    if (__DEV__) {
      trackEvent("env_variables", { ...process.env });
    }
    return null;
  }, []);

  if (!rehydrated) {
    return null;
  }

  return (
    <AppLayout container showBadge={false}>
      <View
        style={[
          styles.flex,
          styles.alignItemsCenter,
          styles.justifyContentCenter,
        ]}
      >
        <Image
          source={Images.logo}
          contentFit="contain"
          style={{ width: widthPixel(200), height: heightPixel(60) }}
        />

        <View
          style={[
            styles.mt4,
            styles.justifyContentStart,
            styles.gap3,
            {
              width: widthPixel(150),
            },
          ]}
        >
          <View
            style={[
              styles.flexRow,
              styles.justifyContentStart,
              styles.alignItemsCenter,
              styles.gap3,
            ]}
          >
            <View
              style={[
                styles.badgeStatus,
                connected ? styles.active : styles.inActive,
              ]}
            />
            <ThemedText type="default">
              {t("connecting")}
              {dots}
            </ThemedText>
          </View>
          <View
            style={[
              styles.flexRow,
              styles.justifyContentStart,
              styles.alignItemsCenter,
              styles.gap3,
            ]}
          >
            <View style={[styles.badgeStatus, styles.active]} />
            <ThemedText type="default">{t("encryption")}</ThemedText>
          </View>
        </View>
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    badgeStatus: {
      padding: spacingPixel(10),
      borderRadius: widthPixel(20),
      width: widthPixel(20),
      height: widthPixel(20),
    },
    active: {
      backgroundColor: colors.success,
    },
    inActive: {
      backgroundColor: colors.danger,
    },
  });
