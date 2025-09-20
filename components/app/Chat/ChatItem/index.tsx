import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { ContactItem, ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";
import { chatDateFormatter, spacingPixel } from "@/utils";

interface ChatItemProps extends React.ComponentProps<typeof ContactItem> {
  chatId?: string;
  publicKey?: string;
  groupName?: string;
  contactUsername: string;
  isGroupChat?: boolean;
  lastMessageTime?: string | null;
  unreadMessagesCount?: number;
}

export function ChatItem({
  chatId,
  publicKey,
  groupName,
  contactUsername,
  isGroupChat,
  lastMessageTime,
  unreadMessagesCount,
}: ChatItemProps) {
  const styles = useThemedStyles(createStyle);

  return (
    <ContactItem
      nickname={isGroupChat ? (groupName ?? "") : (contactUsername ?? "")}
      contactUsername={
        lastMessageTime ? chatDateFormatter(lastMessageTime ?? "") : "-"
      }
      customAction={
        unreadMessagesCount &&
        unreadMessagesCount > 0 && (
          <View style={styles.chatItem}>
            <ThemedText weight="semiBold" size={11}>
              {unreadMessagesCount}
            </ThemedText>
          </View>
        )
      }
      onAction={{
        onPress: () =>
          router.push({
            pathname: "/chatDetail/screens",
            params: {
              chatId: chatId,
              publicKey: publicKey,
              userName: contactUsername,
            },
          }),
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
