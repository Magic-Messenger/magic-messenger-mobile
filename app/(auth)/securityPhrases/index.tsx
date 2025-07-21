import { AppLayout, Button, SectionHeader, ThemedText } from "@/components";
import { Colors, commonStyle, spacing } from "@/constants";
import { copyToClipboard, shotToast, spacingPixel } from "@/utils";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const SecurityPhrasesScreen = () => {
  const { t } = useTranslation();

  /* TEMP */
  const securityPhrases = [
    "3232",
    "212E",
    "23F4",
    "GE23",
    "3232",
    "212E",
    "23F4",
    "GE23",
    "3232",
  ];
  /* TEMP */

  const copyPhrases = () => {
    if (securityPhrases) {
      copyToClipboard(
        securityPhrases
          ?.map((itm) => itm)
          .toString()
          .replaceAll(",", "")
          .trim()
      );

      shotToast({
        type: "success",
        text1: t("securityPhrases.phrases.successCopyClipboard"),
      });
    }
  };

  return (
    <AppLayout
      container
      scrollable
      footer={<Button type="primary" label={t("register.button")} />}
    >
      <View style={styles.mainContainer}>
        <SectionHeader
          title={t("securityPhrases.sectionTitle")}
          description={t("securityPhrases.subtitle")}
        />

        <View style={styles.phrasesContainer}>
          {securityPhrases?.map((item, index) => (
            <View key={index} style={styles.phrasesItem}>
              <ThemedText>{item}</ThemedText>
            </View>
          ))}
        </View>

        <View style={commonStyle.mt5}>
          <TouchableOpacity onPress={copyPhrases}>
            <View style={styles.phrasesInfoContainer}>
              <ThemedText type="title">
                {t("securityPhrases.phrases.title")}
              </ThemedText>
              <ThemedText type="subtitle">
                {t("securityPhrases.phrases.message")}
              </ThemedText>
              <ThemedText type="link">
                {t("securityPhrases.phrases.copy")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    ...spacing({
      mt: 60,
    }),
  },
  phrasesContainer: {
    flex: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: Colors.secondary,
    padding: spacingPixel(20),
    justifyContent: "center",
    borderRadius: 10,
  },
  phrasesItem: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 15,
    width: "30%",
  },
  phrasesInfoContainer: {
    padding: spacingPixel(20),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.white,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 2,
  },
});

export default SecurityPhrasesScreen;
