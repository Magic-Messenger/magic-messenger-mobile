import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui";
import { ColorDto, useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { ThemedText } from "../../ThemedText";

interface ReplyMessageItemProps {
  message?: any;
}

export function ReplyMessageItem({ message }: ReplyMessageItemProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColor();

  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="reply" size={14} color={colors.colors.text} />
      </View>
      <View style={styles.contentContainer}>
        <ThemedText style={styles.label}>{t("chat.repliedMessage")}</ThemedText>
        <ThemedText numberOfLines={2} style={styles.message}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      padding: spacingPixel(8),
      paddingLeft: spacingPixel(10),
      borderLeftWidth: spacingPixel(3),
      borderRadius: spacingPixel(6),
      borderColor: colors.primary,
      marginBottom: spacingPixel(8),
      opacity: 0.9,
      width: "auto",
      minWidth: spacingPixel(120),
    },
    iconContainer: {
      justifyContent: "center",
      marginRight: spacingPixel(8),
    },
    contentContainer: {
      flex: 1,
      gap: spacingPixel(2),
    },
    label: {
      fontSize: spacingPixel(10),
      opacity: 0.7,
      fontWeight: "600",
    },
    message: {
      fontSize: spacingPixel(13),
      opacity: 0.8,
    },
  });
