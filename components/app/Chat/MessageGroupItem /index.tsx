import React, { memo, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { MessageDto, MessageStatus, MessageType } from "@/api/models";
import { Icon, ThemedText } from "@/components";
import { useGroupChatHelper } from "@/hooks";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { AudioMessage } from "../MessageItem/AudioMessage";
import { ImageMessage } from "../MessageItem/ImageMessage";
import { TextMessage } from "../MessageItem/TextMessage";
import { VideoMessage } from "../MessageItem/VideoMessage";

interface MessageItemProps {
  identifier: string;
  messageStatus: MessageStatus;
  message?: MessageDto;
  onReply?: (message: MessageDto) => void;
}

const SWIPE_THRESHOLD = 60;
const REPLY_ICON_WIDTH = 30;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

function MessageGroupItem({
  identifier,
  message,
  messageStatus,
  onReply,
}: MessageItemProps) {
  const styles = useThemedStyles(createStyle);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const {
    decryptedContent,
    isSentByCurrentUser,
    decryptedReplyMessage,
    replyMessageType,
  } = useGroupChatHelper(message as MessageDto);

  const translateX = useSharedValue(0);

  // Mark message as seen
  useEffect(() => {
    if (
      magicHubClient &&
      !isSentByCurrentUser &&
      messageStatus !== MessageStatus.Seen &&
      message?.messageId
    ) {
      magicHubClient.viewedMessage(identifier, message.messageId);
    }
  }, [
    identifier,
    isSentByCurrentUser,
    magicHubClient,
    message?.messageId,
    messageStatus,
  ]);

  const triggerReply = useCallback(() => {
    if (message && onReply && decryptedContent) {
      // Keep original message with encrypted content for store
      // Add decryptedContent for display in reply preview (ChatFooter)
      onReply({
        ...message,
        decryptedContent: decryptedContent as string,
      } as MessageDto);
    }
  }, [message, onReply, decryptedContent]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(10)
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
          "worklet";
          if (event.translationX > 0) {
            translateX.value = Math.min(
              event.translationX,
              SWIPE_THRESHOLD * 1.2,
            );
          }
        })
        .onEnd((event) => {
          "worklet";
          if (event.translationX > SWIPE_THRESHOLD) {
            runOnJS(triggerReply)();
          }

          translateX.value = withSpring(0, SPRING_CONFIG);
        }),
    [triggerReply],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0.5, 1, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        {
          translateX:
            translateX.value > 0 ? translateX.value - REPLY_ICON_WIDTH - 10 : 0,
        },
        { scale },
      ],
    };
  });

  const renderMessageContent = useCallback(() => {
    if (!message || !decryptedContent) return null;

    const isLoading = (message as any)?.isPending === true;

    const messageContentProps = {
      decryptedContent,
      decryptedReplyMessage,
      isSentByCurrentUser,
      createdAt: message.createdAt!,
      isLoading,
      replyMessageType,
      messageStatus,
    };

    switch (message.messageType) {
      case MessageType.Text:
        return <TextMessage {...messageContentProps} />;
      case MessageType.Audio:
        return <AudioMessage {...messageContentProps} />;
      case MessageType.Image:
        return <ImageMessage {...messageContentProps} />;
      case MessageType.Video:
        return <VideoMessage {...messageContentProps} />;
      default:
        return null;
    }
  }, [
    message,
    messageStatus,
    decryptedContent,
    decryptedReplyMessage,
    isSentByCurrentUser,
  ]);

  if (!decryptedContent || !message) return null;

  return (
    <View style={styles.messageWrapper}>
      <Animated.View style={[styles.replyIconContainer, replyIconStyle]}>
        <Icon name="reply" size={20} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedStyle,
            isSentByCurrentUser
              ? styles.senderContainer
              : styles.receiverContainer,
          ]}
        >
          {!isSentByCurrentUser && (
            <ThemedText
              size={11}
              numberOfLines={1}
              weight="semiBold"
              style={styles.mb1}
            >
              {message?.nickname}
            </ThemedText>
          )}

          {renderMessageContent()}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default memo(MessageGroupItem, (prevProps, nextProps) => {
  return (
    prevProps.message?.messageId === nextProps.message?.messageId &&
    prevProps.messageStatus === nextProps.messageStatus
  );
});

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    messageWrapper: {
      position: "relative",
      width: "100%",
      justifyContent: "center",
      gap: spacingPixel(5),
    },
    senderContainer: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderRadius: spacingPixel(8),
      borderBottomRightRadius: 0,
      padding: spacingPixel(10),
      paddingHorizontal: spacingPixel(15),
      marginVertical: spacingPixel(4),
      maxWidth: "80%",
    },
    receiverContainer: {
      alignSelf: "flex-start",
      backgroundColor: colors.secondary,
      borderRadius: spacingPixel(8),
      borderBottomLeftRadius: 0,
      padding: spacingPixel(10),
      marginVertical: spacingPixel(4),
      maxWidth: "80%",
    },
    messageDateSender: {
      alignSelf: "flex-end",
      fontSize: spacingPixel(12),
      color: colors.white,
    },
    messageDateReceiver: {
      alignSelf: "flex-end",
      fontSize: spacingPixel(12),
      color: colors.textDisabled,
    },
    replyIconContainer: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      width: REPLY_ICON_WIDTH,
      height: REPLY_ICON_WIDTH,
      backgroundColor: colors.secondary,
      borderRadius: REPLY_ICON_WIDTH / 2,
      left: 0,
      top: "50%",
      marginTop: -REPLY_ICON_WIDTH / 2,
    },
    flex: {
      flex: 1,
    },
    flexRow: {
      flexDirection: "row",
    },
    alignItemsCenter: {
      alignItems: "center",
    },
    justifyContentEnd: {
      justifyContent: "flex-end",
    },
    gap2: {
      gap: spacingPixel(2),
    },
  });
