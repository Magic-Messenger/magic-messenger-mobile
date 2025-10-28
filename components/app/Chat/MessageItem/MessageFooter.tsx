import React from "react";
import { StyleSheet, View } from "react-native";

import { MessageStatus } from "@/api/models";
import { Icon, ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";
import { dateFormatter, spacingPixel } from "@/utils";

interface MessageFooterProps {
  createdAt: string;
  isSentByCurrentUser: boolean;
  messageStatus?: MessageStatus;
}

export function MessageFooter({
  createdAt,
  isSentByCurrentUser,
  messageStatus,
}: MessageFooterProps) {
  const styles = useThemedStyles(createStyles);

  const renderMessageStatus = () => {
    if (!isSentByCurrentUser) return null;

    switch (messageStatus) {
      case MessageStatus.Sent:
        return (
          <Icon
            type="ionicons"
            name="checkmark"
            size={16}
            color="white"
            style={styles.statusIcon}
          />
        );
      case MessageStatus.Delivered:
        return (
          <Icon
            type="ionicons"
            name="checkmark-done"
            size={16}
            color="white"
            style={styles.statusIcon}
          />
        );
      case MessageStatus.Seen:
        return (
          <Icon
            type="ionicons"
            name="checkmark-done"
            size={16}
            color="lightblue"
            style={styles.statusIconSeen}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText
        style={isSentByCurrentUser ? styles.dateSender : styles.dateReceiver}
      >
        {dateFormatter(createdAt, "HH:mm")}
      </ThemedText>
      {renderMessageStatus()}
    </View>
  );
}

const createStyles = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: spacingPixel(4),
    },
    dateSender: {
      fontSize: spacingPixel(12),
      color: colors.white,
    },
    dateReceiver: {
      fontSize: spacingPixel(12),
      color: colors.textDisabled,
    },
    statusIcon: {
      marginLeft: spacingPixel(5),
      opacity: 0.6,
    },
    statusIconSeen: {
      marginLeft: spacingPixel(5),
    },
  });
