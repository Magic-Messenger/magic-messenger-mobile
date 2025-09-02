import "react-native-reanimated";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
    </>
  );
}
