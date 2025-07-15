import Logo from "@/assets/images/3d-logo.png";
import { AppImage, AppLayout, ThemedText } from "@/components";
import { commonStyle, flexBox } from "@/constants";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

export default function PreLoginScreen() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <View
        style={[
          commonStyle.flex,
          commonStyle.alignItemsCenter,
          commonStyle.justifyContentCenter,
        ]}
      >
        <View style={styles.mainContainer}>
          <AppImage source={Logo} style={styles.logoImage} />
          <ThemedText weight="semiBold">{t("welcome")}</ThemedText>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    ...flexBox(1, "column", "center", "center"),
  },
  logoImage: {
    width: 240,
    height: 60,
  },
});
