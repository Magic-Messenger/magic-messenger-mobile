import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { LottiePlayer } from "@/components";
import { Lottie } from "@/constants";
import { useSignalRStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel, trackEvent, widthPixel } from "@/utils";

interface Props {
  chatId: string;
  userName?: string;
}

export function ChatTyping({ chatId, userName }: Props) {
  const styles = useThemedStyles(createStyle);

  const typingUsers = useSignalRStore((s) => s.typingUsers);

  const isTyping = useMemo(() => {
    if (!userName || !typingUsers) return false;
    return typingUsers.some((x) => x.chatId === chatId && userName);
  }, [typingUsers, userName]);

  trackEvent("isTyping: ", { isTyping });

  if (!isTyping) return null;
  return (
    <View style={styles.container}>
      <LottiePlayer source={Lottie.typingIndicator} style={styles.lottie} />
    </View>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      width: widthPixel(55),
      height: widthPixel(50),
      borderRadius: spacingPixel(8),
      borderBottomLeftRadius: 0,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    lottie: {
      width: widthPixel(50),
      height: widthPixel(50),
    },
    typingSender: {
      alignSelf: "flex-start",
    },
    typingReceiver: {
      alignSelf: "flex-end",
    },
  });
