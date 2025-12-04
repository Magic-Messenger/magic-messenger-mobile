import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TicketMessageDto } from "@/api/models";
import { GradientBackground, ThemedText } from "@/components";
import { Colors } from "@/constants/Colors";
import { ColorDto, useThemedStyles } from "@/theme";

import { dateFormatter } from "../../../utils/helper";
import { spacingPixel } from "../../../utils/pixelHelper";

export function TicketMessageItem(props: TicketMessageDto) {
  const styles = useThemedStyles(createStyle);

  const translateX = useSharedValue(0);

  const { isMyMessage, createdAt, content } = props;

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderMessageContent = useMemo(() => {
    return (
      <>
        <ThemedText>{content}</ThemedText>
        <ThemedText
          style={
            isMyMessage ? styles.messageDateSender : styles.messageDateReceiver
          }
        >
          {dateFormatter(createdAt!, "HH:mm")}
        </ThemedText>
      </>
    );
  }, [
    styles,
    content,
    isMyMessage,
    styles.messageDateSender,
    styles.messageDateReceiver,
  ]);

  return (
    <View style={styles.messageWrapper}>
      <Animated.View style={[animatedStyle]}>
        <GradientBackground
          colors={isMyMessage ? Colors.buttonPrimary : Colors.buttonSecondary}
          style={[
            isMyMessage ? styles.senderContainer : styles.receiverContainer,
          ]}
        >
          {renderMessageContent}
        </GradientBackground>
      </Animated.View>
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
  });
