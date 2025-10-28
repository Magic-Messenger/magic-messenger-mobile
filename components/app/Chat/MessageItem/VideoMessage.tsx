import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText, VideoPreview } from "@/components";
import { spacingPixel } from "@/utils";

import { ReplyMessageItem } from "../ReplyMessageItem";
import { MessageFooter } from "./MessageFooter";
import { MessageContentProps } from "./types";

export function VideoMessage({
  decryptedContent,
  decryptedReplyMessage,
  isSentByCurrentUser,
  createdAt,
  messageStatus,
  isLoading,
}: MessageContentProps) {
  return (
    <>
      <ReplyMessageItem message={decryptedReplyMessage} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Sending...</ThemedText>
        </View>
      ) : (
        <VideoPreview source={decryptedContent as string} />
      )}

      <MessageFooter
        createdAt={createdAt}
        isSentByCurrentUser={isSentByCurrentUser}
        messageStatus={messageStatus}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
