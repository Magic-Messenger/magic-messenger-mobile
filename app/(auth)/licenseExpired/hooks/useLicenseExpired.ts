import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { textStyle } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export const useLicenseExpired = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return { t, styles };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: widthPixel(16),
    },
    logoImage: {
      width: widthPixel(180),
      height: heightPixel(30),
    },
    title: {
      ...textStyle(16, colors.white, "bold"),
    },
  });
