import { useRouter } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppLayout, Button, Input } from "@/components";
import { useNoteStore } from "@/store/noteStore";
import { ColorDto, useThemedStyles } from "@/theme";
import { encrypt, showToast, userPrivateKey, userPublicKey } from "@/utils";

interface NoteFormData {
  title: string;
  content: string;
}

export default function CreateScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const router = useRouter();

  const { addNote } = useNoteStore();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormData>({});

  const onSubmit = (data: NoteFormData) => {
    if (data) {
      const body = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const encryptedBody = encrypt(
        JSON.stringify(body),
        userPublicKey() as string,
        userPrivateKey() as string,
      );

      addNote({
        id: body.id,
        // @ts-ignore
        ...(encryptedBody as never),
      });
      showToast({ type: "success", text1: t("notes.successAddNote") });
      reset();
      router.back();
    }
  };

  return (
    <AppLayout
      container
      scrollable
      footer={
        <Button
          type="primary"
          label={t("common.save")}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <View style={styles.gap5}>
        <Input
          name="title"
          control={control}
          label={t("notes.noteTitle")}
          rules={{
            required: t("inputError.required", {
              field: t("notes.noteTitle"),
            }),
          }}
          error={errors.title?.message}
        />
        <Input
          name="content"
          control={control}
          label={t("notes.noteContent")}
          multiline
          textAlignVertical="top"
          numberOfLines={10}
          rules={{
            required: t("inputError.required", {
              field: t("notes.noteTitle"),
            }),
          }}
          error={errors.content?.message}
        />
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
    },
  });
