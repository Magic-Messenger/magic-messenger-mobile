import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants";
import { headerImage } from "@/utils";

export default function SettingsStack() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerTintColor: Colors.white,
        headerBackTitle: t("back"),
        ...headerImage(),
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
          headerShown: true,
          title: t("settings.title"),
        }}
      />

      <Stack.Screen
        name="profile/screens/profile"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/screens/list"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/screens/add"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/screens/edit"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="scanQr/screens/scanQr"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
