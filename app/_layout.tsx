import "react-native-reanimated";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PortalProvider } from "@gorhom/portal";
import LogRocket from "@logrocket/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Application from "expo-application";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { Colors } from "@/constants";
import { useScreenProtection } from "@/hooks";
import { SignalRProvider } from "@/providers";
import { useUserStore } from "@/store";
import { headerImage, toastConfig } from "@/utils";

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

  const { rehydrated } = useUserStore();

  const { t } = useTranslation();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    LogRocket.init(process?.env?.EXPO_PUBLIC_LOG_ROCKET_API as string, {
      updateId: Application.nativeApplicationVersion,
      expoChannel: __DEV__ ? "development" : "production",
      network: {
        isEnabled: true,
      },
    });
  }, [loaded]);

  if (!loaded || !rehydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <PortalProvider>
        <ActionSheetProvider>
          <QueryClientProvider client={queryClient}>
            <SignalRProvider>
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
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="chatDetail"
                  options={{ headerShown: true }}
                />
                <Stack.Screen
                  name="ticketDetail"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>

              <Toast config={toastConfig} />
              <StatusBar style="light" />
            </SignalRProvider>
          </QueryClientProvider>
        </ActionSheetProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
