import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { usePostApiAccountChangeLanguage } from "@/api/endpoints/magicMessenger";
import {
  AppImage,
  AppLayout,
  Button,
  Dropdown,
  ThemedText,
} from "@/components";
import { Images, spacing } from "@/constants";
import { useThemedStyles } from "@/theme";
import {
  appSupportLanguages,
  changeLanguage,
  heightPixel,
  widthPixel,
} from "@/utils";

export default function PreLoginScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const { mutateAsync: changeLanguageRequest } =
    usePostApiAccountChangeLanguage();

  const redirectLoginPage = () => {
    router.push("/(auth)/login/screens/login");
  };

  const redirectRegisterPage = () => {
    router.push("/(auth)/register");
  };

  const handleChangeLanguage = async (value: string | number) => {
    changeLanguage(value as string);
    await changeLanguageRequest({ data: { language: value as string } });
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
        <AppImage
          source={Images.logo}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
        <View style={styles.appLanguageDropdown}>
          <Dropdown
            selectedValue={"en"}
            options={appSupportLanguages()}
            onValueChange={handleChangeLanguage}
          />
        </View>
      </View>
    </AppLayout>
  );
}

const createStyle = () =>
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
    appLanguageDropdown: {
      width: "100%",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
  });
