import { AppLayout, Icon, ThemedText } from "@/components";
import { Colors, flexBox, spacing } from "@/constants";
import { fontPixel, widthPixel } from "@/utils";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { t } = useTranslation();

  const settingList = [
    {
      label: t("settings.profile"),
      icon: "user",
      onPress: () => router.push("/(tabs)/(settings)/profile"),
    },
    {
      label: t("settings.contact"),
      icon: "message-circle",
      onPress: () => router.push("/(tabs)/(settings)/contacts"),
    },
    {
      label: t("settings.scan-qr"),
      icon: "camera",
    },
    {
      label: t("settings.license"),
      icon: "mail",
    },
    {
      label: t("settings.settings"),
      icon: "settings",
    },
    {
      label: t("settings.server"),
      icon: "server",
    },
    {
      label: t("settings.support"),
      icon: "mail",
    },
  ];

  const renderItem = useMemo(
    () =>
      ({ item }: { item: (typeof settingList)[0] }) => {
        return (
          <TouchableOpacity onPress={item?.onPress}>
            <View style={styles.settingItem}>
              {item?.icon && (
                <Icon
                  type="feather"
                  name={item.icon as never}
                  color={Colors.white}
                  size={widthPixel(23)}
                />
              )}

              <ThemedText
                type="default"
                weight="medium"
                style={{ fontSize: fontPixel(15) }}
              >
                {item?.label}
              </ThemedText>

              <View style={styles.settingItemRedirectButton}>
                <Icon
                  type="feather"
                  name="chevron-right"
                  color={Colors.white}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      },
    []
  );

  return (
    <AppLayout container scrollable={false} title={t("settings.title")}>
      <FlatList
        data={settingList}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ ...spacing({ gap: 40 }) }}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    ...flexBox(1, "row"),
    ...spacing({
      gap: 10,
    }),
    alignItems: "center",
  },
  settingItemRedirectButton: {
    flex: 1,
    alignItems: "flex-end",
  },
});
