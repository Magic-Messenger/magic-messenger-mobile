import { Colors } from "@/constants";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AuthScreen() {
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
      initialRouteName="preLogin/index"
    >
      <Stack.Screen name="preLogin/index" />

      <Stack.Screen
        name="login/index"
        options={{
          title: "Giriş Yap",
        }}
      />

      <Stack.Screen
        name="register/index"
        options={{
          headerShown: true,
          title: "Kayıt Ol",
        }}
      />

      <Stack.Screen
        name="licenseNumber/index"
        options={{
          headerShown: true,
          title: "Enter License",
        }}
      />
    </Stack>
  );
}
