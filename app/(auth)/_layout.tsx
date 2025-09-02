import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants";

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
        name="login/screens/login"
        options={{
          headerShown: true,
          title: t("login.title"),
        }}
      />

      <Stack.Screen
        name="register/index"
        options={{
          headerShown: true,
          title: t("register.title"),
        }}
      />

      <Stack.Screen
        name="licenseNumber/index"
        options={{
          headerShown: true,
          title: "Enter License",
        }}
      />

      <Stack.Screen
        name="securityPhrases/index"
        options={{
          headerShown: true,
          title: t("securityPhrases.title"),
        }}
      />

      <Stack.Screen
        name="verifyPhrases/index"
        options={{
          headerShown: true,
          title: t("forgotAccount.verifyPhrases"),
        }}
      />

      <Stack.Screen
        name="resetPassword/index"
        options={{
          headerShown: true,
          title: t("forgotAccount.resetPassword"),
        }}
      />
    </Stack>
  );
}
