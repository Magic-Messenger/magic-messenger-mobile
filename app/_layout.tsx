import "react-native-reanimated";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";

import { Colors } from "@/constants";
import { useUserStore } from "@/store";
import { toastConfig } from "@/utils";

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

  const { rehydrated } = useUserStore();

  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          setShowOverlay(true);
          await ScreenCapture.preventScreenCaptureAsync();
        } else {
          setShowOverlay(false);
          await ScreenCapture.allowScreenCaptureAsync();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  if (!loaded || !rehydrated) {
    return null;
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerTitleAlign: "center",
            headerTransparent: true,
            headerTintColor: Colors.white,
            contentStyle: {
              backgroundColor: "transparent",
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>

        <Toast config={toastConfig as never} />
        <StatusBar style="light" />
      </QueryClientProvider>

      {showOverlay && (
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
      )}
    </>
  );
}
