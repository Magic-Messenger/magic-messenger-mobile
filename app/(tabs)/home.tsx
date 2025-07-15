import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { useAppStore, useUserStore } from "@/store";
import { changeLanguage } from "@/utils";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { logout, isLogin } = useUserStore();
  const currentLanguage = useAppStore.getState()?.settings?.language;

  useEffect(() => {
    if (!isLogin) {
      router.replace("/(auth)/login");
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
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        {/* <Button title="Chat Screen" onPress={() => router.push("/chat")} /> */}
        <ThemedText type="title">{currentLanguage}</ThemedText>
        <ThemedText type="title">{t("welcome")}</ThemedText>

        <View style={commonStyle.flexRow}>
          <Button
            title="Türkçe"
            disabled={currentLanguage === "tr"}
            onPress={() => changeLanguage("tr")}
          />
          <Button
            title="English"
            disabled={currentLanguage === "en"}
            onPress={() => changeLanguage("en")}
          />
        </View>

        <ThemedText type="title">Home Page !</ThemedText>

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

const style = StyleSheet.create({});
