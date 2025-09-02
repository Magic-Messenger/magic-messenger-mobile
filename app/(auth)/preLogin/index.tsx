import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppImage, AppLayout, Button, ThemedText } from "@/components";
import { Images, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export default function PreLoginScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const redirectLoginPage = () => {
    router.push("/(auth)/login/screens/login");
  };

  const redirectRegisterPage = () => {
    router.push("/(auth)/register");
  };

  return (
    <AppLayout container scrollable safeAreaPadding={false} showBadge={false}>
      <View
        style={[
          styles.flex,
          styles.alignItemsCenter,
          styles.justifyContentCenter,
        ]}
      >
        <AppImage source={Images.logo} style={styles.logoImage} />
        <ThemedText weight="semiBold" style={styles.pt2}>
          {t("welcome")}
        </ThemedText>

        <View style={[styles.mainContainer, styles.fullWidth, styles.gap5]}>
          <Button
            type="primary"
            label={t("login.title")}
            onPress={redirectLoginPage}
          />
          <ThemedText center type="default" weight="semiBold">
            or
          </ThemedText>
          <Button
            type="primary"
            label={t("register.title")}
            onPress={redirectRegisterPage}
          />
        </View>
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {
      ...spacing({
        mt: 60,
      }),
    },
    logoImage: {
      width: widthPixel(220),
      height: heightPixel(50),
    },
  });
