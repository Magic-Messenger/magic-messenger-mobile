import { StyleSheet, View } from "react-native";

import { LottiePlayer } from "@/components";
import { Lottie } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel, widthPixel } from "@/utils";

interface Props {
  typingUsername?: string | null;
}

export function ChatTyping({ typingUsername }: Props) {
  const styles = useThemedStyles(createStyle);

  if (!typingUsername) return null;
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
