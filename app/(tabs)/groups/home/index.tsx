import { useIsFocused } from "@react-navigation/core";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AppState, RefreshControl, StyleSheet, View } from "react-native";

import {
  getGetApiChatsListQueryKey,
  useGetApiChatsList,
} from "@/api/endpoints/magicMessenger";
import { ChatDto } from "@/api/models";
import { AppLayout, Button, ChatItem, EmptyList, Icon } from "@/components";
import { useSignalRStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export default function ChatScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  const receivedMessage = useSignalRStore((s) => s.lastReceivedMessage);

  const appState = useRef(AppState.currentState);

  const { data, isLoading, refetch } = useGetApiChatsList({
    pageNumber: 1,
    pageSize: 150,
    isGroupChat: true,
  });

  // Memoized group chat list data
  const groupChatList = useMemo(
    () => data?.data?.data ?? [],
    [data?.data?.data],
  );

  // Render group chat item
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
        groupKey={item.groupKey as string}
        groupNonce={item.groupNonce as string}
        groupAccountCount={item.groupAccountCount as string}
        groupAdminAccount={item.groupAdminAccount as string}
        groupAdminUsername={item.groupAdminUsername as string}
      />
    ),
    [],
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback(
    (item: ChatDto) => item.chatId || `group-${item.groupName}`,
    [],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries?.({
      queryKey: getGetApiChatsListQueryKey(),
    });
    refetch();
  }, []);

  // Refresh control component
  const refreshControl = useMemo(
    () => <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />,
    [isLoading, handleRefresh],
  );

  // Navigate to create a group
  const handleCreateGroup = useCallback(() => {
    router.push("/(tabs)/groups/create/screens");
  }, []);

  // Empty list component
  const renderEmptyList = useCallback(
    () => (
      <>
        {!isLoading && (
          <EmptyList
            label={t("groups.notFound")}
            icon="users"
            style={styles.mt10}
          />
        )}
      </>
    ),
    [isLoading],
  );

  // Header title with new group button
  const headerTitle = useMemo(
    () => (
      <View style={styles.newChatButton}>
        <Button
          type="primary"
          label={t("groups.newGroup")}
          leftIcon={<Icon type="feather" name="plus" size={18} />}
          textProps={{
            size: 14,
          }}
          onPress={handleCreateGroup}
        />
      </View>
    ),
    [],
  );

  useEffect(() => {
    if (isFocused && receivedMessage) handleRefresh();
  }, [receivedMessage, isFocused]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      )
        handleRefresh();

      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, []),
  );

  return (
    <AppLayout container loading={isLoading} title={headerTitle}>
      <FlashList
        data={groupChatList}
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
