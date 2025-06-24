import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import "react-native-reanimated";

import { Colors, Images } from "@/constants";
import { Stack } from "expo-router";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerTransparent: true,
          headerTintColor: Colors.white,
          contentStyle: {
            backgroundColor: "transparent",
          },
          headerTitle: () => (
            <Image
              source={Images.logo}
              contentFit="contain"
              style={styles.headerImage}
            />
          ),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: 105,
    height: 30,
  },
});
