import { AppLayout, ThemedText } from "@/components";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, View } from "react-native";

export default function HomeScreen() {
  console.log("env file: ", process.env);
  const { t } = useTranslation();

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
        <ThemedText type="title">{t("welcome")}</ThemedText>
        <ThemedText type="title">Home Page !</ThemedText>
      </View>
    </AppLayout>
  );
}
