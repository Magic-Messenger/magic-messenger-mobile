import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";

import {
  ActionSheet,
  ChatFooter,
  ChatHeader,
  ChatLayout,
  ChatTyping,
  DateSeparator,
  EncryptionInfo,
  LoadingProvider,
  MessageItem,
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
    usersPublicKey,
    replyMessage,
    actionRef,
    chatActionOptions,
    handleSendMessage,
    handleReply,
    handleScroll,
    onClearReply,
    getMessageStatus,
  } = useDetail();

  // Memoized render function for better performance
  const renderItem = useCallback(
    ({ item }: { item: MessageWithDate }) => {
      if (isDateSeparator(item)) {
        return <DateSeparator date={item.date} />;
      }
      const messageStatus = getMessageStatus(item.messageId!);
      return (
        <MessageItem
          identifier={chatId}
          message={item}
          messageStatus={messageStatus}
          receiverPublicKey={usersPublicKey.receiverPublicKey}
          onReply={handleReply}
        />
      );
    },
    [chatId, usersPublicKey.receiverPublicKey, handleReply, getMessageStatus],
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback((item: MessageWithDate, index: number) => {
    if (isDateSeparator(item)) {
      return `date-${item.date}-${index}`;
    }
    return item.messageId || `temp-${item.createdAt}`;
  }, []);

  const getItemType = useCallback((item: MessageWithDate) => {
    if (isDateSeparator(item)) {
      return "date";
    }
    return item.messageType; // "text", "image", "audio", "video"
  }, []);

  // Footer component
  const renderFooter = useCallback(
    () => <ChatTyping chatId={chatId} />,
    [chatId],
  );

  return (
    <>
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
            data={groupedMessages}
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
            ListHeaderComponent={
              messages.length === 0 && !loading ? <EncryptionInfo /> : null
            }
          />
        </LoadingProvider>
      </ChatLayout>

      <ActionSheet ref={actionRef} options={chatActionOptions} />
    </>
  );
}

const createStyle = () =>
  StyleSheet.create({
    contentContainerStyle: {
      paddingHorizontal: spacingPixel(15),
      paddingTop: spacingPixel(10),
    },
  });
