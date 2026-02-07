import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
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
  const { pickMedia, isProcessing, progress } = usePicker();
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const { mutateAsync: requestUpload } = usePostApiChatsUpload();

  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<
    "image" | "video" | "audio" | null
  >(null);

  // Stop typing on unmount (router go back) and app state change (background)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        if (chatId && magicHubClient) {
          magicHubClient.stopTyping(chatId);
        }
      }
    });

    return () => {
      subscription.remove();
      if (chatId && magicHubClient) {
        magicHubClient.stopTyping(chatId);
      }
    };
  }, [chatId, magicHubClient]);

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

      startTransition(() => {
        setIsUploading(true);
        setUploadType("audio");
      });

      const extensionMatch = uri.match(/\.(\w+)(?:\?|$)/);
      const extension = extensionMatch?.[1];

      const { data, success } = await requestUpload({
        data: {
          file: {
            uri,
            name: `${Date.now()}.${extension}`,
            type: `audio/${extension}`,
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
      startTransition(() => {
        setIsUploading(false);
        setUploadType(null);
      });
    }
  };

  const handleSendMedia = async () => {
    try {
      const media = await pickMedia();
      if (!media) return;

      const isVideo = media.type === "video";

      startTransition(() => {
        setIsUploading(true);
        setUploadType(isVideo ? "video" : "image");
      });

      const extensionMatch = media.uri.match(/\.(\w+)(?:\?|$)/);
      const extension = isVideo ? "mp4" : extensionMatch?.[1] || "jpg";
      const mimeType = isVideo ? "video/mp4" : `image/${extension}`;

      const { data, success } = await requestUpload({
        data: {
          file: {
            uri: media.uri,
            name: `${Date.now()}.${extension}`,
            type: mimeType,
          } as any,
        },
      });

      if (success && data?.fileUrl) {
        onSend({
          ...data,
          messageType: isVideo ? MessageType.Video : MessageType.Image,
        });
      }
    } catch (error) {
      trackEvent("send_media_message_error", error);
    } finally {
      startTransition(() => {
        setIsUploading(false);
        setUploadType(null);
      });
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
          <TouchableOpacity
            disabled={isRecording || isProcessing}
            onPress={handleSendMedia}
          >
            <Icon
              type="feather"
              name="image"
              color={isRecording || isProcessing ? "#D3D3D3" : "white"}
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

  const getUploadingText = () => {
    if (isProcessing && progress > 0) {
      return `${t("chatDetail.compressingVideo")} ${progress}%`;
    }
    switch (uploadType) {
      case "video":
        return t("chatDetail.uploadingVideo");
      case "image":
        return t("chatDetail.uploadingImage");
      case "audio":
        return t("chatDetail.uploadingAudio");
      default:
        return "Waiting...";
    }
  };

  // Inline loading indicator instead of Modal to prevent iOS touch lock bug
  const renderUploadingIndicator = () => {
    if (!isUploading && !isProcessing) return null;
    return (
      <View style={styles.uploadingIndicator}>
        <ActivityIndicator size="small" color="white" />
        <ThemedText style={styles.uploadingIndicatorText}>
          {getUploadingText()}
        </ThemedText>
      </View>
    );
  };

  const renderReplyMessage = useMemo(() => {
    if (!replyMessage) return null;

    const senderName =
      replyMessage.senderUsername === currUserName
        ? currUserName
        : replyMessage.senderUsername;

    const messageTypeKey =
      MESSAGE_TYPE_LABELS[replyMessage.messageType as never];

    // Use decryptedContent for display (added by MessageItem/MessageGroupItem)
    const decryptedText = (replyMessage as any).decryptedContent as string;
    const messageLabel = messageTypeKey ? t(messageTypeKey) : decryptedText;

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
            ? decryptedText
            : messageLabel}
        </ThemedText>
      </View>
    );
  }, [replyMessage, currUserName, t, styles, onClearReply]);

  return (
    <>
      {renderUploadingIndicator()}
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
    uploadingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
      marginHorizontal: spacingPixel(15),
      borderRadius: spacingPixel(9),
      paddingHorizontal: spacingPixel(10),
      paddingVertical: spacingPixel(15),
      marginBottom: spacingPixel(5),
      gap: spacingPixel(8),
    },
    uploadingIndicatorText: {
      color: "white",
      fontSize: 13,
    },
  });
