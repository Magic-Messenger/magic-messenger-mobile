import { AppLayout, ThemedText } from "@/components";
import { Colors, commonStyle, spacing, textStyle } from "@/constants";
import { useAppStore } from "@/store";
import { changeLanguage } from "@/utils";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";

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
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <View>
          <Text style={style.textStyle}>adsfadsfasfas</Text>
        </View>

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

const style = StyleSheet.create({
  textStyle: {
    ...textStyle(15, Colors.white),
    ...spacing({
      mb: 20,
    }),
  },
});
