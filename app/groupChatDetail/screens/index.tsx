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
  MessageGroupItem,
} from "@/components";
import { useThemedStyles } from "@/theme";
import { isDateSeparator, MessageWithDate, spacingPixel } from "@/utils";

import { useDetail } from "../hooks";

export default function GroupChatScreen() {
  const styles = useThemedStyles(createStyle);

  const {
    loading,
    chatId,
    messages,
    groupedMessages,
    userName,
    listRef,
    actionRef,
    chatActionOptions,
    groupAccountCount,
    replyMessage,
    handleSendMessage,
    handleReply,
    handleEndReached,
    onClearReply,
  } = useDetail();

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
    [chatId, handleReply],
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
            isGroupChat={true}
            groupAccountCount={groupAccountCount as string}
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

      <ActionSheet
        ref={actionRef}
        options={chatActionOptions}
        snapPoints={["20%"]}
      />
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
