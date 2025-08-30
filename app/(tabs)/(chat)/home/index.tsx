import { AppLayout, Button, Icon } from "@/components";
import { useUserStore } from "@/store";
import { heightPixel, widthPixel } from "@/utils";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isLogin } = useUserStore();

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
      <View />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  newChatButton: {
    width: widthPixel(110),
    height: heightPixel(30),
  },
});
