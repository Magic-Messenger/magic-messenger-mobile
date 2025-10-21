import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export const useAccountDeleted = () => {
  const { t } = useTranslation();

  const styles = useThemedStyles(createStyle);

  const handleGoToRegister = () => {
    router.canDismiss() && router.dismissAll();
    router.replace("/(auth)/register");
  };

  return {
    t,
    styles,
    handleGoToRegister,
  };
};

const createStyle = () =>
  StyleSheet.create({
    formContainer: {
      paddingHorizontal: widthPixel(16),
    },
    logoImage: {
      width: widthPixel(220),
      height: heightPixel(50),
    },
  });
