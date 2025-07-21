import Logo from "@/assets/images/3d-logo.png";
import { AppImage, AppLayout, Button, ThemedText } from "@/components";
import { commonStyle, spacing } from "@/constants";
import { heightPixel, widthPixel } from "@/utils";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

export default function PreLoginScreen() {
  const { t } = useTranslation();

  const redirectLoginPage = () => {
    router.push("/(auth)/licenseNumber");
  };

  const redirectRegisterPage = () => {
    router.push("/(auth)/register");
  };

  return (
    <AppLayout container scrollable>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <AppImage source={Logo} style={styles.logoImage} />
        <ThemedText weight="semiBold" style={commonStyle.pt2}>
          {t("welcome")}
        </ThemedText>

        <View
          style={[
            styles.mainContainer,
            commonStyle.fullWidth,
            commonStyle.gap5,
          ]}
        >
          <Button
            type="primary"
            label={t("login")}
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

const styles = StyleSheet.create({
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
