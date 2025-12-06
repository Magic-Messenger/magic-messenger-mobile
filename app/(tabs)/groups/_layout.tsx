import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants";
import { headerImage } from "@/utils";

export default function GroupsStack() {
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
      initialRouteName="home/index"
    >
      <Stack.Screen
        name="home/index"
        options={{
          ...headerImage(),
          headerShown: true,
          title: t("settings.title"),
        }}
      />
      <Stack.Screen
        name="create/screens/index"
        options={{
          ...headerImage(),
          headerShown: true,
          title: t("settings.title"),
        }}
      />
      <Stack.Screen
        name="participants/screens/index"
        options={{
          headerShown: true,
          presentation: "modal",
          headerBackButtonDisplayMode: "default",
          headerBackButtonMenuEnabled: true,
        }}
      />
    </Stack>
  );
}
