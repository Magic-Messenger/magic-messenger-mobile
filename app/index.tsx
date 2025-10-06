import "@/i18n";

import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useGetApiAccountGetProfile } from "@/api/endpoints/magicMessenger";
import { AppLayout, ThemedText } from "@/components";
import { Images } from "@/constants";
import { registerForPushNotificationsAsync } from "@/services";
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
  const isLogin = useUserStore((state) => state.isLogin);
  const rehydrated = useUserStore((state) => state.rehydrated);
  const setProfile = useUserStore((state) => state.setProfile);
  const styles = useThemedStyles(createStyle);

  const { data: profileResponse, refetch } = useGetApiAccountGetProfile({
    query: { enabled: isLogin },
  });

  const [connected, setConnected] = useState<boolean>(false);
  const [dots, setDots] = useState<string>("");

  let interval: number = 0;

  const setupInterval = () => {
    interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) {
          return "";
        }
        return prev + ".";
      });
    }, 1000);
  };

  useEffect(() => {
    setupInterval();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setConnected(true);
    }, 2500);

    setTimeout(() => {
      if (isLogin) {
        router.dismissTo("/home");
      } else {
        router.dismissTo("/(auth)/preLogin");
      }

      clearTimeout(interval);
    }, 3000);
  }, [interval, isLogin]);

  useEffect(() => {
    trackEvent("app_open", { isLogin, rehydrated });
  }, [isLogin, rehydrated]);

  useEffect(() => {
    if (profileResponse?.data) setProfile(profileResponse?.data);
  }, [profileResponse?.data]);

  useEffect(() => {
    if (isLogin) refetch();
  }, [isLogin]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const userPublicKeyCheck = checkUserCredentials();
    if (!userPublicKeyCheck) {
      generateKeyPairs();
    }
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
            <ThemedText type="default">Connecting{dots}</ThemedText>
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
            <ThemedText type="default">TOR</ThemedText>
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
            <ThemedText type="default">VPN</ThemedText>
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
            <ThemedText type="default">Encryption</ThemedText>
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
