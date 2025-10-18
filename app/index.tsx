import "@/i18n";

import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useGetApiAccountGetProfile } from "@/api/endpoints/magicMessenger";
import { AppLayout, ThemedText } from "@/components";
import { Images } from "@/constants";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "@/services";
import { useTor } from "@/services/axios/tor";
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
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const { startTor, isConnected: isTorConnected } = useTor();

  const styles = useThemedStyles(createStyle);

  const { data: profileResponse, refetch } = useGetApiAccountGetProfile({
    query: { enabled: isLogin },
  });

  const [appStarted, setAppStarted] = useState<boolean>(false);
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

  const initializeTor = async () => {
    try {
      await startTor();
    } catch (err) {
      trackEvent("initializeTor error: ", { err });
    }

    initializeAppStart();
  };

  const initializeAppStart = async (withTimeout?: boolean) => {
    if (withTimeout) {
      setTimeout(() => {
        setConnected(true);

        clearTimeout(interval);
        setAppStarted(true);

        setTimeout(() => {
          if (isLogin) {
            router.replace("/home");
          } else {
            router.replace("/(auth)/preLogin");
          }
        }, 500);
      }, 2500);
    } else {
      setConnected(true);

      clearTimeout(interval);
      setAppStarted(true);

      setTimeout(() => {
        if (isLogin) {
          router.replace("/home");
        } else {
          router.replace("/(auth)/preLogin");
        }
      }, 500);
    }
  };

  useEffect(() => {
    setupInterval();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!rehydrated) return;

    if (profile?.enableTor) {
      if (!isTorConnected) {
        initializeTor();
      } else initializeAppStart();
    } else {
      // When TOR is disabled, we simulate a connection delay
      initializeAppStart(true);
    }
  }, [rehydrated, profile, isTorConnected]);

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
    setupNotificationListeners();
  }, []);

  useEffect(() => {
    const userPublicKeyCheck = checkUserCredentials();
    if (!userPublicKeyCheck) {
      generateKeyPairs();
    }
  }, []);

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
            <View
              style={[
                styles.badgeStatus,
                isTorConnected ? styles.active : styles.inActive,
              ]}
            />
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
