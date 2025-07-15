import { Stack } from "expo-router";

export default function AuthScreen() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="preLogin/index"
    >
      <Stack.Screen
        name="preLogin/index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="login/index"
        options={{
          title: "Giriş Yap",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="register/index"
        options={{
          title: "Kayıt Ol",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
