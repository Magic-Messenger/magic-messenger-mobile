import { FlashList } from "@shopify/flash-list";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import {
  AppLayout,
  Button,
  EmptyList,
  Icon,
  NoteItem,
  ThemedText,
} from "@/components";
import { useNoteStore } from "@/store/noteStore";
import { ColorDto, useThemedStyles } from "@/theme";
import {
  decrypt,
  heightPixel,
  userPrivateKey,
  userPublicKey,
  widthPixel,
} from "@/utils";

export default function NoteScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const router = useRouter();

  const { notes, sortType, setSortType } = useNoteStore();

  const decryptNotes = useMemo(() => {
    return notes.map((note) => {
      if ((note as any)?.cipherText && (note as any)?.nonce) {
        return JSON.parse(
          decrypt(
            (note as any).cipherText as never,
            (note as any).nonce as never,
            userPublicKey()!,
            userPrivateKey()!,
          ) as never,
        );
      }
      return note;
    });
  }, [notes]);

  const sortedNotes = useMemo(() => {
    return decryptNotes.sort((a, b) => {
      if (sortType === "asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });
  }, [decryptNotes, sortType]);

  return (
    <AppLayout
      container
      title={
        <View style={styles.newChatButton}>
          <Button
            type="primary"
            label={t("notes.newNote")}
            leftIcon={<Icon type="feather" name="plus" size={18} />}
            textProps={{
              size: 14,
            }}
            onPress={() => router.push("/(tabs)/(notes)/create")}
          />
        </View>
      }
    >
      <FlashList
        data={sortedNotes}
        ListHeaderComponent={
          <View
            style={[
              styles.flexRow,
              styles.alignItemsCenter,
              styles.justifyContentBetween,
              styles.mb4,
            ]}
          >
            <ThemedText type="default" weight="semiBold" size={18}>
              {t("notes.listNotes")}
            </ThemedText>

            <TouchableOpacity
              onPress={() => setSortType(sortType === "asc" ? "desc" : "asc")}
            >
              <Icon
                type="fontawesome5"
                size={18}
                name={
                  sortType === "asc" ? "sort-amount-up" : "sort-amount-down"
                }
              />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.mb4}>
            <NoteItem
              title={item.title}
              updatedAt={t("notes.lastUpdate", {
                date: dayjs(item.updatedAt).format("MMMM D, YYYY"),
              })}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(notes)/edit",
                  params: { noteId: item.id },
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyList
            icon="frown"
            style={[styles.mt10, styles.pl5, styles.pr5] as never}
            textStyle={styles.textCenter}
            label={t("notes.empty")}
          />
        }
      />
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    textCenter: {
      textAlign: "center",
    },
    newChatButton: {
      width: widthPixel(110),
      height: heightPixel(30),
    },
  });
