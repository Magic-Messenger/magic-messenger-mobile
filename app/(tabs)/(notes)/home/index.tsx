import { FlashList } from "@shopify/flash-list";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import {
  AppLayout,
  Button,
  EmptyList,
  Icon,
  NoteItem,
  ProtectedRoute,
  ThemedText,
} from "@/components";
import { useProtectRouteStore } from "@/store";
import { NoteDto, useNoteStore } from "@/store/noteStore";
import { useThemedStyles } from "@/theme";
import {
  decrypt,
  heightPixel,
  showToast,
  userPrivateKey,
  userPublicKey,
  widthPixel,
} from "@/utils";

export default function NoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useThemedStyles(createStyle);

  const { notes, sortType, setSortType } = useNoteStore();
  const { isLoginProtected, setIsLoginProtected } = useProtectRouteStore();

  /** Safely decrypt notes */
  const decryptNotes = useMemo(() => {
    return notes.map((note) => {
      try {
        if (note?.cipherText && note?.nonce) {
          const decrypted = decrypt(
            note.cipherText,
            note.nonce,
            userPublicKey()!,
            userPrivateKey()!,
          );
          return JSON.parse(decrypted as never);
        }
        return note;
      } catch (error) {
        console.warn("Failed to decrypt note:", note.id, error);
        return note;
      }
    });
  }, [notes]);

  /** Sort notes immutably */
  const sortedNotes = useMemo(() => {
    return [...decryptNotes].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortType === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [decryptNotes, sortType]);

  /** Render each note */
  const renderItem = useCallback(
    ({ item }: { item: NoteDto }) => (
      <NoteItem
        title={item.title}
        updatedAt={t("notes.lastUpdate", {
          date: dayjs(item.updatedAt).format("DD MMMM, YYYY"),
        })}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/(notes)/edit",
            params: { noteId: item.id },
          })
        }
      />
    ),
    [router, t],
  );

  /** Toggle sorting */
  const handleToggleSort = useCallback(() => {
    setSortType(sortType === "asc" ? "desc" : "asc");
  }, [sortType, setSortType]);

  const handleLockNotes = useCallback(() => {
    setIsLoginProtected(false);
    showToast({
      type: "success",
      text1: t("notes.noteLocked"),
    });
  }, [setIsLoginProtected]);

  const NotesHeader = useCallback(
    () => (
      <View style={styles.headerRow}>
        <ThemedText type="default" weight="semiBold" size={18}>
          {t("notes.listNotes")}
        </ThemedText>
        <View style={[styles.flexRow, styles.alignItemsCenter]}>
          <TouchableOpacity onPress={handleLockNotes} style={styles.sortButton}>
            <Icon size={20} name="lock" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleSort}
            style={styles.sortButton}
          >
            <Icon
              type="fontawesome5"
              size={18}
              name={sortType === "asc" ? "sort-amount-up" : "sort-amount-down"}
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [],
  );

  const NotesEmptyList = useCallback(
    () => (
      <EmptyList
        icon="frown"
        style={styles.emptyList}
        textStyle={styles.textCenter}
        label={t("notes.empty")}
      />
    ),
    [t, styles.emptyList, styles.textCenter],
  );

  if (!isLoginProtected) {
    return (
      <ProtectedRoute
        title="notes.lockNoteTitle"
        description="notes.lockNoteDescription"
        buttonText="notes.lockNoteButton"
        buttonIcon={<Icon type="feather" name="eye" />}
      />
    );
  }
  return (
    <AppLayout
      container
      title={
        <View style={styles.newNoteButton}>
          <Button
            type="primary"
            label={t("notes.newNote")}
            leftIcon={<Icon type="feather" name="plus" size={18} />}
            textProps={{ size: 14 }}
            onPress={() => router.push("/(tabs)/(notes)/create")}
          />
        </View>
      }
    >
      <FlashList
        data={sortedNotes}
        keyExtractor={(item) => item.id!}
        renderItem={renderItem}
        ListHeaderComponent={NotesHeader}
        ListEmptyComponent={NotesEmptyList}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        drawDistance={400}
        removeClippedSubviews
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold: 10,
        }}
      />
    </AppLayout>
  );
}

const createStyle = () =>
  StyleSheet.create({
    newNoteButton: {
      width: widthPixel(110),
      height: heightPixel(30),
    },
    textCenter: {
      textAlign: "center",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: heightPixel(10),
    },
    sortButton: {
      padding: widthPixel(6),
    },
    emptyList: {
      marginTop: heightPixel(20),
      paddingHorizontal: widthPixel(20),
    },
  });
