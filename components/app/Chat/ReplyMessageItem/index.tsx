import { StyleSheet, View } from "react-native";

import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { ThemedText } from "../../ThemedText";

export function ReplyMessageItem({ message }: { message?: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <ThemedText numberOfLines={2}>{message}</ThemedText>
    </View>
  );
}

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: spacingPixel(10),
      borderLeftWidth: spacingPixel(2),
      borderRadius: spacingPixel(5),
      borderColor: colors.white,
      marginVertical: spacingPixel(5),
    },
  });
