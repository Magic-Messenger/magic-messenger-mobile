import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Colors, Images } from "../../../../constants";
import { ColorDto, useThemedStyles } from "../../../../theme";
import {
  copyToClipboard,
  heightPixel,
  spacingPixel,
  widthPixel,
} from "../../../../utils";
import { Icon } from "../../../ui";
import { ThemedText } from "../../ThemedText";

export interface ContactItemProps {
  nickname: string;
  contactUsername: string;
  onAction?: {
    copy?: boolean;
    onEdit?: () => void;
    onRedirect?: () => void;
    onPress?: () => void;
  };
  customAction?: React.ReactNode;
}

export const ContactItem = ({
  nickname,
  contactUsername,
  onAction,
  customAction,
}: ContactItemProps) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const onCopy = () => {
    if (contactUsername) {
      copyToClipboard(contactUsername, t("contacts.successCopyUserName"));
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.5} onPress={onAction?.onPress}>
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

        <View style={[styles.flex, styles.gap1]}>
          <ThemedText type="default" weight="semiBold" size={16}>
            {nickname ?? ""}
          </ThemedText>
          <ThemedText type="default" weight="regular" size={12}>
            {contactUsername ?? ""}
          </ThemedText>
        </View>

        <View style={[styles.flexRow, styles.justifyContentEnd, styles.gap3]}>
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

          {customAction && customAction}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
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
