import { AppLayout, Button, SectionHeader, ThemedText } from "@/components";
import { Colors, commonStyle } from "@/constants";
import { useUserStore } from "@/store";
import { copyToClipboard, spacingPixel } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type RouteParams = {
  accessToken: string;
  securityPhrases: string;
  userName: string;
};

const SecurityPhrasesScreen = () => {
  const { t } = useTranslation();
  const { login } = useUserStore();

  const params = useLocalSearchParams<RouteParams>();

  const securityPhrases = params?.securityPhrases?.split(",");

  const copyPhrases = () => {
    if (securityPhrases) {
      copyToClipboard(
        securityPhrases
          ?.map((itm) => itm)
          .toString()
          .replaceAll(",", "")
          .trim(),
        t("securityPhrases.phrases.successCopyClipboard")
      );
    }
  };

  const handleNext = async () => {
    if (securityPhrases && params?.accessToken && params?.userName) {
      await login(params?.accessToken as string, params?.userName as string);
      router.push("/(tabs)/home");
    }
  };

  return (
    <AppLayout
      container
      scrollable
      footer={
        <Button
          type="primary"
          label={t("register.button")}
          onPress={handleNext}
        />
      }
    >
      <View style={styles.mainContainer}>
        <SectionHeader
          title={t("securityPhrases.sectionTitle")}
          description={t("securityPhrases.subtitle")}
        />

        <View style={styles.phrasesContainer}>
          {securityPhrases?.map((item, index) => (
            <View style={styles.phrasesItem} key={`index_${index}`}>
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
  mainContainer: {},
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
