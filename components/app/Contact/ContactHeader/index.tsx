import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ColorDto, useThemedStyles } from "../../../../theme";
import { heightPixel, widthPixel } from "../../../../utils";
import { Button, Input } from "../../../ui";
import { ThemedText } from "../../ThemedText";

interface Props {
  setSearchText: (_text: string) => void;
  onBlockedPress?: () => void;
  isBlocked?: boolean;
}

export const ContactHeader = ({
  setSearchText,
  onBlockedPress,
  isBlocked,
}: Props) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <View>
      <View style={[styles.flexRow, styles.gap3, styles.justifyContentEnd]}>
        <Button
          type="primary"
          label={!isBlocked ? t("contacts.blocked") : t("contacts.allContacts")}
          style={styles.contactButton}
          textProps={{
            size: 14,
          }}
          onPress={onBlockedPress}
        />
        <Button
          type="secondary"
          label={t("contacts.addUser")}
          onPress={() => router.push("/(tabs)/(settings)/contacts/screens/add")}
          style={styles.contactButton}
          textProps={{
            size: 14,
          }}
        />
      </View>

      <Input
        placeholder={t("common.search")}
        style={[styles.mt5, styles.mb5]}
        onChangeText={(_text) => setSearchText(_text)}
        rightIcon={{
          type: "feather",
          name: "search",
        }}
      />

      <ThemedText type="title" weight="semiBold" size={20}>
        {t("contacts.yourContacts")}
      </ThemedText>
    </View>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    contactButton: {
      height: heightPixel(30),
      width: widthPixel(110),
    },
  });
