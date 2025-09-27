import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity } from "react-native";

import { useGetApiContactsList } from "@/api/endpoints/magicMessenger";
import { ContactDto } from "@/api/models";
import {
  AppLayout,
  Button,
  ContactItem,
  EmptyList,
  Icon,
  Input,
} from "@/components";
import { useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export default function ParticipantsScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyles();
  const colors = useColor();
  const navigation = useNavigation();

  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const { data: contactData, isLoading, refetch } = useGetApiContactsList();

  const [searchText, setSearchText] = useState<string>("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerBackTitleVisible: false,
      headerTitle: "Participants",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon type="ant" name="left" color={colors.colors.white} size={20} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: undefined,
      },
    });
  }, [navigation, selectedContacts]);

  const filteredData = useMemo(() => {
    return contactData?.data?.filter((x) =>
      x.nickname?.toLocaleLowerCase()?.includes(searchText?.toLowerCase()),
    );
  }, [searchText, contactData?.data]);

  const renderContactItem = ({ item }: { item: ContactDto }) => {
    return (
      <ContactItem
        nickname={item.nickname as string}
        contactUsername={item.contactUsername as string}
        onAction={{
          onPress: () => {
            if (selectedContacts.includes(item.contactUsername as string)) {
              setSelectedContacts((prev) =>
                prev.filter((x) => x !== item.contactUsername),
              );
            } else {
              setSelectedContacts((prev) => [
                ...prev,
                item.contactUsername as string,
              ]);
            }
          },
        }}
        customAction={
          selectedContacts.includes(item.contactUsername as string) ? (
            <Icon type="ant" name="checkcircle" color={colors.colors.white} />
          ) : null
        }
      />
    );
  };

  const handleSelectParticipants = () => {
    router.back();

    setTimeout(() => {
      router.setParams({
        participants: selectedContacts,
      });
    }, 400);
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <AppLayout
      container
      showBadge={false}
      loading={isLoading}
      footer={
        <Button
          type="primary"
          label={t("groups.selectParticipants")}
          disabled={selectedContacts?.length === 0}
          onPress={handleSelectParticipants}
        />
      }
    >
      <FlatList
        ListHeaderComponent={
          <Input
            placeholder={t("common.search")}
            style={[styles.mt5, styles.mb5]}
            onChangeText={(_text) => setSearchText(_text)}
            rightIcon={{
              type: "ant",
              name: "search1",
            }}
          />
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
