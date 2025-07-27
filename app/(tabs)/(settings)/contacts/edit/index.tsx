import {
  useDeleteApiContactsDelete,
  usePostApiContactsUpdate,
} from "@/api/endpoints/magicMessenger";
import { CreateContactCommandRequest } from "@/api/models";
import {
  AppLayout,
  Button,
  ContactScanQr,
  Icon,
  Input,
  ThemedText,
} from "@/components";
import { commonStyle } from "@/constants";
import { showToast } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

export default function ContactEdit() {
  const { t } = useTranslation();
  const { contactUsername, nickname, barcode } = useLocalSearchParams();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isLoading, isSubmitted },
  } = useForm<CreateContactCommandRequest>();

  const { mutateAsync: addContact, isPending } = usePostApiContactsUpdate();
  const { mutateAsync: deleteContact } = useDeleteApiContactsDelete();

  const onSubmit = async (formValues: CreateContactCommandRequest) => {
    const { success } = await addContact({
      data: {
        ...formValues,
      },
    });
    if (success) {
      showToast({
        text1: t("contacts.shotToast"),
      });
      router.back();
    }
  };

  const onDeleteContact = async () => {
    const { success } = await deleteContact({
      params: {
        username: contactUsername as never,
      },
    });
    if (success) {
      showToast({ text1: t("contacts.successDeleteContact") });
      router.back();
    }
  };

  const handleDeleteContact = () => {
    Alert.alert(
      t("contacts.deleteContactMessageTitle"),
      t("contacts.deleteContactMessageMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: onDeleteContact,
        },
      ]
    );
  };

  useEffect(() => {
    if (contactUsername && nickname) {
      reset({
        nickname: nickname as string,
        username: contactUsername as string,
      });
    }
  }, [contactUsername, nickname]);

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
          label={t("contacts.editContact")}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <ThemedText type="title" weight="semiBold" size={20}>
        {t("contacts.editContact")}
      </ThemedText>

      <View style={[commonStyle.gap5, commonStyle.mt10]}>
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

        <Button
          label={t("contacts.deleteContact")}
          leftIcon={<Icon type="feather" name="trash" />}
          onPress={handleDeleteContact}
        />
      </View>
    </AppLayout>
  );
}
