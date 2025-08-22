import { usePostApiContactsCreate } from "@/api/endpoints/magicMessenger";
import { CreateContactCommandRequest } from "@/api/models";
import {
  AppLayout,
  Button,
  ContactScanQr,
  Input,
  ThemedText,
} from "@/components";
import { useThemedStyles } from "@/theme";
import { showToast } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function ContactAdd() {
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams();
  const styles = useThemedStyles();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isLoading },
  } = useForm<CreateContactCommandRequest>();

  const { mutateAsync: addContact, isPending } = usePostApiContactsCreate();

  const onSubmit = async (formValues: CreateContactCommandRequest) => {
    const { success } = await addContact({
      data: {
        ...formValues,
      },
    });
    if (success) {
      showToast({
        text1: t("contacts.successAddedContact"),
      });
      router.back();
    }
  };

  const nickNameField = watch()?.nickname;
  useEffect(() => {
    if (barcode) {
      reset({ username: barcode as string, nickname: nickNameField });
    }
  }, [barcode, nickNameField]);

  return (
    <AppLayout
      container
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
          error={errors.username?.message}
        />
      </View>
    </AppLayout>
  );
}
