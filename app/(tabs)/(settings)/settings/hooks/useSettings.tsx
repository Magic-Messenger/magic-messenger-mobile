import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  useGetApiAccountGetProfile,
  usePostApiAccountChangeAccountSettings,
} from "@/api/endpoints/magicMessenger";
import { AccountProfileDto } from "@/api/models";
import { SettingsItem } from "@/components";
import { useUserStore } from "@/store";
import { useThemedStyles } from "@/theme";

export const useSettings = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles();

  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const { data, isLoading } = useGetApiAccountGetProfile();
  const { mutateAsync: changeAccountSettings } =
    usePostApiAccountChangeAccountSettings();

  const renderItem = ({ item }: { item: (typeof settingsItems)[0] }) => (
    <SettingsItem
      title={item.title}
      description={item.description}
      value={item.value}
      options={item.options}
      onSettingsChanged={item.onSettingsChanged}
    />
  );

  const handleSettingsChange = async (
    key: keyof AccountProfileDto,
    value: boolean | number,
  ) => {
    setProfile({
      ...profile,
      [key]: value,
    });

    setTimeout(async () => {
      await changeAccountSettings({
        data: {
          ...profile,
          [key]: value,
        },
      });
    }, 50);
  };

  const settingsItems = [
    {
      id: 1,
      title: "settings.deleteButton",
      description: "settings.deleteButtonDescription",
      value: profile?.deleteButton ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("deleteButton", value),
    },
    {
      id: 2,
      title: "settings.deleteMyMessages",
      description: "settings.deleteMyMessagesDescription",
      value: profile?.autoDeleteMessagesHours ?? 24,
      options: [
        { label: "24h", value: 24 },
        { label: "48h", value: 48 },
        { label: "72h", value: 72 },
        { label: "5d", value: 120 },
      ],
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("autoDeleteMessagesHours", value),
    },
    {
      id: 3,
      title: "settings.voiceMessageTransformer",
      description: "settings.voiceMessageTransformerDescription",
      value: profile?.voiceTransformer ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("voiceTransformer", value),
    },
    {
      id: 4,
      title: "settings.askForSpacePassword",
      description: "settings.askForSpacePasswordDescription",
      value: profile?.askSpacePassword ?? 10,
      options: [
        { label: "10m", value: 10 },
        { label: "15m", value: 15 },
        { label: "60m", value: 60 },
      ],
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("askSpacePassword", value),
    },
    {
      id: 5,
      title: "settings.torNetwork",
      description: "settings.torNetworkDescription",
      value: profile?.enableTor ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("enableTor", value),
    },
    {
      id: 6,
      title: "settings.pushNotifications",
      description: "settings.pushNotificationsDescription",
      value: profile?.enablePushNotifications ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("enablePushNotifications", value),
    },
    {
      id: 7,
      title: "settings.showOnlineStatus",
      description: "settings.showOnlineStatusDescription",
      value: profile?.enableOnlineStatus ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("enableOnlineStatus", value),
    },
    {
      id: 8,
      title: "settings.blockScreenshots",
      description: "settings.blockScreenshotsDescription",
      value: profile?.enableScreenShots ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("enableScreenShots", value),
    },
    {
      id: 9,
      title: "settings.readReceipts",
      description: "settings.readReceiptsDescription",
      value: profile?.enableReadReceipt ?? false,
      onSettingsChanged: (value: number | boolean) =>
        handleSettingsChange("enableReadReceipt", value),
    },
  ];

  useEffect(() => {
    if (data?.data) {
      setProfile(data?.data);
    }
  }, [data?.data]);

  return {
    t,
    styles,
    isLoading: isLoading,
    settingsItems,
    renderItem,
    handleSettingsChange,
  };
};
