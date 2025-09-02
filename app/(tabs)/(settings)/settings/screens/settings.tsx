import React from "react";
import { View } from "react-native";

import { AppLayout, SettingsItem } from "@/components";

import { useSettings } from "../hooks";

export default function SettingsScreen() {
  const { t, isLoading, styles, settingsData, handleSettingsChange } =
    useSettings();

  return (
    <AppLayout
      container
      scrollable
      title={t("settings.title")}
      loading={isLoading}
    >
      {!isLoading && (
        <View style={styles.flex}>
          <SettingsItem
            title="settings.deleteButton"
            description="settings.deleteButtonDescription"
            value={settingsData?.deleteButton ?? false}
            onSettingsChanged={(val) =>
              handleSettingsChange("deleteButton", val)
            }
          />

          <SettingsItem
            title="settings.deleteMyMessages"
            description="settings.deleteMyMessagesDescription"
            value={settingsData?.autoDeleteMessagesHours ?? 24}
            options={[
              { label: "24h", value: 24 },
              { label: "48h", value: 48 },
              { label: "72h", value: 72 },
              { label: "5d", value: 120 },
            ]}
            onSettingsChanged={(val) =>
              handleSettingsChange("autoDeleteMessagesHours", val)
            }
          />

          <SettingsItem
            title="settings.voiceTransformer"
            description="settings.voiceTransformerDescription"
            value={settingsData?.voiceTransformer ?? false}
            onSettingsChanged={(val) =>
              handleSettingsChange("voiceTransformer", val)
            }
          />
        </View>
      )}
    </AppLayout>
  );
}
