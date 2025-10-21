import { FlatList, TouchableOpacity, View } from "react-native";

import { AppLayout, Button, Icon, Input, ThemedText } from "@/components";

import ParticipantsScreen from "../../participants/screens";
import { useCreateGroup } from "../hooks";

export default function CreateGroupChatScreen() {
  const {
    t,
    styles,
    control,
    errors,
    participants,
    isLoadingChatCreate,
    handleSubmit,
    removeParticipant,
  } = useCreateGroup();

  return (
    <AppLayout
      container
      scrollable
      title={t("groups.newGroup")}
      footer={
        <Button
          type="primary"
          label={t("groups.create")}
          disabled={participants?.length === 0}
          onPress={handleSubmit}
          loading={isLoadingChatCreate}
        />
      }
    >
      <View style={[styles.pt5]}>
        <Input
          control={control}
          name="groupName"
          label={t("groups.groupName")}
          rules={{
            required: t("inputError.required", {
              field: t("groupName"),
            }),
            minLength: {
              value: 3,
              message: t("inputError.minLength", {
                field: t("groupName"),
                count: 3,
              }),
            },
          }}
          error={errors.groupName?.message}
        />

        <View style={[styles.gap3, styles.mt5]}>
          <ThemedText type="subtitle" center>
            {t("groups.searchContacts")}
          </ThemedText>

          <FlatList
            data={participants}
            scrollEnabled={false}
            contentContainerStyle={styles.participantContainer}
            renderItem={({ item }) => (
              <View style={[styles.participantItem]}>
                <ThemedText>
                  {item?.nickname ?? item?.contactUsername}
                </ThemedText>
                <TouchableOpacity
                  onPress={() =>
                    removeParticipant(item?.contactUsername as string)
                  }
                >
                  <Icon name="close" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>

      <ParticipantsScreen />
    </AppLayout>
  );
}
