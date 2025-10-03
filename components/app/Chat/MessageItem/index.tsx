import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { MessageDto, MessageStatus, MessageType } from "@/api/models";
import { AppImage, Icon, ThemedText, VideoPreview } from "@/components";
import { Images } from "@/constants";
import { useAudioPlayer, useChatHelper } from "@/hooks";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { dateFormatter, spacingPixel, trackEvent } from "@/utils";

import { ReplyMessageItem } from "../ReplyMessageItem";

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

  const { loadAndPlay, pause, isPlaying } = useAudioPlayer();

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

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

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const replyIconStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: opacity.value,
      transform: [
        {
          translateX:
            translateX.value > 0 ? translateX.value - REPLY_ICON_WIDTH - 10 : 0,
        },
      ],
    };
  });

  useMemo(() => {
    if (
      magicHubClient &&
      !isSentByCurrentUser &&
      message?.messageStatus !== MessageStatus.Seen
    ) {
      trackEvent("message_seen", { messageId: message?.messageId });
      magicHubClient.viewedMessage(identifier, message?.messageId as string);
    }
  }, [
    identifier,
    isSentByCurrentUser,
    magicHubClient,
    message?.messageId,
    message?.messageStatus,
  ]);

  const renderMessageStatus = useMemo(() => {
    if (isSentByCurrentUser) {
      if (message?.messageStatus === MessageStatus.Sent) {
        return (
          <Icon
            type="ionicons"
            name="checkmark"
            size={16}
            color="white"
            style={{ marginLeft: spacingPixel(5), opacity: 0.6 }}
          />
        );
      } else if (message?.messageStatus === MessageStatus.Delivered) {
        return (
          <Icon
            type="ionicons"
            name="checkmark-done"
            size={16}
            color="white"
            style={{ marginLeft: spacingPixel(5), opacity: 0.6 }}
          />
        );
      } else if (message?.messageStatus === MessageStatus.Seen) {
        return (
          <Icon
            type="ionicons"
            name="checkmark-done"
            size={16}
            color="lightblue"
            style={{ marginLeft: spacingPixel(5) }}
          />
        );
      }
    }
    return null;
  }, [isSentByCurrentUser, message?.messageStatus]);

  const renderMessageContent = useMemo(() => {
    if (message?.messageType === MessageType.Text) {
      return (
        <>
          {message?.repliedToMessage && (
            <ReplyMessageItem message={decryptedReplyMessage as string} />
          )}

          <ThemedText>{decryptedContent}</ThemedText>
          <View
            style={[
              styles.flex,
              styles.flexRow,
              styles.alignItemsCenter,
              styles.justifyContentEnd,
            ]}
          >
            <ThemedText
              style={
                isSentByCurrentUser
                  ? styles.messageDateSender
                  : styles.messageDateReceiver
              }
            >
              {dateFormatter(message?.createdAt!, "HH:mm")}
            </ThemedText>
            {renderMessageStatus}
          </View>
        </>
      );
    } else if (message?.messageType === MessageType.Audio) {
      return (
        <View>
          {message?.repliedToMessage && (
            <ReplyMessageItem message={decryptedReplyMessage as string} />
          )}

          <View style={[styles.flex, styles.flexRow]}>
            <TouchableOpacity
              onPress={() => {
                if (isPlaying) {
                  pause();
                } else {
                  loadAndPlay(decryptedContent as string);
                }
              }}
            >
              <Icon
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={30}
              />
            </TouchableOpacity>

            <AppImage
              source={Images.soundPreview}
              resizeMode="contain"
              width={100}
              height={30}
              style={isPlaying ? { opacity: 1 } : { opacity: 0.5 }}
            />
          </View>
          <View style={[styles.flex, styles.flexRow, styles.alignItemsCenter]}>
            <ThemedText
              style={
                isSentByCurrentUser
                  ? styles.messageDateSender
                  : styles.messageDateReceiver
              }
            >
              {dateFormatter(message?.createdAt!, "HH:mm")}
            </ThemedText>
            {renderMessageStatus}
          </View>
        </View>
      );
    } else if (message?.messageType === MessageType.Image) {
      return (
        <View style={styles.gap2}>
          {message?.repliedToMessage && (
            <ReplyMessageItem message={decryptedReplyMessage as string} />
          )}

          <AppImage
            source={{ uri: decryptedContent as string }}
            style={{
              width: spacingPixel(200),
              height: spacingPixel(200),
              borderRadius: spacingPixel(8),
            }}
            resizeMode="cover"
          />
          <View style={[styles.flex, styles.flexRow, styles.alignItemsCenter]}>
            <ThemedText
              style={
                isSentByCurrentUser
                  ? styles.messageDateSender
                  : styles.messageDateReceiver
              }
            >
              {dateFormatter(message?.createdAt!, "HH:mm")}
            </ThemedText>
            {renderMessageStatus}
          </View>
        </View>
      );
    } else if (message?.messageType === MessageType.Video) {
      return (
        <>
          {message?.repliedToMessage && (
            <ReplyMessageItem message={decryptedReplyMessage as string} />
          )}

          <VideoPreview source={decryptedContent as string} />

          <View style={[styles.flex, styles.flexRow, styles.alignItemsCenter]}>
            <ThemedText
              style={
                isSentByCurrentUser
                  ? styles.messageDateSender
                  : styles.messageDateReceiver
              }
            >
              {dateFormatter(message?.createdAt!, "HH:mm")}
            </ThemedText>
            {renderMessageStatus}
          </View>
        </>
      );
    }

    return null;
  }, [
    styles,
    message,
    decryptedContent,
    isSentByCurrentUser,
    styles.messageDateSender,
    styles.messageDateReceiver,
    isPlaying,
    pause,
    loadAndPlay,
  ]);

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
          {renderMessageContent}
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
      transform: [{ translateY: -REPLY_ICON_WIDTH / 2 }],
    },
  });
