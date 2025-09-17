import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet } from "react-native";

import {
  ChatFooter,
  ChatHeader,
  ChatLayout,
  ChatTyping,
  LoadingProvider,
  TicketMessageItem,
} from "@/components";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { useTicketDetail } from "../hooks";

export default function TicketDetailScreen() {
  const styles = useThemedStyles(createStyle);

  const {
    loading,
    ticketDetail,
    messages,
    listRef,
    onlineUsers,
    typingUsername,
    handleChatControl,
  } = useTicketDetail();

  return (
    <ChatLayout
      header={
        <ChatHeader
          onlineUsers={onlineUsers}
          typingUsername={typingUsername as string}
          userName="Magic Messenger"
        />
      }
      footer={
        <ChatFooter
          identifier={ticketDetail?.ticketId!}
          onSend={(message) => handleChatControl(message as string)}
          displaySendMessageAlways
        />
      }
    >
      <LoadingProvider loading={loading}>
        <FlashList
          ref={listRef}
          data={messages}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={({ item }) => <TicketMessageItem {...item} />}
          ListFooterComponent={<ChatTyping typingUsername={typingUsername} />}
        />
      </LoadingProvider>
    </ChatLayout>
  );
}

const createStyle = () =>
  StyleSheet.create({
    contentContainerStyle: {
      flexDirection: "column",
      paddingHorizontal: spacingPixel(15),
    },
  });
