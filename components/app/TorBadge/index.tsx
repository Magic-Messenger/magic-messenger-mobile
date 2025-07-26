import { Colors, commonStyle } from "@/constants";
import { useAppStore } from "@/store";
import { heightPixel, spacingPixel, widthPixel } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

export const TorBadge = () => {
  const { tor } = useAppStore();

  return (
    <LinearGradient
      colors={Colors.buttonPrimary as never}
      start={{ y: 0, x: 0 }}
      end={{ y: 1, x: 0 }}
      style={[
        styles.bedge,
        commonStyle.alignItemsCenter,
        commonStyle.justifyContentCenter,
        commonStyle.gap2,
        commonStyle.pl2,
        commonStyle.pr2,
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

const styles = StyleSheet.create({
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
