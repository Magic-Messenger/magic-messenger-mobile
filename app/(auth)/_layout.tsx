import { Colors } from "@/constants";
import { Stack } from "expo-router";

export default function AuthScreen() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerTintColor: Colors.white,
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
