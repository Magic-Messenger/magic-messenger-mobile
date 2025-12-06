import { useIsFocused } from "@react-navigation/core";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";

import { useGetApiChatsList } from "@/api/endpoints/magicMessenger";
import { ChatDto } from "@/api/models";
import { AppLayout, Button, ChatItem, EmptyList, Icon } from "@/components";
import { useSignalRStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export default function ChatScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const isFocused = useIsFocused();
  const receivedMessage = useSignalRStore((s) => s.receivedMessage);

  const { data, isLoading, refetch } = useGetApiChatsList({
    pageNumber: 1,
    pageSize: 150,
  });

  // Memoized chat list data
  const chatList = useMemo(() => data?.data?.data ?? [], [data?.data?.data]);

  // Render chat item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatDto>) => (
      <ChatItem
        chatId={item.chatId as string}
        isGroupChat={item.isGroupChat}
        groupName={item.groupName ?? ""}
        publicKey={item.contact?.publicKey ?? ""}
        nickname={item.contact?.nickname ?? ""}
        lastMessageTime={item.lastMessageTime ?? ""}
        contactUsername={item.contact?.contactUsername ?? ""}
        unreadMessagesCount={item.unreadMessagesCount ?? 0}
      />
    ),
    [],
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback(
    (item: ChatDto) => item.chatId || `chat-${item.contact?.contactUsername}`,
    [],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Refresh control component
  const refreshControl = useMemo(
    () => <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />,
    [isLoading, handleRefresh],
  );

  // Navigate to create chat
  const handleCreateChat = useCallback(() => {
    router.push("/(tabs)/chat/create");
  }, []);

  // Empty list component
  const renderEmptyList = useCallback(
    () => (
      <>
        {!isLoading && (
          <EmptyList
            label={t("chat.notFound")}
            icon="message-square"
            style={styles.mt10}
          />
        )}
      </>
    ),
    [t, styles.mt10, isLoading],
  );

  // Header title with new chat button
  const headerTitle = useMemo(
    () => (
      <View style={styles.newChatButton}>
        <Button
          type="primary"
          label={t("home.newChat")}
          leftIcon={<Icon type="feather" name="plus" size={18} />}
          textProps={{
            size: 14,
          }}
          onPress={handleCreateChat}
        />
      </View>
    ),
    [t, styles.newChatButton, handleCreateChat],
  );

  useEffect(() => {
    if (isFocused && receivedMessage) refetch();
  }, [receivedMessage, isFocused]);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <AppLayout container loading={isLoading} title={headerTitle}>
      <FlashList
        data={chatList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        drawDistance={400}
        removeClippedSubviews
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold: 10,
        }}
      />
    </AppLayout>
  );
}

const createStyle = () =>
  StyleSheet.create({
    newChatButton: {
      width: widthPixel(110),
      height: heightPixel(30),
    },
    mt10: {
      marginTop: heightPixel(10),
    },
  });
