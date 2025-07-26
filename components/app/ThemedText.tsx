import { Colors, Fonts } from "@/constants";
import { fontPixel } from "@/utils";
import { StyleSheet, Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  weight?: "bold" | "semiBold" | "light" | "medium" | "regular";
  center?: boolean;
  size?: number;
  shrink?: boolean;
};

export function ThemedText({
  style,
  type = "default",
  weight,
  center,
  size,
  shrink,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: Colors.text },
        styles.medium,
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        weight ? styles?.[weight] : undefined,
        center ? styles.center : undefined,
        size ? { fontSize: fontPixel(size) } : undefined,
        shrink ? { flexShrink: 1 } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: fontPixel(15),
    fontFamily: Fonts.SFProRegular,
  },
  defaultSemiBold: {
    fontSize: fontPixel(16),
    lineHeight: fontPixel(24),
    fontWeight: "600",
  },
  title: {
    fontSize: fontPixel(22),
    fontWeight: "bold",
    lineHeight: fontPixel(32),
    fontFamily: Fonts.SFProBold,
  },
  subtitle: {
    fontFamily: Fonts.SFProSemiBold,
  },
  link: {
    fontSize: fontPixel(16),
    color: "#0a7ea4",
  },
  medium: {
    fontFamily: Fonts.SFProMedium,
  },
  bold: {
    fontFamily: Fonts.SFProBold,
  },
  semiBold: {
    fontFamily: Fonts.SFProSemiBold,
  },
  light: {
    fontFamily: Fonts.SFProLight,
  },
  regular: {
    fontFamily: Fonts.SFProRegular,
  },
  center: {
    textAlign: "center",
  },
});
