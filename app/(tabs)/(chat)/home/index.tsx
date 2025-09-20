import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";

import { useGetApiChatsList } from "@/api/endpoints/magicMessenger";
import { AppLayout, Button, ChatItem, Icon, ThemedText } from "@/components";
import { useUserStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isLogin } = useUserStore();
  const styles = useThemedStyles(createStyle);

  const { data, isLoading, refetch } = useGetApiChatsList({
    pageNumber: 1,
    pageSize: 40,
  });

  useEffect(() => {
    if (!isLogin) {
      router.replace("/(auth)/preLogin");
    }
  }, [isLogin]);

  useMemo(() => {
    if (__DEV__) {
      console.log("process.env:", JSON.stringify(process.env, null, 2));
    }
    return null;
  }, []);

  const chatListData = useMemo(() => {
    const listData = data?.data?.data || [];

    const sections = [
      {
        title: t("common.unread"),
        data: listData.filter((d) => (d.unreadMessagesCount as never) > 0),
      },
      {
        title: t("common.read"),
        data: listData.filter((d) => d.unreadMessagesCount === 0),
      },
    ];

    let finalData: { type: "header" | "item"; title?: string; item?: any }[] =
      [];

    sections.forEach((section) => {
      if (section.data.length > 0) {
        finalData.push({ type: "header", title: section.title });
        finalData.push(
          ...section.data.map((i) => ({ type: "item" as never, item: i })),
        );
      }
    });

    return finalData;
  }, [data]);

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
        data={chatListData}
        refreshing={isLoading}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        renderItem={({ item }) => (
          <View>
            {item.type === "header" ? (
              <ThemedText
                weight="semiBold"
                size={16}
                style={{ marginVertical: 10 }}
              >
                {item.title}
              </ThemedText>
            ) : (
              <View style={styles.mb3}>
                <ChatItem
                  chatId={item?.item?.chatId}
                  isGroupChat={item?.item?.isGroupChat}
                  groupName={item?.item?.groupName ?? ""}
                  publicKey={item?.item?.contact?.publicKey ?? ""}
                  nickname={item?.item?.contact?.nickname ?? ""}
                  lastMessageTime={item?.item?.lastMessageTime ?? ""}
                  contactUsername={item?.item?.contact?.contactUsername ?? ""}
                  unreadMessagesCount={item?.item?.unreadMessagesCount ?? 0}
                />
              </View>
            )}
          </View>
        )}
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
