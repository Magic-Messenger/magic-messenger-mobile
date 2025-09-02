import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import {
  getGetApiAccountGetProfileQueryKey,
  useGetApiAccountGetProfile,
  usePostApiAccountChangeAccountSettings,
} from "@/api/endpoints/magicMessenger";
import type { AccountProfileDto } from "@/api/models";
import { useThemedStyles } from "@/theme";

export const useSettings = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetApiAccountGetProfile();
  const { mutateAsync: changeAccountSettings } =
    usePostApiAccountChangeAccountSettings();

  const [settingsData, setSettingsData] = useState<
    AccountProfileDto | undefined
  >();

  const handleSettingsChange = async (key: string, value: boolean | number) => {
    setSettingsData({
      ...settingsData,
      [key]: value,
    });
    await changeAccountSettings({
      data: {
        ...data?.data,
        [key]: value,
      },
    });
    const queryKey = getGetApiAccountGetProfileQueryKey();
    await queryClient.invalidateQueries(queryKey as never);
  };

  useEffect(() => {
    if (data?.data) {
      setSettingsData(data.data);
    }
  }, [data?.data]);

  return { t, isLoading, styles, settingsData, handleSettingsChange };
};

const createStyle = () => StyleSheet.create({});
