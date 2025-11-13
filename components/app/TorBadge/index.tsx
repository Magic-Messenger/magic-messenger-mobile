import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants";
import { useTor } from "@/services/axios/tor";
import { useThemedStyles } from "@/theme";

import {
  heightPixel,
  spacingPixel,
  widthPixel,
} from "../../../utils/pixelHelper";
import { GradientBackground } from "../../ui/GradientBackground";
import { ThemedText } from "../ThemedText";

export const TorBadge = () => {
  const { isConnected, isStarting } = useTor();
  const styles = useThemedStyles(createStyle);
  return (
    <GradientBackground
      style={[
        styles.badge,
        styles.alignItemsCenter,
        styles.justifyContentCenter,
        styles.gap2,
        styles.pl2,
        styles.pr2,
      ]}
    >
      <View
        style={[
          styles.badgeStatus,
          isConnected
            ? styles.active
            : isStarting
              ? styles.starting
              : styles.inActive,
        ]}
      />
      <ThemedText type="default" weight="semiBold">
        Tor
      </ThemedText>
    </GradientBackground>
  );
};

const createStyle = () =>
  StyleSheet.create({
    badge: {
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
    starting: {
      backgroundColor: Colors.warning,
    },
  });
