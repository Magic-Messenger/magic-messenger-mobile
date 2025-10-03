import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet } from "react-native";

import {
  ChatFooter,
  ChatHeader,
  ChatLayout,
  ChatTyping,
  LoadingProvider,
  MessageGroupItem,
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
    typingUsername,
    groupAccountCount,
    replyMessage,
    handleChatControl,
    handleReply,
    onClearReply,
    handleScroll,
  } = useDetail();

  return (
    <ChatLayout
      header={
        <ChatHeader
          isGroupChat={true}
          groupAccountCount={groupAccountCount as string}
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={({ item }) => (
            <MessageGroupItem
              identifier={chatId!}
              message={item as never}
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
