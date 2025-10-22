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

  const { data: contactData, refetch } = useGetApiContactsList();

  const [searchText, setSearchText] = useState<string>("");

  const filteredData = useMemo(() => {
    return contactData?.data?.filter((x) =>
      x.nickname?.toLocaleLowerCase()?.includes(searchText?.toLowerCase()),
    );
  }, [searchText, contactData?.data]);

  const handleSelectContact = useCallback(
    (contact: ContactDto) => {
      if (
        participants?.find(
          (x) => x?.contactUsername === contact?.contactUsername,
        )
      ) {
        removeParticipant(contact?.contactUsername as string);
      } else {
        setParticipants(contact);
      }
    },
    [participants],
  );

  const renderContactItem = useCallback(
    ({ item }: { item: ContactDto }) => (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          onPress: () => handleSelectContact(item),
        }}
        customAction={
          participants?.find(
            (x) => x.contactUsername === item.contactUsername,
          ) ? (
            <Icon type="ant" name="checkcircle" color={colors.colors.white} />
          ) : (
            <></>
          )
        }
      />
    ),
    [handleSelectContact, participants],
  );

  const handleSelectParticipants = useCallback(() => {
    modalRef.current?.close();
  }, [modalRef]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
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
          style={[styles.mb5]}
          onChangeText={(_text) => setSearchText(_text)}
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
          contentContainerStyle={{ gap: spacingPixel(10) }}
          keyExtractor={(_, index) => index?.toString()}
          renderItem={renderContactItem}
          ListEmptyComponent={
            <EmptyList
              label={t("contacts.notFound")}
              icon="frown"
              style={styles.mt10}
            />
          }
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
