import ExpoTor from "expo-tor";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";

import { useTorStore } from "@/store";
import { useThemedStyles } from "@/theme";

export const useServers = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const isLoading = useTorStore((state) => state.isLoading);
  const isConnected = useTorStore((state) => state.torState?.connected);
  const startTor = useTorStore((state) => state.startTor);
  const stopTor = useTorStore((state) => state.stopTor);

  const title = useMemo(
    () => t("servers.title", { status: isConnected ? `3/3` : `2/3` }),
    [t, isConnected],
  );

  const handleDisconnect = () => {
    stopTor();
  };
  const handleReconnect = async () => {
    await stopTor();
    setTimeout(() => {
      startTor();
    }, 1500);
  };
  const handleConnect = () => startTor();

  const handleCheckConnection = async () => {
    const response = await ExpoTor.makeRequest(
      "https://check.torproject.org/api/ip",
      {
        method: "GET",
      },
    );
    if (response?.data) {
      const data = JSON.parse(response.data);
      if (data?.IsTor) {
        Alert.alert(t("servers.torStatusTitle"), t("servers.torWorking"));
      } else {
        Alert.alert(t("servers.torStatusTitle"), t("servers.torNotWorking"));
      }
    }
  };

  return {
    t,
    styles,
    title,
    isLoading,
    isConnected,
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleCheckConnection,
  };
};

const createStyle = () => StyleSheet.create({});
