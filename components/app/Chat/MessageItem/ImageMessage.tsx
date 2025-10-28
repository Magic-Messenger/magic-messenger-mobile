import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppImage, ThemedText } from "@/components";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { ReplyMessageItem } from "../ReplyMessageItem";
import { MessageFooter } from "./MessageFooter";
import { MessageContentProps } from "./types";

export function ImageMessage({
  decryptedContent,
  decryptedReplyMessage,
  isSentByCurrentUser,
  createdAt,
  messageStatus,
  isLoading,
}: MessageContentProps) {
  const styles = useThemedStyles(createStyle);

  return (
    <View style={styles.container}>
      <ReplyMessageItem message={decryptedReplyMessage} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Sending...</ThemedText>
        </View>
      ) : (
        <AppImage
          source={{ uri: decryptedContent as string }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <MessageFooter
        createdAt={createdAt}
        isSentByCurrentUser={isSentByCurrentUser}
        messageStatus={messageStatus}
      />
    </View>
  );
}

const createStyle = () =>
  StyleSheet.create({
    container: {
      gap: spacingPixel(4),
    },
    image: {
      width: spacingPixel(200),
      height: spacingPixel(200),
      borderRadius: spacingPixel(8),
    },
    loadingContainer: {
      width: spacingPixel(200),
      height: spacingPixel(200),
      borderRadius: spacingPixel(8),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    loadingText: {
      marginTop: spacingPixel(8),
      fontSize: 14,
    },
  });
