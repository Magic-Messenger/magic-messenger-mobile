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

  const filteredData = useMemo(() => {
    return contactData?.data?.filter(
      (x) =>
        x.contactUsername
          ?.toLocaleLowerCase()
          ?.includes(searchText?.toLocaleLowerCase()) ||
        x.nickname
          ?.toLocaleLowerCase()
          ?.includes(searchText?.toLocaleLowerCase()),
    );
  }, [searchText, contactData?.data]);

  const renderContactItem = ({ item }: { item: ContactDto }) => {
    return (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          onPress: () => {
            router.push({
              pathname: "/chatDetail/screens",
              params: {
                chatId: item.chatId as string,
                publicKey: item.publicKey as string,
                nickname: item.nickname as string,
                userName: item.contactUsername as string,
              },
            });
          },
        }}
      />
    );
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <AppLayout container title={t("chat.newChat")} loading={isLoading}>
      <FlashList
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
            style={styles.mt10}
          />
        }
      />
    </AppLayout>
  );
}
