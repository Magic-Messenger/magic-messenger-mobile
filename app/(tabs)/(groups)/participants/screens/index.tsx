import BottomSheet from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetApiContactsList } from "@/api/endpoints/magicMessenger";
import { ContactDto } from "@/api/models";
import {
  BottomSheetComponent,
  Button,
  ContactItem,
  EmptyList,
  Icon,
  Input,
} from "@/components";
import { useGroupChatCreateStore } from "@/store";
import { useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export default function ParticipantsScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyles();
  const colors = useColor();

  const modalRef = useRef<BottomSheet | null>(null);

  const { participants, setParticipants, removeParticipant } =
    useGroupChatCreateStore();

  const { data: contactData, refetch, isLoading } = useGetApiContactsList();

  const [searchText, setSearchText] = useState<string>("");

  // Filtered contacts with memoization
  const filteredData = useMemo(() => {
    if (!contactData?.data) return [];

    const searchLower = searchText?.toLowerCase()?.trim();
    if (!searchLower) return contactData.data;

    return contactData.data.filter((contact) =>
      contact.nickname?.toLowerCase()?.includes(searchLower),
    );
  }, [searchText, contactData?.data]);

  // Check if contact is selected
  const isContactSelected = useCallback(
    (contactUsername: string) => {
      return participants?.some((p) => p.contactUsername === contactUsername);
    },
    [participants],
  );

  // Handle contact selection toggle
  const handleSelectContact = useCallback(
    (contact: ContactDto) => {
      const username = contact.contactUsername as string;

      if (isContactSelected(username)) {
        removeParticipant(username);
      } else {
        setParticipants(contact);
      }
    },
    [isContactSelected, removeParticipant, setParticipants],
  );

  // Render contact item
  const renderContactItem = useCallback(
    ({ item }: { item: ContactDto }) => {
      const isSelected = isContactSelected(item.contactUsername as string);

      return (
        <ContactItem
          nickname={item.nickname as string}
          contactUsername={item.contactUsername as string}
          onAction={{
            onPress: () => handleSelectContact(item),
          }}
          customAction={
            isSelected ? (
              <Icon type="ant" name="checkcircle" color={colors.colors.white} />
            ) : null
          }
        />
      );
    },
    [handleSelectContact, isContactSelected, colors.colors.white],
  );

  // Key extractor for FlashList
  const keyExtractor = useCallback(
    (item: ContactDto) => item.contactUsername || item.nickname || "",
    [],
  );

  // Handle modal close
  const handleSelectParticipants = useCallback(() => {
    modalRef.current?.close();
  }, []);

  // Handle search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
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

  return (
    <>
      <Button
        type="primary"
        label={t("groups.addParticipants")}
        onPress={() => modalRef.current?.expand()}
        style={styles.mt5}
      />
      <BottomSheetComponent
        ref={modalRef}
        snapPoints={["80%"]}
        enablePanDownToClose
      >
        <Input
          placeholder={t("common.search")}
          style={styles.mb5}
          onChangeText={handleSearchChange}
          value={searchText}
          rightIcon={{
            type: "ant",
            name: "search1",
          }}
          inputStyle={{
            backgroundColor: colors.colors.secondarySelected,
            borderRadius: spacingPixel(10),
          }}
        />
        <FlashList
          data={filteredData}
          contentContainerStyle={{ paddingBottom: spacingPixel(10) }}
          keyExtractor={keyExtractor}
          renderItem={renderContactItem}
          ListEmptyComponent={renderEmptyList}
          drawDistance={400}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
          }}
        />

        <Button
          type="primary"
          label={t("groups.selectParticipants")}
          onPress={handleSelectParticipants}
          style={styles.mt5}
        />
      </BottomSheetComponent>
    </>
  );
}
