import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ColorDto, useThemedStyles } from "../../../../theme";
import { heightPixel, widthPixel } from "../../../../utils";
import { Button, Input } from "../../../ui";
import { ThemedText } from "../../ThemedText";

interface Props {
  setSearchText: (_text: string) => void;
  searchText?: string;
  searchPlaceholder?: string;
  onBlockedPress?: () => void;
  isBlocked?: boolean;
  isShowBlocked?: boolean;
  addContactRoute?: string;
  showTitle?: boolean;
}

export const ContactHeader = ({
  setSearchText,
  searchText,
  searchPlaceholder,
  onBlockedPress,
  isBlocked,
  isShowBlocked = true,
  addContactRoute = "/(tabs)/settings/contacts/screens/add",
  showTitle = true,
}: Props) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <View>
      <View style={[styles.flexRow, styles.gap3, styles.justifyContentEnd]}>
        {isShowBlocked && (
          <Button
            type="primary"
            label={
              !isBlocked ? t("contacts.blocked") : t("contacts.allContacts")
            }
            style={styles.contactButton}
            textProps={{
              size: 14,
            }}
            onPress={onBlockedPress}
          />
        )}
        <Button
          type="secondary"
          label={t("contacts.addUser")}
          onPress={() => router.push(addContactRoute as any)}
          style={styles.contactButton}
          textProps={{
            size: 14,
          }}
        />
      </View>

      <Input
        placeholder={searchPlaceholder || t("common.search")}
        style={[styles.mt5, styles.mb5]}
        value={searchText}
        onChangeText={(_text) => setSearchText(_text)}
        rightIcon={{
          type: "feather",
          name: "search",
        }}
      />

      {showTitle && (
        <ThemedText type="title" weight="semiBold" size={20}>
          {t("contacts.yourContacts")}
        </ThemedText>
      )}
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
