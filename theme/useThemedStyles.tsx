import { Colors, commonStyle } from "@/constants";
import { useMemo } from "react";
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { useColor } from "./useColor";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export type ColorDto = typeof Colors;

export const useThemedStyles = <T extends NamedStyles<T>>(
  styleFunction?: (colors: ColorDto) => T
) => {
  const { colors, mode } = useColor();

  const styles = useMemo(() => {
    const customStyles = styleFunction ? styleFunction(colors) : ({} as T);
    return StyleSheet.create({ ...customStyles, ...commonStyle });
  }, [styleFunction, mode, commonStyle]);

  return styles;
};
