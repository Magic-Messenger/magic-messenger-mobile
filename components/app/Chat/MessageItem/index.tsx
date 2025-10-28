import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { MessageDto, MessageStatus, MessageType } from "@/api/models";
import { Icon } from "@/components";
import { useChatHelper } from "@/hooks";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel, trackEvent } from "@/utils";

import { AudioMessage } from "./AudioMessage";
import { ImageMessage } from "./ImageMessage";
import { TextMessage } from "./TextMessage";
import { VideoMessage } from "./VideoMessage";

interface MessageItemProps {
  identifier: string;
  message?: MessageDto;
  receiverPublicKey: string;
  onReply?: (message: MessageDto) => void;
}

const SWIPE_THRESHOLD = 60;
const REPLY_ICON_WIDTH = 30;

export function MessageItem({
  identifier,
  message,
  receiverPublicKey,
  onReply,
}: MessageItemProps) {
  const styles = useThemedStyles(createStyle);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const { decryptedContent, isSentByCurrentUser, decryptedReplyMessage } =
    useChatHelper(message as MessageDto, receiverPublicKey);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (
      magicHubClient &&
      !isSentByCurrentUser &&
      message?.messageStatus !== MessageStatus.Seen &&
      message?.messageId
    ) {
      trackEvent("message_seen", { messageId: message.messageId });
      magicHubClient.viewedMessage(identifier, message.messageId);
    }
  }, [
    identifier,
    isSentByCurrentUser,
    magicHubClient,
    message?.messageId,
    message?.messageStatus,
  ]);

  const triggerReply = () => {
    if (message && onReply) {
      onReply({
        ...message,
        content: decryptedContent as string,
      } as MessageDto);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, SWIPE_THRESHOLD * 1.2);
        const progress = Math.min(event.translationX / SWIPE_THRESHOLD, 1);
        opacity.value = progress;
      }
    })
    .onEnd((event) => {
      "worklet";
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(triggerReply)();
      }

      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateX:
          translateX.value > 0 ? translateX.value - REPLY_ICON_WIDTH - 10 : 0,
      },
    ],
  }));

  const renderMessageContent = () => {
    if (!message || !decryptedContent) return null;

    const isLoading = (message as any)?.isPending === true;

    const messageContentProps = {
      decryptedContent,
      decryptedReplyMessage,
      isSentByCurrentUser,
      createdAt: message.createdAt!,
      messageStatus: message.messageStatus,
      isLoading,
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
  };

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
          {renderMessageContent()}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

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
    replyIconContainer: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      width: REPLY_ICON_WIDTH,
      height: REPLY_ICON_WIDTH,
      backgroundColor: colors.secondary,
      borderRadius: REPLY_ICON_WIDTH / 2,
      transform: [{ translateY: -REPLY_ICON_WIDTH / 2 }],
    },
  });
