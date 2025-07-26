import { Colors } from "@/constants";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ChatStack() {
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
          headerShown: false,
          title: t("settings.title"),
        }}
      />
    </Stack>
  );
}
