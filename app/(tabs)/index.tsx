import { AppLayout, ThemedText } from "@/components";
import { commonStyle } from "@/constants";
import { useAppStore } from "@/store";
import { changeLanguage } from "@/utils";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const currentLanguage = useAppStore.getState()?.settings?.language;

  useMemo(() => {
    if (__DEV__) {
      console.log("process.env:", JSON.stringify(process.env, null, 2));
    }
    return null;
  }, []);

  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <Button title="Chat Screen" onPress={() => router.push("/chat")} />
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
      </View>
    </AppLayout>
  );
}

const style = StyleSheet.create({});
