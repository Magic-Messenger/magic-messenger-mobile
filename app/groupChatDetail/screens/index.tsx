import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";

import {
  ChatFooter,
  ChatHeader,
  ChatLayout,
  ChatTyping,
  DateSeparator,
  EncryptionInfo,
  LoadingProvider,
  MessageGroupItem,
} from "@/components";
import { useThemedStyles } from "@/theme";
import { isDateSeparator, MessageWithDate, spacingPixel } from "@/utils";

import { useDetail } from "../hooks";

export default function ChatScreen() {
  const styles = useThemedStyles(createStyle);

  const {
    loading,
    chatId,
    messages,
    groupedMessages,
    userName,
    listRef,
    groupAccountCount,
    replyMessage,
    handleChatControl,
    handleReply,
    onClearReply,
    handleScroll,
  } = useDetail();

  // Memoized render function for better performance
  const renderItem = useCallback(
    ({ item }: { item: MessageWithDate }) => {
      if (isDateSeparator(item)) {
        return <DateSeparator date={item.date} />;
      }
      return (
        <MessageGroupItem
          identifier={chatId}
          message={item}
          onReply={handleReply}
        />
      );
    },
    [chatId, handleReply]
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback((item: MessageWithDate, index: number) => {
    if (isDateSeparator(item)) {
      return `date-${item.date}-${index}`;
    }
    return item.messageId || `temp-${item.createdAt}`;
  }, []);

  // Footer component
  const renderFooter = useCallback(
    () => <ChatTyping chatId={chatId} />,
    [chatId]
  );

  // Optional: Item type for better recycling
  const getItemType = useCallback((item: MessageWithDate) => {
    if (isDateSeparator(item)) {
      return "date";
    }
    return item.messageType; // "text", "image", "audio", "video"
  }, []);

  return (
    <ChatLayout
      header={
        <ChatHeader
          chatId={chatId}
          isGroupChat={true}
          groupAccountCount={groupAccountCount as string}
          userName={userName as string}
        />
      }
      footer={
        <ChatFooter
          chatId={chatId}
          replyMessage={replyMessage}
          onSend={handleChatControl}
          onClearReply={onClearReply}
        />
      }
    >
      <LoadingProvider loading={loading}>
        <FlashList
          ref={listRef}
          data={groupedMessages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainerStyle}
          ListFooterComponent={renderFooter}
          getItemType={getItemType}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          drawDistance={400}
          removeClippedSubviews
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
          }}
          ListHeaderComponent={
            messages.length === 0 ? <EncryptionInfo /> : null
          }
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
