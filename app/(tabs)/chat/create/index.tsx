import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import {
  useGetApiAccountSearch,
  useGetApiContactsList,
} from "@/api/endpoints/magicMessenger";
import { AccountSearchDto, ContactDto } from "@/api/models";
import { AppLayout, ContactHeader, ContactItem, EmptyList } from "@/components";
import { ThemedText } from "@/components/app/ThemedText";
import { useQrStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export default function CreateChatScreen() {
  const { t } = useTranslation();
  const { data: contactData, isLoading, refetch } = useGetApiContactsList();
  const { setQrCode } = useQrStore();
  const styles = useThemedStyles();

  const [searchText, setSearchText] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search text for API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Global search API
  const { data: globalSearchData, isLoading: isSearching } =
    useGetApiAccountSearch(
      { query: debouncedSearch, pageNumber: 1, pageSize: 20 },
      {
        query: {
          enabled: debouncedSearch.length >= 3,
        },
      },
    );

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

  // Global search results (exclude users already in contacts)
  const globalResults = useMemo((): AccountSearchDto[] => {
    // API returns AccountSearchDtoListPaginatedResult with nested data
    const searchResults =
      (globalSearchData?.data as any)?.data ?? globalSearchData?.data ?? [];
    if (!Array.isArray(searchResults) || searchResults.length === 0) return [];

    const contactUsernames = new Set(
      contactData?.data?.map((c) => c.contactUsername?.toLowerCase()) || [],
    );

    return searchResults.filter(
      (user: AccountSearchDto) =>
        !contactUsernames.has(user.username?.toLowerCase()),
    );
  }, [globalSearchData?.data, contactData?.data]);

  // Navigate to chat detail (for contacts)
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

  // Navigate to add contact (for global search results)
  const handleGlobalUserPress = useCallback(
    (item: AccountSearchDto) => {
      setQrCode(item.username as string);
      router.push("/(tabs)/chat/contacts/add");
    },
    [setQrCode],
  );

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

  // Show global section when searching (3+ chars) and either loading or has results
  const showGlobalSection =
    debouncedSearch.length >= 3 && (isSearching || globalResults.length > 0);

  // List header component with global results (without ContactHeader to avoid re-render)
  const renderListHeader = useCallback(
    () => (
      <View>
        {/* Global Search Section */}
        {showGlobalSection && (
          <View style={{ marginTop: spacingPixel(10) }}>
            <ThemedText
              type="title"
              weight="semiBold"
              size={20}
              style={{ marginBottom: spacingPixel(10) }}
            >
              {t("contacts.global")}
            </ThemedText>

            {/* Loading */}
            {isSearching && (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: spacingPixel(10),
                }}
              >
                <ActivityIndicator size="small" color="white" />
              </View>
            )}

            {/* Results */}
            {!isSearching &&
              globalResults.map((item: AccountSearchDto) => (
                <ContactItem
                  key={`global-${item.username}`}
                  nickname={item.username as string}
                  contactUsername={item.username as string}
                  onAction={{
                    onPress: () => handleGlobalUserPress(item),
                  }}
                />
              ))}
          </View>
        )}

        {/* Your Contacts Title */}
        <ThemedText
          type="title"
          weight="semiBold"
          size={20}
          style={{
            marginTop: spacingPixel(15),
            marginBottom: spacingPixel(10),
          }}
        >
          {t("contacts.yourContacts")}
        </ThemedText>
      </View>
    ),
    [showGlobalSection, isSearching, globalResults, handleGlobalUserPress, t],
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

  // Reset search and refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      setSearchText("");
      setDebouncedSearch("");
      refetch();
    }, [refetch]),
  );

  return (
    <AppLayout container title={t("chat.newChat")} loading={isLoading}>
      <ContactHeader
        isShowBlocked={false}
        searchText={searchText}
        setSearchText={handleSearchChange}
        searchPlaceholder={t("contacts.searchGlobalPlaceholder")}
        addContactRoute="/(tabs)/chat/contacts/add"
        showTitle={false}
      />
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
        extraData={[showGlobalSection, isSearching, globalResults]}
      />
    </AppLayout>
  );
}
