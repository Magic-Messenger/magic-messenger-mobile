import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { Fonts, spacing, textStyle } from "@/constants";
import { useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { fontPixel, heightPixel, showToast, widthPixel } from "@/utils";

export const useLicense = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const profile = useUserStore((state) => state.profile);

  const handleCopy = async () => {
    profile?.license?.licenseCode &&
      (await Clipboard.setStringAsync(profile?.license?.licenseCode));
    showToast({
      text1: t("license.successCopy"),
      type: "success",
    });
  };

  return { t, styles, profile, handleCopy };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    licenseContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: widthPixel(10),
      backgroundColor: colors.secondaryBackground,
      minHeight: heightPixel(72),
      ...spacing({
        mt: 8,
        pl: 8,
        pr: 8,
        pt: 16,
        pb: 16,
      }),
    },
    activeLicenseText: {
      fontSize: fontPixel(16),
      fontFamily: Fonts.SFProMedium,
    },
    licenseCodeText: {
      fontSize: fontPixel(12),
      fontFamily: Fonts.SFProRegular,
      ...spacing({
        mt: 8,
      }),
    },
    expireDateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: widthPixel(5),
      backgroundColor: colors.primary,
      padding: heightPixel(5),
    },
    expireLicenseDate: {
      fontSize: fontPixel(10),
      fontFamily: Fonts.SFProRegular,
    },
    title: {
      ...textStyle(16, colors.white, "bold"),
    },
  });
