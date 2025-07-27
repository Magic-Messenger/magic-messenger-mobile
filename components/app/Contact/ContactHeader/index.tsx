import { commonStyle } from "@/constants";
import { heightPixel, widthPixel } from "@/utils";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, Input } from "../../../ui";
import { ThemedText } from "../../ThemedText";

interface Props {
  setSearchText: (_text: string) => void;
}

export const ContactHeader = ({ setSearchText }: Props) => {
  const { t } = useTranslation();
  return (
    <View>
      <View style={commonStyle.flexRow}>
        <ThemedText type="title" weight="semiBold" size={20}>
          {t("contacts.title")}
        </ThemedText>

        <View
          style={[
            commonStyle.flex,
            commonStyle.gap3,
            commonStyle.flexRow,
            commonStyle.justifyContentEnd,
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
            style={styles.contactButton}
            textProps={{
              size: 14,
            }}
          />
        </View>
      </View>

      <Input
        placeholder={t("common.search")}
        style={[commonStyle.mt5, commonStyle.mb5]}
        onChangeText={(_text) => setSearchText(_text)}
      />

      <ThemedText type="title" weight="semiBold" size={20}>
        {t("contacts.yourContacts")}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  contactButton: {
    width: widthPixel(85),
    height: heightPixel(30),
  },
});
