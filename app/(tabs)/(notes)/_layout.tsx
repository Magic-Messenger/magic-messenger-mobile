import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants";
import { headerImage } from "@/utils";

export default function NotesStack() {
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
      initialRouteName="index"
    >
      <Stack.Screen
        name="index"
        options={{
          ...headerImage(),
          headerShown: true,
          title: t("settings.title"),
        }}
      />
    </Stack>
  );
}
