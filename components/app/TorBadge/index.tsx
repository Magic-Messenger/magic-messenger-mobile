import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants";
import { useAppStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, spacingPixel, widthPixel } from "@/utils";

import { ThemedText } from "../ThemedText";

export const TorBadge = () => {
  const { tor } = useAppStore();
  const styles = useThemedStyles(createStyle);

  return (
    <LinearGradient
      colors={Colors.buttonPrimary as never}
      start={{ y: 0, x: 1 }}
      end={{ y: 1, x: 0 }}
      style={[
        styles.bedge,
        styles.alignItemsCenter,
        styles.justifyContentCenter,
        styles.gap2,
        styles.pl2,
        styles.pr2,
      ]}
    >
      <View
        style={[styles.badgeStatus, tor ? styles.active : styles.inActive]}
      />
      <ThemedText type="default" weight="semiBold">
        Tor
      </ThemedText>
    </LinearGradient>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    bedge: {
      flexDirection: "row",
      minWidth: widthPixel(60),
      height: heightPixel(30),
      borderRadius: widthPixel(9),
    },
    badgeStatus: {
      padding: spacingPixel(10),
      borderRadius: widthPixel(100),
    },
    active: {
      backgroundColor: Colors.success,
    },
    inActive: {
      backgroundColor: Colors.danger,
    },
  });
