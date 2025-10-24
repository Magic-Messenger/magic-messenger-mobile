import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";

import { AppLayout, Button, Input } from "@/components";
import { NoteDto, useNoteStore } from "@/store/noteStore";
import { ColorDto, useThemedStyles } from "@/theme";
import {
  decrypt,
  encrypt,
  showToast,
  userPrivateKey,
  userPublicKey,
} from "@/utils";

interface NoteFormData {
  title: string;
  content: string;
}

export default function EditScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const router = useRouter();
  const { noteId } = useLocalSearchParams();

  const [noteDetailData, setNoteDetailData] = useState<NoteDto>();

  const [viewType, setViewType] = React.useState<"view" | "edit">("view");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormData>({});

  const { notes, updateNote, deleteNote } = useNoteStore();

  useEffect(() => {
    const selectNote = notes.find((n) => n.id === noteId);

    if (
      selectNote &&
      (selectNote as any)?.cipherText &&
      (selectNote as any)?.nonce
    ) {
      const decryptContent = JSON.parse(
        decrypt(
          (selectNote as any).cipherText as never,
          (selectNote as any).nonce as never,
          userPublicKey()!,
          userPrivateKey()!,
        ) as never,
      );
      setNoteDetailData(decryptContent);
      reset(decryptContent);
    }
  }, [noteId, notes]);

  const onSubmit = (data: NoteFormData) => {
    if (data) {
      const body = {
        id: noteId,
        title: data.title,
        content: data.content,
        updatedAt: new Date().toISOString(),
        createdAt: noteDetailData?.createdAt as never,
      };

      const encryptedBody = encrypt(
        JSON.stringify(body),
        userPublicKey() as string,
        userPrivateKey() as string,
      );

      updateNote(noteId as string, {
        id: noteId as string,
        //@ts-ignore
        ...(encryptedBody as never),
      });
      showToast({ type: "success", text1: t("notes.successUpdateNote") });
      reset();
      router.back();
    }
  };

  const onDelete = () => {
    Alert.alert(
      t("notes.deleteMessageTitle"),
      t("notes.deleteMessageMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            if (noteId) {
              deleteNote(noteId as string);
              showToast({
                type: "success",
                text1: t("notes.successDeleteNote"),
              });
              router.back();
            }
          },
        },
      ],
    );
  };

  return (
    <AppLayout
      container
      scrollable
      footer={
        <>
          {viewType === "view" ? (
            <Button
              type="secondary"
              label={t("notes.editNote")}
              onPress={() => setViewType("edit")}
            />
          ) : (
            <Button
              type="primary"
              label={t("notes.save")}
              onPress={handleSubmit(onSubmit)}
            />
          )}

          {viewType === "edit" && (
            <>
              <Button
                type="danger"
                label={t("notes.delete")}
                onPress={onDelete}
                style={styles.mt2}
              />

              <Button
                type="secondary"
                label={t("common.cancel")}
                onPress={() => setViewType("view")}
                style={styles.mt2}
              />
            </>
          )}
        </>
      }
    >
      <View style={styles.gap5}>
        <Input
          name="title"
          editable={viewType === "edit"}
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
          editable={viewType === "edit"}
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
