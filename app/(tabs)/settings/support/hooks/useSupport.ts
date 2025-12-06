import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export const useSupport = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const handleGoToFaq = () =>
    router.push("/(tabs)/settings/support/screens/faq");

  const handleGoToTickets = () =>
    router.push("/(tabs)/settings/support/screens/tickets");

  const handleGoToCreateTicket = () =>
    router.push("/(tabs)/settings/support/screens/createTicket");

  return {
    t,
    styles,
    handleGoToFaq,
    handleGoToTickets,
    handleGoToCreateTicket,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    supportItem: {
      backgroundColor: colors.secondaryBackground,
      ...spacing({
        p: 12,
        mb: 16,
      }),
      borderRadius: spacingPixel(10),
    },
    viewButton: {
      ...spacing({
        pl: 16,
        pr: 16,
        pt: 8,
        pb: 8,
      }),
      borderRadius: spacingPixel(5),
      backgroundColor: colors.primary,
    },
  });
