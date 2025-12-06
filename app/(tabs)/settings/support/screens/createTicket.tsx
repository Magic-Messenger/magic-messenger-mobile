import { View } from "react-native";

import { AppLayout, Button, Input } from "@/components";

import { useCreateTicket } from "../hooks";

export default function CreateTicket() {
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
  } = useCreateTicket();

  return (
    <AppLayout
      container
      keyboardAvoiding
      scrollable
      title={t("tickets.createTicketTitle")}
      footer={
        <Button
          loading={isPending || isLoading}
          disabled={isSubmitting}
          type="primary"
          label={t("tickets.createTicket")}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <View style={[styles.gap5, styles.mt10]}>
        <Input
          control={control}
          name="subject"
          label="tickets.subject"
          placeholder="tickets.subjectPlaceholder"
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          rules={{
            required: t("inputError.required", {
              field: t("tickets.subject"),
            }),
            minLength: {
              value: 5,
              message: t("inputError.minLength", {
                field: t("tickets.subject"),
                count: 5,
              }),
            },
          }}
          error={errors.subject?.message}
        />

        <Input
          control={control}
          name="content"
          label="tickets.content"
          placeholder="tickets.contentPlaceholder"
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          multiline
          rules={{
            required: t("inputError.required", {
              field: t("tickets.content"),
            }),
            minLength: {
              value: 10,
              message: t("inputError.minLength", {
                field: t("tickets.content"),
                count: 10,
              }),
            },
          }}
          error={errors.content?.message}
        />
      </View>
    </AppLayout>
  );
}
