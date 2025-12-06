import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { usePostApiChatsUpload } from "@/api/endpoints/magicMessenger";
import { MessageDto, MessageType } from "@/api/models";
import { UploadFileResultDto } from "@/constants";
import { useAudioRecorder, usePicker } from "@/hooks";
import { useSignalRStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";

import { trackEvent } from "../../../../utils/helper";
import { heightPixel, spacingPixel } from "../../../../utils/pixelHelper";
import { GradientBackground } from "../../../ui/GradientBackground";
import { Icon } from "../../../ui/Icon";
import { Input } from "../../../ui/Input";
import { ThemedText } from "../../ThemedText";

interface ChatFooterProps {
  chatId: string;
  replyMessage?: MessageDto | null;
  onClearReply?: () => void;
  onSend: (message: string | UploadFileResultDto) => void;
  displaySendMessageAlways?: boolean;
  displaySendImage?: boolean;
  displaySendVoice?: boolean;
}

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  [MessageType.Text]: "chatDetail.text",
  [MessageType.Image]: "common.image",
  [MessageType.Audio]: "common.audio",
  [MessageType.Video]: "common.video",
};

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

  const {
    isRecording,
    startRecording,
    stopRecording,
    deleteRecording,
    duration,
  } = useAudioRecorder();
  const { pickImage } = usePicker();
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const { mutateAsync: requestUpload } = usePostApiChatsUpload();

  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "audio" | null>(null);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessage("");

    onSend(trimmedMessage);

    if (chatId && magicHubClient) {
      magicHubClient.stopTyping(chatId);
    }
  }, [magicHubClient, chatId, message, onSend]);

  const onChangeText = useCallback(
    (text: string) => {
      setMessage(text);
      if (chatId && magicHubClient) {
        if (text.length > 0) {
          magicHubClient.typing(chatId);
        } else {
          magicHubClient.stopTyping(chatId);
        }
      }
    },
    [magicHubClient, chatId],
  );

  const handleSendRecording = async () => {
    try {
      const uri = await stopRecording();
      if (!uri) return;

      setIsUploading(true);
      setUploadType("audio");

      const responseFetch = await fetch(uri);
      const audioData = await responseFetch.blob();

      const { data, success } = await requestUpload({
        data: {
          file: {
            uri,
            name: `${Date.now()}-recording.m4a`,
            type: audioData.type,
          } as any,
        },
      });

      if (success && data?.fileUrl) {
        onSend({
          ...data,
          messageType: MessageType.Audio,
        });
      }
    } catch (error) {
      trackEvent("send_audio_message_error", error);
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleSendImage = async () => {
    try {
      const uri = await pickImage();
      if (!uri) return;

      setIsUploading(true);
      setUploadType("image");

      const responseFetch = await fetch(uri);
      const imageData = await responseFetch.blob();

      const extensionMatch = uri.match(/\.(\w+)(?:\?|$)/);
      const extension = extensionMatch?.[1] ?? "jpg";

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
        onSend({
          ...data,
          messageType: MessageType.Image,
        });
      }
    } catch (error) {
      trackEvent("send_image_message_error", error);
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const formatDuration = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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

  const renderRecordingUI = () => (
    <View style={styles.recordingContainer}>
      <TouchableOpacity onPress={deleteRecording}>
        <Icon type="feather" name="trash" color="white" />
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
              color={isRecording ? "#D3D3D3" : "white"}
            />
          </TouchableOpacity>
        )}
        {displaySendVoice && (
          <TouchableOpacity
            onPress={isRecording ? handleSendRecording : startRecording}
          >
            <Icon
              type="feather"
              name={isRecording ? "send" : "mic"}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderUploadingModal = () => (
    <Modal transparent visible={isUploading} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color="white" />
          <ThemedText style={styles.uploadingText}>
            {uploadType === "image"
              ? t("chatDetail.uploadingImage")
              : t("chatDetail.uploadingAudio")}
          </ThemedText>
        </View>
      </View>
    </Modal>
  );

  const renderReplyMessage = useMemo(() => {
    if (!replyMessage) return null;

    const senderName =
      replyMessage.senderUsername === currUserName
        ? currUserName
        : replyMessage.senderUsername;

    const messageTypeKey =
      MESSAGE_TYPE_LABELS[replyMessage.messageType as never];
    const messageLabel = messageTypeKey
      ? t(messageTypeKey)
      : (replyMessage.content as string);

    return (
      <View style={styles.replayContainer}>
        <TouchableOpacity style={styles.closeIcon} onPress={onClearReply}>
          <Icon name="close" size={18} color="white" />
        </TouchableOpacity>
        <ThemedText weight="bold" type="link" size={13}>
          {t("chatDetail.replyingTo", { senderName })}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          size={13}
          type={
            replyMessage.messageType === MessageType.Text ? "default" : "link"
          }
        >
          {replyMessage.messageType === MessageType.Text
            ? (replyMessage.content as string)
            : messageLabel}
        </ThemedText>
      </View>
    );
  }, [replyMessage, currUserName, t, styles, onClearReply]);

  return (
    <>
      {renderUploadingModal()}
      {renderReplyMessage}
      <GradientBackground style={styles.container}>
        {isRecording ? renderRecordingUI() : renderMessageInput()}
        <View style={styles.iconContainer}>{renderActionButtons()}</View>
      </GradientBackground>
    </>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacingPixel(15),
      gap: spacingPixel(10),
      height: heightPixel(80),
    },
    flex: {
      flex: 1,
    },
    input: {
      flex: 1,
      height: heightPixel(40),
    },
    iconContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    flexRow: {
      flexDirection: "row",
    },
    alignItemsCenter: {
      alignItems: "center",
    },
    gap3: {
      gap: spacingPixel(10),
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
    recordingTime: {
      color: colors.danger,
    },
    replayContainer: {
      position: "relative",
      marginHorizontal: spacingPixel(15),
      backgroundColor: colors.secondary,
      borderRadius: spacingPixel(9),
      padding: spacingPixel(10),
      marginBottom: spacingPixel(5),
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.secondary,
      borderRadius: spacingPixel(12),
      padding: spacingPixel(24),
      alignItems: "center",
      gap: spacingPixel(12),
      minWidth: spacingPixel(150),
    },
    uploadingText: {
      marginTop: spacingPixel(8),
      color: "white",
    },
  });
