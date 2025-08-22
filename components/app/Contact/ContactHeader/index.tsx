import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ColorDto, useThemedStyles } from "../../../../theme";
import { heightPixel, widthPixel } from "../../../../utils";
import { Button, Input } from "../../../ui";
import { ThemedText } from "../../ThemedText";

interface Props {
  setSearchText: (_text: string) => void;
}

export const ContactHeader = ({ setSearchText }: Props) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <View>
      <View style={styles.flexRow}>
        <ThemedText type="title" weight="semiBold" size={20}>
          {t("contacts.title")}
        </ThemedText>

        <View
          style={[
            styles.flex,
            styles.gap3,
            styles.flexRow,
            styles.justifyContentEnd,
          ]}
        >
          <Button
            type="primary"
            label={t("contacts.blocked")}
            style={styles.contactButton}
            textProps={{
              size: 14,
            }}
          />
          <Button
            type="secondary"
            label={t("contacts.addUser")}
            onPress={() => router.push("/(tabs)/(settings)/contacts/add")}
            style={styles.contactButton}
            textProps={{
              size: 14,
            }}
          />
        </View>
      </View>

      <Input
        placeholder={t("common.search")}
        style={[styles.mt5, styles.mb5]}
        onChangeText={(_text) => setSearchText(_text)}
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
      width: widthPixel(85),
      height: heightPixel(30),
    },
  });
