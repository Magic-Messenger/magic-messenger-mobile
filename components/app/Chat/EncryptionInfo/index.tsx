import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { GradientBackground } from "../../../ui/GradientBackground";
import { ThemedText } from "../../ThemedText";

export function EncryptionInfo() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.content}>
        <ThemedText size={13} center>
          {t("chatDetail.encryptionInfo")}
        </ThemedText>
      </View>
    </GradientBackground>
  );
}

const createStyle = () =>
  StyleSheet.create({
    container: {
      borderRadius: spacingPixel(10),
      marginHorizontal: spacingPixel(15),
    },
    content: {
      flexDirection: "row",
      padding: spacingPixel(10),
    },
  });
