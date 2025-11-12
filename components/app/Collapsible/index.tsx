import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon, ThemedText } from "@/components";
import { Colors, Fonts, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";

import { fontPixel, spacingPixel } from "../../../utils/pixelHelper";

type CollapsibleProps = {
  question: string;
  answer: string;
  isActive?: boolean;
  onPress?: () => void;
};

export const Collapsible = ({
  question,
  answer,
  isActive,
  onPress,
}: CollapsibleProps) => {
  const styles = useThemedStyles(createStyle);

  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const handleOnPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress?.();
  }, [onPress]);

  useEffect(() => {
    if (measuredHeight > 0) {
      height.value = withTiming(isActive ? measuredHeight : 0, {
        duration: 300,
      });
      opacity.value = withTiming(isActive ? 1 : 0, { duration: 300 });
    }
    rotation.value = withTiming(isActive ? 180 : 0, { duration: 300 });
  }, [isActive, measuredHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: opacity.value,
      width: "100%",
      overflow: "hidden",
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={handleOnPress}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.question}>{question}</ThemedText>
        </View>
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Icon type="feather" name="chevron-down" />
        </Animated.View>
      </TouchableOpacity>

      <LinearGradient
        colors={Colors.buttonPrimary as never}
        start={{ y: 0, x: 1 }}
        end={{ y: 1, x: 0 }}
      >
        <Animated.View style={animatedStyle}>
          <ThemedText style={styles.answer}>{answer}</ThemedText>
        </Animated.View>

        {measuredHeight === 0 && (
          <View
            style={[styles.hiddenMeasure]}
            onLayout={(e) => {
              setMeasuredHeight(e.nativeEvent.layout.height);
              height.value = isActive ? e.nativeEvent.layout.height : 0;
              opacity.value = isActive ? 1 : 0;
            }}
          >
            <ThemedText style={styles.answer}>{answer}</ThemedText>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    card: {
      ...spacing({ mb: 8 }),
      borderRadius: spacingPixel(10),
      overflow: "hidden",
      backgroundColor: colors.secondaryBackground,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacingPixel(10),
      paddingHorizontal: spacingPixel(8),
      paddingVertical: spacingPixel(12),
      backgroundColor: colors.secondaryBackground,
    },
    textContainer: {
      flex: 9,
    },
    iconContainer: {
      flex: 1,
      alignItems: "flex-end",
    },
    question: {
      fontSize: fontPixel(14),
      fontFamily: Fonts.SFProSemiBold,
      color: colors.white,
    },
    answer: {
      fontSize: fontPixel(12),
      fontFamily: Fonts.SFProSemiBold,
      color: colors.white,
      flexShrink: 1,
      flexWrap: "wrap",
      width: "100%",
      wordWrap: "break-word",
      textOverflow: "ellipsis",
      paddingHorizontal: spacingPixel(12),
      paddingVertical: spacingPixel(8),
    },
    hiddenMeasure: {
      position: "absolute",
      opacity: 0,
      zIndex: -1,
      left: 0,
      right: 0,
      width: "100%",
    },
  });
