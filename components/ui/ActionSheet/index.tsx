import BottomSheet from "@gorhom/bottom-sheet";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/app";
import { useThemedStyles } from "@/theme";
import { spacingPixel } from "@/utils";

import { BottomSheetComponent } from "../BottomSheet";

export interface ActionSheetRef {
  open: () => void;
  close: () => void;
}

export interface ActionSheetProps {
  options: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  }[];
  snapPoints?: string[];
}

export const ActionSheet = forwardRef<ActionSheetRef, ActionSheetProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { options = [], snapPoints } = props;

    const modalRef = useRef<BottomSheet | null>(null);

    useImperativeHandle(ref, () => ({
      open: () => modalRef.current?.expand(),
      close: () => modalRef.current?.close(),
    }));

    const actionItem = useMemo(() => {
      return ({ item }: { item: any }) => (
        <TouchableOpacity
          onPress={() => {
            modalRef?.current?.close();
            item?.onPress();
          }}
          style={[
            styles.flex,
            styles.gap3,
            styles.flexRow,
            styles.alignItemsCenter,
            styles.actionItem,
          ]}
        >
          {item?.icon ?? null}
          <ThemedText>{item?.label}</ThemedText>
        </TouchableOpacity>
      );
    }, [modalRef, styles]);

    const closeButton = useMemo(() => {
      return (
        <TouchableOpacity
          style={[styles.flex, styles.alignItemsCenter]}
          onPress={() => modalRef.current?.close()}
        >
          <ThemedText style={styles.closeButtonText}>
            {t("common.close")}
          </ThemedText>
        </TouchableOpacity>
      );
    }, [t, modalRef]);

    return (
      <BottomSheetComponent
        ref={modalRef}
        snapPoints={snapPoints ?? ["30%"]}
        enablePanDownToClose
      >
        <FlatList
          data={options}
          renderItem={actionItem}
          ListFooterComponent={closeButton}
        />
      </BottomSheetComponent>
    );
  }
);

const createStyles = () =>
  StyleSheet.create({
    actionItem: {
      padding: spacingPixel(10),
    },
    closeButtonText: {
      textDecorationLine: "underline",
      marginTop: spacingPixel(10),
    },
  });
