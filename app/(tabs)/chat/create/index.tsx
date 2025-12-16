import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetApiContactsList } from "@/api/endpoints/magicMessenger";
import { ContactDto } from "@/api/models";
import { AppLayout, ContactHeader, ContactItem, EmptyList } from "@/components";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export default function CreateChatScreen() {
  const { t } = useTranslation();
  const { data: contactData, isLoading, refetch } = useGetApiContactsList();
  const styles = useThemedStyles();

  const [searchText, setSearchText] = useState<string>("");

  // Filtered contacts with optimized search
  const filteredData = useMemo(() => {
    if (!contactData?.data) return [];

    const searchLower = searchText?.toLowerCase()?.trim();
    if (!searchLower) return contactData.data;

    return contactData.data.filter((contact) => {
      const username = contact.contactUsername?.toLowerCase() || "";
      const nickname = contact.nickname?.toLowerCase() || "";
      return username.includes(searchLower) || nickname.includes(searchLower);
    });
  }, [searchText, contactData?.data]);

  // Navigate to chat detail
  const handleCreateChat = useCallback((item: ContactDto) => {
    router.push({
      pathname: "/chatDetail/screens",
      params: {
        chatId: item.chatId as string,
        publicKey: item.publicKey as string,
        nickname: item.nickname as string,
        userName: item.contactUsername as string,
      },
    });
  }, []);

  // Render contact item
  const renderContactItem = useCallback(
    ({ item }: { item: ContactDto }) => (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          onPress: () => handleCreateChat(item),
        }}
      />
    ),
    [handleCreateChat],
  );

  // Key extractor for optimal list performance
  const keyExtractor = useCallback(
    (item: ContactDto) =>
      item.chatId || item.contactUsername || item.nickname || "",
    [],
  );

  // Handle search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // List header component
  const renderListHeader = useCallback(
    () => (
      <ContactHeader
        isShowBlocked={false}
        setSearchText={handleSearchChange}
        addContactRoute="/(tabs)/chat/contacts/add"
      />
    ),
    [handleSearchChange],
  );

  // Empty list component
  const renderEmptyList = useCallback(
    () => (
      <>
        {!isLoading && (
          <EmptyList
            label={t("contacts.notFound")}
            icon="frown"
            style={styles.mt10}
          />
        )}
      </>
    ),
    [t, styles.mt10, isLoading],
  );

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <AppLayout container title={t("chat.newChat")} loading={isLoading}>
      <FlashList
        ListHeaderComponent={renderListHeader}
        data={filteredData}
        contentContainerStyle={{ paddingBottom: spacingPixel(10) }}
        keyExtractor={keyExtractor}
        renderItem={renderContactItem}
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
