import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { MessageType } from "@/api/models";
import { Icon } from "@/components/ui";
import { ColorDto, useColor, useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { ThemedText } from "../../ThemedText";
import { AudioMessage } from "../MessageItem/AudioMessage";
import { ImageMessage } from "../MessageItem/ImageMessage";
import { TextMessage } from "../MessageItem/TextMessage";
import { VideoMessage } from "../MessageItem/VideoMessage";

interface ReplyMessageItemProps {
  message?: any;
  replyMessageType?: MessageType;
}

export function ReplyMessageItem({
  message,
  replyMessageType,
}: ReplyMessageItemProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColor();

  const renderMessageContent = useCallback(() => {
    switch (replyMessageType) {
      case MessageType.Text:
        return <TextMessage isReply={true} decryptedContent={message} />;
      case MessageType.Audio:
        return <AudioMessage isReply={true} decryptedContent={message} />;
      case MessageType.Image:
        return <ImageMessage isReply={true} decryptedContent={message} />;
      case MessageType.Video:
        return <VideoMessage isReply={true} decryptedContent={message} />;
      default:
        return null;
    }
  }, [message, replyMessageType]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="reply" size={14} color={colors.colors.text} />
      </View>
      <View style={styles.contentContainer}>
        <ThemedText style={styles.label}>{t("chat.repliedMessage")}</ThemedText>
        {renderMessageContent()}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      padding: spacingPixel(8),
      paddingLeft: spacingPixel(10),
      borderLeftWidth: spacingPixel(3),
      borderRadius: spacingPixel(6),
      borderColor: colors.primary,
      marginBottom: spacingPixel(8),
      opacity: 0.9,
      width: "auto",
      minWidth: spacingPixel(120),
    },
    iconContainer: {
      justifyContent: "center",
      marginRight: spacingPixel(8),
    },
    contentContainer: {
      gap: spacingPixel(10),
    },
    label: {
      fontSize: spacingPixel(10),
      opacity: 0.7,
      fontWeight: "600",
    },
    message: {
      fontSize: spacingPixel(13),
      opacity: 0.8,
    },
  });
