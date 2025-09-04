import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Colors, spacing } from "../../../constants";
import { ColorDto, useThemedStyles } from "../../../theme";
import { heightPixel, spacingPixel, widthPixel } from "../../../utils";
import { ThemedText } from "../ThemedText";

interface Props {
  productName: string;
  price: string;
  onPress?: () => void;
}

export const ProductItem = ({ productName, price, onPress }: Props) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <LinearGradient
        colors={Colors.buttonPrimary as never}
        start={{ y: 0, x: 1 }}
        end={{ y: 1, x: 0 }}
        style={styles.productItem}
      >
        <ThemedText weight="semiBold" size={18}>
          {productName ?? ""}
        </ThemedText>

        <View style={styles.row}>
          <View>
            <ThemedText weight="semiBold" size={10}>
              {t("license.price")}
            </ThemedText>
            <View style={[styles.flexRow, styles.mt1]}>
              <ThemedText weight="semiBold" size={16}>
                {price ?? ""} /
              </ThemedText>
              <ThemedText style={styles.oneTime} weight="semiBold" size={12}>
                {t("license.oneTime")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buyButton}>
            <ThemedText weight="bold" size={12}>
              {t("license.buyNow")}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      height: heightPixel(110),
      marginVertical: spacingPixel(8),
    },
    productItem: {
      flex: 1,
      paddingHorizontal: spacingPixel(18),
      paddingVertical: spacingPixel(24),
      borderRadius: widthPixel(10),
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      ...spacing({
        mt: 16,
      }),
    },
    oneTime: {
      ...spacing({
        ml: 5,
        mt: 3,
      }),
      color: Colors.inactiveColor,
    },
    buyButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors.black,
      borderRadius: widthPixel(5),
      ...spacing({
        pl: 16,
        pr: 16,
        pt: 8,
        pb: 8,
      }),
    },
  });
