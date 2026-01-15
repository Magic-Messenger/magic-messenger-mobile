import "react-native-reanimated";

import { PortalProvider } from "@gorhom/portal";
import LogRocket from "@logrocket/react-native";
import messaging from "@react-native-firebase/messaging";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Application from "expo-application";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Toast from "react-native-toast-message";

import { usePostApiAccountRegisterFirebaseToken } from "@/api/endpoints/magicMessenger";
import { IncomingCallModal } from "@/components";
import { Colors } from "@/constants";
import { useScreenProtection } from "@/hooks";
import { initDayjs } from "@/i18n";
import { ImageViewerProvider, SignalRProvider, TorProvider } from "@/providers";
import {
  checkInitialNotification,
  clearAllNotifications,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "@/services";
import { useAppStore, useUserStore, useWebRTCStore } from "@/store";
import { headerImage, toastConfig, trackEvent } from "@/utils";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    SFPro: require("../assets/fonts/SF-Pro.ttf"),
    SFProBold: require("../assets/fonts/SF-Pro-Text-Bold.ttf"),
    SFProLight: require("../assets/fonts/SF-Pro-Text-Light.ttf"),
    SFProMedium: require("../assets/fonts/SF-Pro-Text-Medium.ttf"),
    SFProRegular: require("../assets/fonts/SF-Pro-Text-Regular.ttf"),
    SFProSemiBold: require("../assets/fonts/SF-Pro-Text-Semibold.ttf"),
  });

  useScreenProtection();

  const rehydrated = useUserStore((state) => state.rehydrated);
  const language = useAppStore((state) => state.language);
  const isLogin = useUserStore((state) => state.isLogin);
  const previousAppState = useAppStore((state) => state.previousAppState);
  const currentAppState = useAppStore((state) => state.currentAppState);

  const { t } = useTranslation();

  const { mutateAsync: registerFirebaseToken } =
    usePostApiAccountRegisterFirebaseToken();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      clearAllNotifications();

      registerForPushNotificationsAsync();
      setupNotificationListeners();
      checkInitialNotification();

      LogRocket.init(process?.env?.EXPO_PUBLIC_LOG_ROCKET_API as string, {
        updateId: Application.nativeApplicationVersion,
        expoChannel: __DEV__ ? "development" : "production",
        network: {
          isEnabled: true,
        },
      });
    }
  }, [loaded]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        const prevAppState = useAppStore.getState().currentAppState;
        if (prevAppState === nextAppState) return;

        useAppStore.setState({
          previousAppState: prevAppState,
          currentAppState: nextAppState,
        });
      },
    );
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (
      isLogin &&
      previousAppState?.match?.(/inactive|background/) &&
      currentAppState === "active"
    ) {
      useWebRTCStore.getState().checkWaitingCalling();
    }
  }, [isLogin, previousAppState, currentAppState]);

  useEffect(() => {
    initDayjs();
  }, [language]);

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      trackEvent("🔁 FCM Token Refreshed:", token);

      if (isLogin) {
        registerFirebaseToken({
          data: { firebaseToken: token },
        })
          .then()
          .catch();
      }
    });

    return () => unsubscribe();
  }, [isLogin]);

  if (!loaded || !rehydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <PortalProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <TorProvider>
              <SignalRProvider>
                <ImageViewerProvider>
                  <Stack
                    screenOptions={{
                      headerTransparent: true,
                      headerTintColor: Colors.white,
                      headerBackTitle: t("back"),
                      ...headerImage(),
                      contentStyle: {
                        backgroundColor: "transparent",
                      },
                      headerTitleAlign: "center",
                    }}
                  >
                    <Stack.Screen
                      name="index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(calling)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="chatDetail"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="groupChatDetail"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="ticketDetail"
                      options={{ headerShown: true }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>

                  <IncomingCallModal />
                  <Toast config={toastConfig} />
                  <StatusBar style="light" />
                </ImageViewerProvider>
              </SignalRProvider>
            </TorProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
