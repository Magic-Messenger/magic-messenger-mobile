import React, { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
import { AppImage, Icon, ThemedText, VideoPreview } from "@/components";
import { Images } from "@/constants";
import { useAudioPlayer, useGroupChatHelper } from "@/hooks";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { dateFormatter, spacingPixel } from "@/utils";

import { ReplyMessageItem } from "../ReplyMessageItem";

interface MessageItemProps {
  identifier: string;
  message?: MessageDto;
  onReply?: (message: MessageDto) => void;
}

const SWIPE_THRESHOLD = 60;
const REPLY_ICON_WIDTH = 30;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
};

export function MessageGroupItem({
  identifier,
  message,
  onReply,
}: MessageItemProps) {
  const styles = useThemedStyles(createStyle);
  const magicHubClient = useSignalRStore((s) => s.magicHubClient);

  const { decryptedContent, isSentByCurrentUser, decryptedReplyMessage } =
    useGroupChatHelper(message as MessageDto);

  const { loadAndPlay, pause, isPlaying } = useAudioPlayer();

  const translateX = useSharedValue(0);

  // Mark message as seen
  useEffect(() => {
    if (
      magicHubClient &&
      !isSentByCurrentUser &&
      message?.messageStatus !== MessageStatus.Seen &&
      message?.messageId
    ) {
      magicHubClient.viewedMessage(identifier, message.messageId);
    }
  }, [
    identifier,
    isSentByCurrentUser,
    magicHubClient,
    message?.messageId,
    message?.messageStatus,
  ]);

  const triggerReply = useCallback(() => {
    if (message && onReply && decryptedContent) {
      onReply({
        ...message,
        content: decryptedContent as string,
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

  const renderMessageStatus = useMemo(() => {
    if (!isSentByCurrentUser) return null;

    const statusConfig = {
      [MessageStatus.Sent]: {
        name: "checkmark",
        color: "white",
        opacity: 0.6,
      },
      [MessageStatus.Delivered]: {
        name: "checkmark-done",
        color: "white",
        opacity: 0.6,
      },
      [MessageStatus.Seen]: {
        name: "checkmark-done",
        color: "lightblue",
        opacity: 1,
      },
    };

    const config = statusConfig[message?.messageStatus!];
    if (!config) return null;

    return (
      <Icon
        type="ionicons"
        name={config.name as any}
        size={16}
        color={config.color}
        style={{ marginLeft: spacingPixel(5), opacity: config.opacity }}
      />
    );
  }, [isSentByCurrentUser, message?.messageStatus]);

  const handleAudioToggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      loadAndPlay(decryptedContent as string);
    }
  }, [isPlaying, pause, loadAndPlay, decryptedContent]);

  const renderMessageFooter = useCallback(
    () => (
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
    ),
    [styles, isSentByCurrentUser, message?.createdAt, renderMessageStatus],
  );

  const renderNickname = useCallback(() => {
    if (isSentByCurrentUser || !message?.nickname) return null;

    return (
      <View>
        <ThemedText size={11} numberOfLines={1} weight="semiBold">
          {message.nickname}
        </ThemedText>
      </View>
    );
  }, [isSentByCurrentUser, message?.nickname]);

  const renderReplyMessage = useCallback(() => {
    if (!message?.repliedToMessage || !decryptedReplyMessage) return null;

    return <ReplyMessageItem message={decryptedReplyMessage as string} />;
  }, [message?.repliedToMessage, decryptedReplyMessage]);

  const renderTextMessage = useCallback(
    () => (
      <>
        {renderNickname()}
        {renderReplyMessage()}
        <ThemedText>{decryptedContent}</ThemedText>
        {renderMessageFooter()}
      </>
    ),
    [renderNickname, renderReplyMessage, decryptedContent, renderMessageFooter],
  );

  const renderAudioMessage = useCallback(
    () => (
      <View>
        {renderNickname()}
        {renderReplyMessage()}
        <View style={[styles.flex, styles.flexRow]}>
          <TouchableOpacity onPress={handleAudioToggle}>
            <Icon name={isPlaying ? "pause-circle" : "play-circle"} size={30} />
          </TouchableOpacity>

          <AppImage
            source={Images.soundPreview}
            resizeMode="contain"
            width={100}
            height={30}
            style={{ opacity: isPlaying ? 1 : 0.5 }}
          />
        </View>
        {renderMessageFooter()}
      </View>
    ),
    [
      renderNickname,
      renderReplyMessage,
      handleAudioToggle,
      isPlaying,
      renderMessageFooter,
      styles,
    ],
  );

  const renderImageMessage = useCallback(
    () => (
      <View style={styles.gap2}>
        {renderNickname()}
        {renderReplyMessage()}
        <AppImage
          source={{ uri: decryptedContent as string }}
          style={{
            width: spacingPixel(200),
            height: spacingPixel(200),
            borderRadius: spacingPixel(8),
          }}
          resizeMode="cover"
        />
        {renderMessageFooter()}
      </View>
    ),
    [
      renderNickname,
      renderReplyMessage,
      decryptedContent,
      renderMessageFooter,
      styles,
    ],
  );

  const renderVideoMessage = useCallback(
    () => (
      <>
        {renderNickname()}
        {renderReplyMessage()}
        <VideoPreview source={decryptedContent as string} />
        {renderMessageFooter()}
      </>
    ),
    [renderNickname, renderReplyMessage, decryptedContent, renderMessageFooter],
  );

  const renderMessageContent = useMemo(() => {
    if (!message || !decryptedContent) return null;

    switch (message.messageType) {
      case MessageType.Text:
        return renderTextMessage();
      case MessageType.Audio:
        return renderAudioMessage();
      case MessageType.Image:
        return renderImageMessage();
      case MessageType.Video:
        return renderVideoMessage();
      default:
        return null;
    }
  }, [
    message,
    decryptedContent,
    renderTextMessage,
    renderAudioMessage,
    renderImageMessage,
    renderVideoMessage,
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
