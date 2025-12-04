import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";

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
    handleEndReached,
    onClearReply,
    getMessageStatus,
  } = useDetail();

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

  const keyExtractor = useCallback((item: MessageWithDate, index: number) => {
    if (isDateSeparator(item)) {
      return `date-${item.date}-${index}`;
    }
    return item.messageId || `temp-${item.createdAt}`;
  }, []);

  const renderHeader = useCallback(
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
        {messages.length === 0 && !loading && <EncryptionInfo />}
        <LoadingProvider loading={loading}>
          <FlatList
            ref={listRef}
            data={groupedMessages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.contentContainerStyle}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={20}
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
