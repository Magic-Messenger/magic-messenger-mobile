import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { useUserStore } from "@/store";
import { router } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { login, isLogin } = useUserStore();

  useEffect(() => {
    if (isLogin) {
      router.replace("/(tabs)/home");
    }
  }, [isLogin]);

  const handleLogin = () => {
    login();
  };

  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <ThemedText type="title">Login Page !</ThemedText>

        <TouchableOpacity
          onPress={handleLogin}
          style={{
            backgroundColor: "#007AFF",
            padding: 15,
            borderRadius: 8,
            marginVertical: 10,
          }}
        >
          <ThemedText type="default" style={{ color: "white" }}>
            Giriş Yap
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")}>
          <ThemedText type="default">Kayıt Ol Sayfasına Git</ThemedText>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}
