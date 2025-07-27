import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors, commonStyle, Images } from "../../../../constants";
import {
  copyToClipboard,
  heightPixel,
  spacingPixel,
  widthPixel,
} from "../../../../utils";
import { Icon } from "../../../ui";
import { ThemedText } from "../../ThemedText";

interface Props {
  nickname: string;
  contactUsername: string;
  onAction?: {
    copy?: boolean;
    onEdit?: () => void;
    onRedirect?: () => void;
  };
}

export const ContactItem = ({ nickname, contactUsername, onAction }: Props) => {
  const { t } = useTranslation();

  const onCopy = () => {
    if (contactUsername) {
      copyToClipboard(contactUsername, t("contacts.successCopyUserName"));
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.5}>
      <LinearGradient
        colors={Colors.buttonPrimary as never}
        start={{ y: 0, x: 1 }}
        end={{ y: 1, x: 0 }}
        style={styles.contactItem}
      >
        <Image
          contentFit="contain"
          source={Images.icon}
          style={styles.iconImage}
        />

        <View style={[commonStyle.flex, commonStyle.gap1]}>
          <ThemedText type="default" weight="semiBold" size={16}>
            {nickname ?? ""}
          </ThemedText>
          <ThemedText type="default" weight="regular" size={12}>
            {contactUsername ?? ""}
          </ThemedText>
        </View>

        <View
          style={[
            commonStyle.flexRow,
            commonStyle.justifyContentEnd,
            commonStyle.gap3,
          ]}
        >
          {onAction?.copy && (
            <TouchableOpacity onPress={onCopy}>
              <Icon type="feather" name="copy" size={23} />
            </TouchableOpacity>
          )}

          {onAction?.onEdit && (
            <TouchableOpacity onPress={onAction.onEdit}>
              <Icon type="feather" name="edit" size={23} />
            </TouchableOpacity>
          )}

          {onAction?.onRedirect && (
            <TouchableOpacity onPress={onAction.onRedirect}>
              <Icon type="feather" name="chevron-right" size={23} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingPixel(10),
    paddingHorizontal: spacingPixel(10),
    paddingVertical: spacingPixel(7),
    borderRadius: widthPixel(10),
  },
  iconImage: {
    width: widthPixel(35),
    height: heightPixel(35),
  },
});
