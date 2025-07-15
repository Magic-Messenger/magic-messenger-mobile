import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import "react-native-reanimated";

import { Colors, Images } from "@/constants";
import "@/i18n";
import { useUserStore } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { isLogin, rehydrated } = useUserStore();

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
            headerTransparent: true,
            headerTintColor: Colors.white,
            contentStyle: {
              backgroundColor: "transparent",
            },
            headerTitleAlign: "center",
            headerTitle: () => (
              <Image
                source={Images.logo}
                contentFit="contain"
                style={styles.headerImage}
              />
            ),
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </QueryClientProvider>
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: 105,
    height: 30,
  },
});
