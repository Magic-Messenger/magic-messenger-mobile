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
import { ColorDto, useThemedStyles } from "@/theme";
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
    onlineUsers,
    typingUsername,
    usersPublicKey,
    replyMessage,
    handleChatControl,
    handleReply,
    onClearReply,
  } = useDetail();

  return (
    <ChatLayout
      header={
        <ChatHeader
          onlineUsers={onlineUsers}
          typingUsername={typingUsername as string}
          userName={userName as string}
        />
      }
      footer={
        <ChatFooter
          identifier={chatId!}
          replyMessage={replyMessage}
          onSend={handleChatControl}
          onClearReply={onClearReply}
        />
      }
    >
      <LoadingProvider loading={loading}>
        <FlashList
          ref={listRef}
          data={messages}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={({ item }) => (
            <MessageItem
              message={item as never}
              receiverPublicKey={usersPublicKey.receiverPublicKey}
              onReply={handleReply}
            />
          )}
          ListFooterComponent={<ChatTyping typingUsername={typingUsername} />}
        />
      </LoadingProvider>
    </ChatLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    contentContainerStyle: {
      flexDirection: "column",
      paddingHorizontal: spacingPixel(15),
    },
  });
