import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";

type DateSeparatorProps = {
  date: string;
};

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <ThemedText style={styles.text}>{date}</ThemedText>
      </View>
    </View>
  );
};

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: spacingPixel(12),
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacingPixel(12),
      paddingVertical: spacingPixel(6),
      borderRadius: spacingPixel(12),
    },
    text: {
      fontSize: 12,
      color: colors.white,
    },
  });
