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

  const { loading, ticketId, messages, listRef, handleChatControl } =
    useTicketDetail();

  return (
    <ChatLayout
      header={
        <ChatHeader
          chatId={ticketId as string}
          isGroupChat={false}
          userName="Magic Messenger"
        />
      }
      footer={
        <ChatFooter
          chatId={ticketId as string}
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
          ListFooterComponent={<ChatTyping chatId={ticketId as string} />}
          drawDistance={400}
          removeClippedSubviews
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
          }}
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
