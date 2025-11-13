import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { usePostApiChatsUpload } from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { Icon, Input, ThemedText } from "@/components";
import { UploadFileResultDto } from "@/constants";
import { useAudioRecorder, usePicker } from "@/hooks";
import { useSignalRStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";

import { trackEvent } from "../../../../utils/helper";
import { heightPixel, spacingPixel } from "../../../../utils/pixelHelper";

interface ChatFooterProps {
  chatId: string;
  replyMessage?: MessageDto | null;
  onClearReply?: () => void;
  onSend: (message: string | UploadFileResultDto) => void;
  displaySendMessageAlways?: boolean;
  displaySendImage?: boolean;
  displaySendVoice?: boolean;
}

export function ChatFooter({
  chatId,
  onSend,
  replyMessage,
  onClearReply,
  displaySendMessageAlways = false,
  displaySendImage = true,
  displaySendVoice = true,
}: ChatFooterProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const { userName: currUserName } = useUserStore();

  const { isRecording, startRecording, stopRecording, deleteRecording, duration } = useAudioRecorder(); //prettier-ignore
  const { pickImage } = usePicker();
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const { mutateAsync: requestUpload } = usePostApiChatsUpload();

  const [message, setMessage] = useState("");

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
    if (chatId) {
      magicHubClient?.stopTyping(chatId as string);
    }
  }, [magicHubClient, chatId, message, onSend]);

  const onChangeText = useCallback(
    (text: string) => {
      setMessage(text);
      if (chatId) {
        if (text.length > 0) {
          magicHubClient?.typing(chatId as string);
        } else {
          magicHubClient?.stopTyping(chatId as string);
        }
      }
    },
    [magicHubClient, chatId],
  );

  const handleSendRecording = async () => {
    try {
      const uri = await stopRecording();
      if (uri) {
        const responseFetch = await fetch(uri);
        const audioData = await responseFetch.blob();

        const { data, success } = await requestUpload({
          data: {
            file: {
              uri: uri,
              name: `${Date.now()}-recording.m4a`,
              type: audioData.type,
            } as any,
          },
        });

        if (success && data?.fileUrl) {
          onSend?.({
            ...data,
            messageType: MessageType.Audio,
          });
        }
      }
    } catch (error) {
      trackEvent("send_audio_message_error: ", error);
    }
  };

  const handleSendImage = async () => {
    try {
      const uri = await pickImage();
      if (uri) {
        const responseFetch = await fetch(uri);
        const imageData = await responseFetch.blob();

        const extensionMatch = uri.match(/\.(\w+)(?:\?|$)/);
        const extension = extensionMatch ? extensionMatch[1] : "jpg";

        const { data, success } = await requestUpload({
          data: {
            file: {
              uri,
              name: `${Date.now()}.${extension}`,
              type: imageData.type || `image/${extension}`,
            } as any,
          },
        });

        if (success && data?.fileUrl) {
          onSend?.({
            ...data,
            messageType: MessageType.Image,
          });
        }
      }
    } catch (error) {
      trackEvent("send_image_message_error: ", error);
    }
  };

  const renderMessageInput = () => (
    <Input
      placeholder={t("chatDetail.writeMessage")}
      style={styles.flex}
      inputStyle={styles.input}
      value={message}
      onChangeText={onChangeText}
    />
  );

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const renderRecordingUI = () => (
    <View style={styles.recordingContainer}>
      <TouchableOpacity onPress={deleteRecording}>
        <Icon type="feather" name="trash" />
      </TouchableOpacity>
      <View style={styles.recordingContent}>
        <ThemedText style={styles.recordingTime}>
          {formatDuration(duration)}
        </ThemedText>
        <ThemedText>Recording...</ThemedText>
      </View>
    </View>
  );

  const renderActionButtons = () => {
    if (displaySendMessageAlways || message.trim().length > 0) {
      return (
        <TouchableOpacity onPress={handleSendMessage}>
          <Icon type="feather" name="send" color="white" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.flexRow, styles.alignItemsCenter, styles.gap3]}>
        {displaySendImage && (
          <TouchableOpacity disabled={isRecording} onPress={handleSendImage}>
            <Icon
              type="feather"
              name="image"
              color={isRecording ? "gray" : "white"}
            />
          </TouchableOpacity>
        )}
        {displaySendVoice && (
          <TouchableOpacity
            onPress={isRecording ? handleSendRecording : startRecording}
          >
            <Icon type="feather" name={isRecording ? "send" : "mic"} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReplayMessage = useMemo(() => {
    if (!replyMessage) return null;

    const senderName =
      replyMessage?.senderUsername === currUserName
        ? currUserName
        : replyMessage?.senderUsername;
    return (
      <View style={styles.replayContainer}>
        <TouchableOpacity style={styles.closeIcon} onPress={onClearReply}>
          <Icon name="close" size={18} />
        </TouchableOpacity>
        <ThemedText weight="bold" type="link" size={13}>
          {t("chatDetail.replyingTo", {
            senderName,
          })}
        </ThemedText>

        {replyMessage?.messageType === MessageType.Text && (
          <ThemedText numberOfLines={1} ellipsizeMode="tail" size={13}>
            {replyMessage?.content as string}
          </ThemedText>
        )}
        {replyMessage?.messageType === MessageType.Image && (
          <ThemedText type="link" size={13}>
            {t("common.image")}
          </ThemedText>
        )}
        {replyMessage?.messageType === MessageType.Audio && (
          <ThemedText type="link" size={13}>
            {t("common.audio")}
          </ThemedText>
        )}
        {replyMessage?.messageType === MessageType.Video && (
          <ThemedText type="link" size={13}>
            {t("common.video")}
          </ThemedText>
        )}
      </View>
    );
  }, [replyMessage]);

  useEffect(() => {
    return () => {
      magicHubClient?.stopTyping(chatId as string);
    };
  }, []);

  return (
    <>
      {renderReplayMessage}
      <View style={styles.container}>
        {isRecording ? renderRecordingUI() : renderMessageInput()}
        <View style={styles.iconContainer}>{renderActionButtons()}</View>
      </View>
    </>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      paddingHorizontal: spacingPixel(15),
      gap: spacingPixel(10),
      marginVertical: spacingPixel(10),
    },
    input: {
      flex: 1,
      height: heightPixel(40),
    },
    iconContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    recordingContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacingPixel(10),
    },
    recordingContent: {
      flex: 1,
      height: heightPixel(40),
      flexDirection: "row",
      alignItems: "center",
      gap: spacingPixel(10),
      backgroundColor: colors.secondary,
      borderRadius: spacingPixel(9),
      paddingHorizontal: spacingPixel(10),
    },
    recordingTime: { color: colors.danger },
    replayContainer: {
      position: "relative",
      marginHorizontal: spacingPixel(15),
      backgroundColor: colors.secondary,
      borderRadius: spacingPixel(9),
      padding: spacingPixel(10),
    },
    closeIcon: {
      position: "absolute",
      right: 0,
      top: -10,
      backgroundColor: colors.primary,
      height: spacingPixel(30),
      width: spacingPixel(30),
      borderRadius: spacingPixel(50),
      justifyContent: "center",
      alignItems: "center",
    },
  });
