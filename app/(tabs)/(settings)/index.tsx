import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

import {
  AppLayout,
  Icon,
  IconLibrary,
  IconNameForLibrary,
  ThemedText,
} from "@/components";
import { Colors, flexBox, spacing } from "@/constants";
import { useUserStore } from "@/store";
import { fontPixel, widthPixel } from "@/utils";

type SettingsItem = {
  label: string;
  iconType?: IconLibrary;
  iconName: IconNameForLibrary<IconLibrary>;
  onPress?: () => void;
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { logout, isLogin } = useUserStore();

  const settingList = [
    {
      label: t("settings.profile"),
      iconType: "feather",
      iconName: "user",
      onPress: () => router.push("/(tabs)/(settings)/profile/screens/profile"),
    },
    {
      label: t("settings.contact"),
      iconType: "feather",
      iconName: "message-circle",
      onPress: () => router.push("/(tabs)/(settings)/contacts/screens/list"),
    },
    {
      label: t("settings.scan-qr"),
      iconType: "ionicons",
      iconName: "qr-code-outline",
      onPress: () => router.push("/(tabs)/(settings)/scanQr/screens/scanQr"),
    },
    {
      label: t("settings.license"),
      iconType: "entypo",
      iconName: "text-document",
      onPress: () => router.push("/(tabs)/(settings)/license/screens/license"),
    },
    {
      label: t("settings.settings"),
      iconType: "feather",
      iconName: "settings",
      onPress: () =>
        router.push("/(tabs)/(settings)/settings/screens/settings"),
    },
    {
      label: t("settings.server"),
      iconType: "feather",
      iconName: "server",
      onPress: () => router.push("/(tabs)/(settings)/servers/screens/servers"),
    },
    {
      label: t("settings.support"),
      iconType: "material-community",
      iconName: "comment-question-outline",
      onPress: () => router.push("/(tabs)/(settings)/support/screens/support"),
    },
    {
      label: t("settings.logout"),
      iconType: "feather",
      iconName: "log-out",
      onPress: logout,
    },
  ] as SettingsItem[];

  const renderItem = useMemo(
    () =>
      ({ item }: { item: SettingsItem }) => {
        return (
          <TouchableOpacity onPress={item?.onPress}>
            <View style={styles.settingItem}>
              {item?.iconName && (
                <Icon
                  type={item.iconType}
                  name={item.iconName}
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
    [],
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
