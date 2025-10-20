import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

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
import { useGroupChatCreateStore } from "@/store";
import { useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

export default function ParticipantsScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyles();
  const colors = useColor();
  const navigation = useNavigation();

  const { participants, setParticipants, removeParticipant } =
    useGroupChatCreateStore();

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
  }, [navigation, participants]);

  const filteredData = useMemo(() => {
    return contactData?.data?.filter((x) =>
      x.nickname?.toLocaleLowerCase()?.includes(searchText?.toLowerCase()),
    );
  }, [searchText, contactData?.data]);

  const handleSelectContact = (contact: ContactDto) => {
    if (
      participants?.find((x) => x?.contactUsername === contact?.contactUsername)
    ) {
      removeParticipant(contact?.contactUsername as string);
    } else {
      setParticipants(contact);
    }
  };

  const renderContactItem = ({ item }: { item: ContactDto }) => {
    return (
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
    );
  };

  const handleSelectParticipants = () => {
    router.back();
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
          disabled={participants?.length === 0}
          onPress={handleSelectParticipants}
        />
      }
    >
      <FlashList
        ListHeaderComponent={
          <Input
            placeholder={t("common.search")}
            style={[styles.mb5]}
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
