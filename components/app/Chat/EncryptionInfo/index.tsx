import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { ThemedText } from "../../ThemedText";

export function EncryptionInfo() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <LinearGradient
      colors={Colors.buttonPrimary as never}
      start={{ y: 0, x: 1 }}
      end={{ y: 1, x: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <ThemedText size={13} center>
          {t("chatDetail.encryptionInfo")}
        </ThemedText>
      </View>
    </LinearGradient>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      borderRadius: spacingPixel(10),
    },
    content: {
      flex: 1,
      flexDirection: "row",
      padding: spacingPixel(10),
    },
  });
