import { AppLayout, Button, Icon, ThemedText } from "@/components";
import { useUserStore } from "@/store";
import { heightPixel, widthPixel } from "@/utils";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function ChatScreen() {
  const { t } = useTranslation();
  const { logout, isLogin } = useUserStore();

  useEffect(() => {
    if (!isLogin) {
      router.replace("/(auth)/preLogin");
    }
  }, [isLogin]);

  useMemo(() => {
    if (__DEV__) {
      console.log("process.env:", JSON.stringify(process.env, null, 2));
    }
    return null;
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <AppLayout
      container
      title={
        <View style={styles.newChatButton}>
          <Button
            type="primary"
            label={t("home.newChat")}
            textProps={{
              size: 14,
            }}
            leftIcon={<Icon type="feather" name="plus" size={18} />}
          />
        </View>
      }
    >
      <View>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#FF3B30",
            padding: 15,
            borderRadius: 8,
            marginTop: 20,
          }}
        >
          <ThemedText type="default" style={{ color: "white" }}>
            Çıkış Yap
          </ThemedText>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  newChatButton: {
    width: widthPixel(110),
    height: heightPixel(30),
  },
});
