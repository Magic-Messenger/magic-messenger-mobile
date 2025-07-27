import { useGetApiContactsList } from "@/api/endpoints/magicMessenger";
import { ContactDto } from "@/api/models";
import { AppLayout, ContactHeader, ContactItem, EmptyList } from "@/components";
import { commonStyle } from "@/constants";
import { spacingPixel } from "@/utils";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";

export default function ContactsScreen() {
  const { t } = useTranslation();
  const { data: contactData, isLoading, refetch } = useGetApiContactsList();

  const [searchText, setSearchText] = useState<string>("");

  const filteredData = useMemo(() => {
    return contactData?.data?.filter((x) =>
      x.nickname?.toLocaleLowerCase()?.includes(searchText?.toLowerCase())
    );
  }, [searchText, contactData?.data]);

  const renderContactItem = ({ item }: { item: ContactDto }) => {
    return (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          copy: true,
          onEdit: () =>
            router.push({
              pathname: "/contacts/edit",
              params: {
                ...item,
              },
            }),
        }}
      />
    );
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  return (
    <AppLayout container title={t("contacts.title")} loading={isLoading}>
      <FlatList
        ListHeaderComponent={
          <ContactHeader setSearchText={(_text) => setSearchText(_text)} />
        }
        data={filteredData}
        contentContainerStyle={{ gap: spacingPixel(10) }}
        keyExtractor={(_, index) => index?.toString()}
        renderItem={renderContactItem}
        ListEmptyComponent={
          <EmptyList
            label={t("contacts.notFound")}
            icon="frown"
            style={commonStyle.mt10}
          />
        }
      />
    </AppLayout>
  );
}
