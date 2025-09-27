import { FlatList, TouchableOpacity, View } from "react-native";

import { AppLayout, Button, Icon, Input, ThemedText } from "@/components";

import { useCreateGroup } from "../hooks";

export default function CreateGroupChatScreen() {
  const {
    t,
    theme,
    styles,
    control,
    errors,
    isSubmitting,
    participants,
    handleSubmit,
    goToAddParticipants,
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
          onPress={handleSubmit}
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
              field: t("userName"),
            }),
            minLength: {
              value: 3,
              message: t("inputError.minLength", {
                field: t("userName"),
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
            contentContainerStyle={styles.participantContainer}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <ThemedText>{item}</ThemedText>
                <TouchableOpacity onPress={() => removeParticipant(item)}>
                  <Icon name="close" />
                </TouchableOpacity>
              </View>
            )}
          />

          <Button
            type="primary"
            label={t("groups.addParticipants")}
            onPress={goToAddParticipants}
          />
        </View>
      </View>
    </AppLayout>
  );
}
