import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";

import { useGetApiChatsList } from "@/api/endpoints/magicMessenger";
import { ChatDto } from "@/api/models";
import { AppLayout, Button, ChatItem, Icon } from "@/components";
import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export default function ChatScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const { data, isLoading, refetch } = useGetApiChatsList({
    pageNumber: 1,
    pageSize: 150,
  });

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatDto>) => (
      <ChatItem
        chatId={item?.chatId as string}
        isGroupChat={item?.isGroupChat}
        groupName={item?.groupName ?? ""}
        publicKey={item?.contact?.publicKey ?? ""}
        nickname={item?.contact?.nickname ?? ""}
        lastMessageTime={item?.lastMessageTime ?? ""}
        contactUsername={item?.contact?.contactUsername ?? ""}
        unreadMessagesCount={item?.unreadMessagesCount ?? 0}
      />
    ),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <AppLayout
      container
      loading={isLoading}
      title={
        <View style={styles.newChatButton}>
          <Button
            type="primary"
            label={t("home.newChat")}
            leftIcon={<Icon type="feather" name="plus" size={18} />}
            textProps={{
              size: 14,
            }}
            onPress={() => router.push("/(tabs)/(chat)/create")}
          />
        </View>
      }
    >
      <FlashList
        data={data?.data?.data ?? []}
        refreshing={isLoading}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        renderItem={renderItem}
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
  });
