import BottomSheet, {
  BottomSheetProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ThemedText } from "@/components/app";
import { useColor, useThemedStyles } from "@/theme";

import { spacingPixel } from "../../../utils/pixelHelper";
import { Icon } from "../Icon";

interface BottomSheetComponentProps extends BottomSheetProps {
  title?: string;
  snapPoints?: string[];
  initialIndex?: number;
  closeButton?: boolean;
}

const CustomBackdrop = ({ animatedIndex, style }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        animatedIndex.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      pointerEvents={animatedIndex.value > 0 ? "auto" : "none"}
      style={[
        style,
        {
          backgroundColor: "rgba(0,0,0,0.6)",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        animatedStyle,
      ]}
    />
  );
};

export const BottomSheetComponent = forwardRef<any, BottomSheetComponentProps>(
  (
    {
      title = "",
      children,
      snapPoints = ["50%"],
      initialIndex = -1,
      closeButton = false,
      ...props
    },
    ref,
  ) => {
    const styles = useThemedStyles(createStyles);
    const colors = useColor();
    const bottomSheetRef = useRef<BottomSheet>(null);

    useImperativeHandle(ref, () => ({
      expand: () => {
        if (!bottomSheetRef.current) return;

        requestAnimationFrame(() => {
          bottomSheetRef.current?.expand();
        });
      },
      collapse: () => bottomSheetRef.current?.collapse(),
      close: () => bottomSheetRef.current?.close(),
      snapToIndex: (index: number) =>
        bottomSheetRef.current?.snapToIndex(index),
    }));

    const memoSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    return (
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={initialIndex}
          snapPoints={memoSnapPoints}
          backdropComponent={(props) => <CustomBackdrop {...props} />}
          backgroundStyle={{
            backgroundColor: colors.colors.secondaryBackground,
          }}
          handleIndicatorStyle={{
            backgroundColor: colors.colors.background,
          }}
          {...props}
        >
          <BottomSheetView style={styles.container}>
            {(title || closeButton) && (
              <View style={styles.header}>
                {title && (
                  <ThemedText size={17} weight="semiBold">
                    {title}
                  </ThemedText>
                )}
                {closeButton && (
                  <TouchableOpacity
                    onPress={() => bottomSheetRef.current?.close()}
                  >
                    <Icon name="close" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.flex}>{children}</View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    );
  },
);

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacingPixel(16),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacingPixel(12),
    },
  });
