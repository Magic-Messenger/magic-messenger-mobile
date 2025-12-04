import React from "react";
import { StyleSheet, View } from "react-native";

import { MessageStatus } from "@/api/models";
import { ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";

import { dateFormatter, renderMessageStatus } from "../../../../utils/helper";
import { spacingPixel } from "../../../../utils/pixelHelper";

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

  return (
    <View style={styles.container}>
      <ThemedText
        style={isSentByCurrentUser ? styles.dateSender : styles.dateReceiver}
      >
        {dateFormatter(createdAt, "HH:mm")}
      </ThemedText>
      {renderMessageStatus(messageStatus!, isSentByCurrentUser)}
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
  });
