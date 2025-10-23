import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet } from "react-native";

import {
  ChatFooter,
  ChatHeader,
  ChatLayout,
  ChatTyping,
  LoadingProvider,
  MessageItem,
} from "@/components";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { useDetail } from "../hooks";

export default function ChatScreen() {
  const styles = useThemedStyles(createStyle);

  const {
    loading,
    chatId,
    messages,
    userName,
    listRef,
    usersPublicKey,
    replyMessage,
    handleSendMessage,
    handleReply,
    handleScroll,
    onClearReply,
  } = useDetail();

  return (
    <ChatLayout
      header={
        <ChatHeader
          chatId={chatId}
          isGroupChat={false}
          userName={userName as string}
        />
      }
      footer={
        <ChatFooter
          chatId={chatId}
          replyMessage={replyMessage}
          onSend={handleSendMessage}
          onClearReply={onClearReply}
        />
      }
    >
      <LoadingProvider loading={loading}>
        <FlashList
          ref={listRef}
          data={messages}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={({ item }) => (
            <MessageItem
              identifier={chatId}
              message={item as never}
              receiverPublicKey={usersPublicKey.receiverPublicKey}
              onReply={handleReply}
            />
          )}
          ListFooterComponent={<ChatTyping chatId={chatId} />}
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
