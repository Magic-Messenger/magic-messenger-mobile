import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";

import { MessageDto } from "@/api/models";
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

  // Memoized render function for better performance
  const renderItem = useCallback(
    ({ item }: { item: MessageDto }) => (
      <MessageItem
        identifier={chatId}
        message={item}
        receiverPublicKey={usersPublicKey.receiverPublicKey}
        onReply={handleReply}
      />
    ),
    [chatId, usersPublicKey.receiverPublicKey, handleReply],
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback(
    (item: MessageDto) => item.messageId || `temp-${item.createdAt}`,
    [],
  );

  const getItemType = useCallback((item: MessageDto) => {
    return item.messageType; // "text", "image", "audio", "video"
  }, []);

  // Footer component
  const renderFooter = useCallback(
    () => <ChatTyping chatId={chatId} />,
    [chatId],
  );

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
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainerStyle}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          getItemType={getItemType}
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
      paddingHorizontal: spacingPixel(15),
      paddingTop: spacingPixel(10),
    },
  });
