import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";

import { AppLayout } from "@/components";

import { useSettings } from "../hooks";

const SettingsScreen = () => {
  const { t, styles, isLoading, settingsItems, renderItem } = useSettings();

  return (
    <AppLayout container title={t("settings.title")} loading={isLoading}>
      <View style={styles.flex}>
        <FlashList
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
