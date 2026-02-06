import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants";

export default function CallingStacks() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerTintColor: Colors.white,
        headerBackTitle: t("back"),
        contentStyle: {
          backgroundColor: "transparent",
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="videoCalling/screens/index"
        options={{
          headerShown: true,
          title: "",
        }}
      />
      <Stack.Screen
        name="audioCalling/screens/index"
        options={{
          headerShown: true,
          title: "",
        }}
      />
      <Stack.Screen
        name="groupVideoCalling/screens/index"
        options={{
          headerShown: true,
          title: "",
        }}
      />
      <Stack.Screen
        name="groupAudioCalling/screens/index"
        options={{
          headerShown: true,
          title: "",
        }}
      />
    </Stack>
  );
}
