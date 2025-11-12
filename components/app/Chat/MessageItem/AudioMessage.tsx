import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { AppImage, Icon, ThemedText } from "@/components";
import { Images } from "@/constants";
import { useAudioPlayer } from "@/hooks";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { ReplyMessageItem } from "../ReplyMessageItem";
import { MessageFooter } from "./MessageFooter";
import { MessageContentProps } from "./types";

export function AudioMessage({
  decryptedContent,
  decryptedReplyMessage,
  isSentByCurrentUser,
  createdAt,
  messageStatus,
  isLoading,
}: MessageContentProps) {
  const { loadAndPlay, pause, isPlaying } = useAudioPlayer();

  return (
    <>
      <ReplyMessageItem message={decryptedReplyMessage} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <ThemedText style={styles.loadingText}>Sending...</ThemedText>
        </View>
      ) : (
        <View style={styles.audioContainer}>
          <TouchableOpacity
            onPress={() => {
              if (isPlaying) {
                pause();
              } else {
                loadAndPlay(decryptedContent as string);
              }
            }}
          >
            <Icon name={isPlaying ? "pause-circle" : "play-circle"} size={30} />
          </TouchableOpacity>

          <AppImage
            source={Images.soundPreview}
            resizeMode="contain"
            width={100}
            height={30}
            style={isPlaying ? styles.audioActive : styles.audioInactive}
          />
        </View>
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
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingPixel(8),
  },
  audioActive: {
    opacity: 1,
  },
  audioInactive: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingPixel(8),
    paddingVertical: spacingPixel(8),
  },
  loadingText: {
    fontSize: 14,
  },
});
