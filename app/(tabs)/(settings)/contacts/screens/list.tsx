import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";

import { ContactDto } from "@/api/models";
import { AppLayout, ContactHeader, EmptyList } from "@/components";

import { useListContact } from "../hooks";

export default function ContactsScreen() {
  const {
    t,
    styles,
    isLoading,
    filteredData,
    setSearchText,
    displayOnlyBlocked,
    setDisplayOnlyBlocked,
    renderContactItem,
  } = useListContact();

  // Key extractor for optimal list performance
  const keyExtractor = useCallback(
    (item: ContactDto) =>
      item.contactUsername || item.nickname || item.publicKey || "",
    [],
  );

  // Handle search input
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
    },
    [setSearchText],
  );

  // Toggle blocked filter
  const handleToggleBlocked = useCallback(() => {
    setDisplayOnlyBlocked(!displayOnlyBlocked);
  }, [displayOnlyBlocked, setDisplayOnlyBlocked]);

  // List header component
  const renderListHeader = useCallback(
    () => (
      <ContactHeader
        setSearchText={handleSearchChange}
        onBlockedPress={handleToggleBlocked}
        isBlocked={displayOnlyBlocked}
      />
    ),
    [handleSearchChange, handleToggleBlocked, displayOnlyBlocked],
  );

  // Empty list component
  const renderEmptyList = useCallback(
    () => (
      <EmptyList
        label={t("contacts.notFound")}
        icon="frown"
        style={styles.mt10}
      />
    ),
    [t, styles.mt10],
  );

  return (
    <AppLayout container title={t("contacts.title")} loading={isLoading}>
      <FlashList
        data={filteredData}
        renderItem={renderContactItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ paddingBottom: 10 }}
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
