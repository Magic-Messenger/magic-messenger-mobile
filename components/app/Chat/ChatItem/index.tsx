import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ContactItem, ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";

import { chatDateFormatter } from "../../../../utils/helper";
import { spacingPixel } from "../../../../utils/pixelHelper";

interface ChatItemProps extends React.ComponentProps<typeof ContactItem> {
  chatId?: string;
  publicKey?: string;
  groupName?: string;
  contactUsername: string;
  isGroupChat?: boolean;
  lastMessageTime?: string | null;
  unreadMessagesCount?: number;
  groupKey?: string;
  groupNonce?: string;
  groupAccountCount?: string;
  groupAdminAccount?: string;
}

export function ChatItem({
  chatId,
  publicKey,
  groupName,
  contactUsername,
  nickname,
  isGroupChat,
  lastMessageTime,
  unreadMessagesCount,
  groupKey,
  groupNonce,
  groupAccountCount,
  groupAdminAccount,
}: ChatItemProps) {
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();

  const chatTitle = useMemo(() => {
    return isGroupChat
      ? (groupName ?? "")
      : (nickname ?? contactUsername ?? "");
  }, [isGroupChat, groupName, nickname, contactUsername]);

  const handleGoToChat = () => {
    if (isGroupChat) {
      router.push({
        pathname: "/groupChatDetail/screens",
        params: {
          chatId: chatId,
          groupKey,
          groupNonce,
          userName: chatTitle,
          groupAccountCount,
          groupAdminAccount,
          isGroupChat: (isGroupChat as never) ?? false,
        },
      });
    } else {
      router.push({
        pathname: "/chatDetail/screens",
        params: {
          chatId: chatId,
          publicKey: publicKey,
          userName: chatTitle,
          isGroupChat: (isGroupChat as never) ?? false,
        },
      });
    }
  };

  return (
    <ContactItem
      nickname={chatTitle}
      contactUsername={
        lastMessageTime ? chatDateFormatter(lastMessageTime) : t("recently")
      }
      customAction={
        unreadMessagesCount && unreadMessagesCount > 0 ? (
          <View style={styles.chatItem}>
            <ThemedText weight="semiBold" size={11}>
              {unreadMessagesCount}
            </ThemedText>
          </View>
        ) : (
          <></>
        )
      }
      onAction={{
        onPress: handleGoToChat,
      }}
    />
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    chatItem: {
      borderRadius: spacingPixel(20),
      backgroundColor: colors.secondary,
      width: spacingPixel(24),
      height: spacingPixel(24),
      justifyContent: "center",
      alignItems: "center",
    },
  });
