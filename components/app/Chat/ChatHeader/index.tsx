import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppImage, ThemedText, TorBadge } from "@/components";
import { Images } from "@/constants";
import { useSignalRStore } from "@/store";
import { useThemedStyles } from "@/theme";

import { spacingPixel, widthPixel } from "../../../../utils/pixelHelper";

interface ChatHeaderProps {
  chatId: string;
  userName?: string;
  isGroupChat?: boolean;
  groupAccountCount?: string;
}

export function ChatHeader({
  chatId,
  userName,
  isGroupChat = false,
  groupAccountCount,
}: ChatHeaderProps) {
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();

  const onlineUsers = useSignalRStore((s) => s.onlineUsers);
  const typingUsers = useSignalRStore((s) => s.typingUsers);

  const checkIsOnline = useMemo(() => {
    if (!userName || !onlineUsers) return false;
    return onlineUsers.includes(userName);
  }, [onlineUsers, userName]);

  const isTyping = useMemo(() => {
    if (!userName || !typingUsers) return false;
    return typingUsers.some((x) => x.chatId === chatId && userName);
  }, [typingUsers, userName]);

  return (
    <View
      style={[
        styles.container,
        styles.flexRow,
        styles.alignItemsCenter,
        styles.mb4,
      ]}
    >
      <View
        style={[
          styles.flex,
          styles.flexRow,
          styles.alignItemsCenter,
          styles.gap2,
        ]}
      >
        <AppImage source={Images.icon} style={styles.avatar} />
        <View>
          <ThemedText type="title" size={16} numberOfLines={1}>
            {userName}
          </ThemedText>
          {isGroupChat ? (
            <ThemedText type="subtitle">
              {isTyping ? t("chat.typing") : (groupAccountCount ?? "-")}
            </ThemedText>
          ) : (
            <ThemedText type="subtitle">
              {isTyping
                ? t("chat.typing")
                : checkIsOnline
                  ? t("chat.online")
                  : t("chat.offline")}
            </ThemedText>
          )}
        </View>
      </View>

      <View
        style={[styles.flex, styles.justifyContentEnd, styles.alignItemsEnd]}
      >
        <TorBadge />
      </View>
    </View>
  );
}

const createStyle = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacingPixel(15),
    },
    avatar: {
      width: widthPixel(40),
      height: widthPixel(40),
    },
  });
