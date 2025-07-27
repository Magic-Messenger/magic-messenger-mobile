import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { commonStyle, Images } from "../../../../constants";
import { heightPixel, widthPixel } from "../../../../utils";
import { ThemedText } from "../../ThemedText";

interface Props {}

export const ContactScanQr = ({}: Props) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/(settings)/contacts/scanQr")}
    >
      <View
        style={[
          commonStyle.flexRow,
          commonStyle.alignItemsCenter,
          commonStyle.gap3,
        ]}
      >
        <Image
          source={Images.logoSymbol}
          style={{ width: widthPixel(23), height: heightPixel(23) }}
        />

        <ThemedText type="subtitle" size={16}>
          {t("contacts.scanQRCode")}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};
