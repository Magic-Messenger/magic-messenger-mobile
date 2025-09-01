import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetApiContactsList } from "@/api/endpoints/magicMessenger";
import { ContactDto } from "@/api/models";
import { ContactItem } from "@/components";
import { useThemedStyles } from "@/theme";

export const useListContact = () => {
  const { t } = useTranslation();
  const { data: contactData, isLoading, refetch } = useGetApiContactsList();
  const styles = useThemedStyles();

  const [searchText, setSearchText] = useState<string>("");
  const [displayOnlyBlocked, setDisplayOnlyBlocked] = useState<boolean>(false);

  const filteredData = useMemo(() => {
    return contactData?.data?.filter(
      (x) =>
        x.nickname?.toLocaleLowerCase()?.includes(searchText?.toLowerCase()) &&
        (displayOnlyBlocked ? x.isBlocked : !x.isBlocked),
    );
  }, [searchText, displayOnlyBlocked, contactData?.data]);

  const renderContactItem = ({ item }: { item: ContactDto }) => {
    return (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          copy: true,
          onEdit: () =>
            router.push({
              pathname: "/contacts/screens/edit",
              params: {
                ...item,
              } as never,
            }),
        }}
      />
    );
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return {
    t,
    styles,
    isLoading,
    filteredData,
    renderContactItem,
    setSearchText,
    displayOnlyBlocked,
    setDisplayOnlyBlocked,
  };
};
