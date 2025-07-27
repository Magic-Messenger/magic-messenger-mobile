import { Colors } from "@/constants";
import { headerImage } from "@/utils";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

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
        name="profile/index"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/list/index"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/add/index"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="contacts/edit/index"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
