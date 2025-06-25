import { AppLayout, ThemedText } from "@/components";
import { useAppStore } from "@/store";
import { changeLanguage } from "@/utils";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, View } from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const currentLanguage = useAppStore.getState()?.settings?.language;

  useEffect(() => {
    if (__DEV__) {
      console.log("process.env:", JSON.stringify(process.env, null, 2));
    }
  }, []);

  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button title="Chat Screen" onPress={() => router.push("/chat")} />
        <ThemedText type="title">{currentLanguage}</ThemedText>
        <ThemedText type="title">{t("welcome")}</ThemedText>

        <View style={{ flexDirection: "row" }}>
          <Button title="Türkçe" onPress={() => changeLanguage("tr")} />
          <Button title="English" onPress={() => changeLanguage("en")} />
        </View>

        <ThemedText type="title">Home Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
