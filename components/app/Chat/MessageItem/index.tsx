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
import { GradientBackground, Icon } from "@/components";
import { Colors } from "@/constants";
import { useChatHelper } from "@/hooks";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../../utils/pixelHelper";
import { AudioMessage } from "./AudioMessage";
import { ImageMessage } from "./ImageMessage";
import { TextMessage } from "./TextMessage";
import { VideoMessage } from "./VideoMessage";

interface MessageItemProps {
  identifier: string;
  message?: MessageDto;
  messageStatus: MessageStatus;
  receiverPublicKey: string;
  onReply?: (message: MessageDto) => void;
}

const SWIPE_THRESHOLD = 60;
const REPLY_ICON_WIDTH = 30;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

function MessageItem({
  identifier,
  message,
  messageStatus,
  receiverPublicKey,
  onReply,
}: MessageItemProps) {
  const styles = useThemedStyles(createStyle);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const {
    decryptedContent,
    isSentByCurrentUser,
    decryptedReplyMessage,
    replyMessageType,
  } = useChatHelper(message as MessageDto, receiverPublicKey);

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
        .activeOffsetX(10) // Prevent accidental triggers
        .failOffsetY([-10, 10]) // Allow vertical scrolling
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
      messageStatus,
      isLoading,
      replyMessageType,
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

  // Early return if no content
  if (!decryptedContent || !message) return null;

  return (
    <View style={styles.messageWrapper}>
      <Animated.View style={[styles.replyIconContainer, replyIconStyle]}>
        <Icon name="reply" size={20} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle]}>
          <GradientBackground
            colors={
              isSentByCurrentUser
                ? Colors.buttonPrimary
                : Colors.buttonSecondary
            }
            style={[
              isSentByCurrentUser
                ? styles.senderContainer
                : styles.receiverContainer,
            ]}
          >
            {renderMessageContent()}
          </GradientBackground>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default memo(MessageItem, (prevProps, nextProps) => {
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
      /* backgroundColor: colors.primary, */
      borderRadius: spacingPixel(8),
      borderBottomRightRadius: 0,
      padding: spacingPixel(10),
      paddingHorizontal: spacingPixel(15),
      marginVertical: spacingPixel(4),
      maxWidth: "80%",
    },
    receiverContainer: {
      alignSelf: "flex-start",
      /* backgroundColor: colors.secondary, */
      borderRadius: spacingPixel(8),
      borderBottomLeftRadius: 0,
      padding: spacingPixel(10),
      marginVertical: spacingPixel(4),
      maxWidth: "80%",
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
  });
