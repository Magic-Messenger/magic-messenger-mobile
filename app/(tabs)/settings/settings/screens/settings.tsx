import React from "react";
import { FlatList, View } from "react-native";

import { AppLayout } from "@/components";

import { useSettings } from "../hooks";

const SettingsScreen = () => {
  const { t, styles, isLoading, settingsItems, renderItem } = useSettings();

  return (
    <AppLayout
      container
      scrollable={false}
      title={t("settings.title")}
      loading={isLoading}
    >
      <View style={styles.flex}>
        <FlatList
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          data={settingsItems}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </AppLayout>
  );
};

export default SettingsScreen;
