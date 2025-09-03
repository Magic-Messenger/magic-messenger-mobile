import { View } from "react-native";

import {
  AppLayout,
  Button,
  ContactScanQr,
  Input,
  ThemedText,
} from "@/components";

import { useAddContact } from "../hooks";

export default function ContactAdd() {
  const {
    t,
    control,
    errors,
    styles,
    isPending,
    isLoading,
    isSubmitting,
    handleSubmit,
    onSubmit,
  } = useAddContact();

  return (
    <AppLayout
      container
      keyboardAvoiding
      scrollable
      title={<ContactScanQr />}
      footer={
        <Button
          loading={isPending || isLoading}
          disabled={isSubmitting}
          type="primary"
          label={t("contacts.addContact")}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <ThemedText type="title" weight="semiBold" size={20}>
        {t("contacts.addContact")}
      </ThemedText>

      <View style={[styles.gap5, styles.mt10]}>
        <Input
          control={control}
          name="username"
          label={t("contacts.userName")}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
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
          error={errors.username?.message}
        />

        <Input
          control={control}
          name="nickname"
          label={t("contacts.nickName")}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          rules={{
            required: t("inputError.required", {
              field: t("contacts.nickName"),
            }),
            minLength: {
              value: 3,
              message: t("inputError.minLength", {
                field: t("contacts.nickName"),
                count: 3,
              }),
            },
          }}
          error={errors.nickname?.message}
        />
      </View>
    </AppLayout>
  );
}
