import BottomSheet, {
  BottomSheetProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/app";
import { useColor, useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { Icon } from "../Icon";

interface BottomSheetComponentProps extends BottomSheetProps {
  title?: string;
  snapPoints?: string[];
  initialIndex?: number;
  closeButton?: boolean;
}

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
      expand: () => bottomSheetRef.current?.expand(),
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
