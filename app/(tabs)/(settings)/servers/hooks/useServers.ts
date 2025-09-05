import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useThemedStyles } from "@/theme";

export const useServers = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const title = t("servers.title", { status: `2/3` });

  const handleDisconnect = () => {};
  const handleReconnect = () => {};
  const handleConnect = () => {};

  return { t, styles, title, handleConnect, handleDisconnect, handleReconnect };
};

const createStyle = () => StyleSheet.create({});
