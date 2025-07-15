import { Colors, Fonts } from "@/constants";
import { StyleSheet, Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  weight?: "bold" | "semiBold" | "light" | "medium" | "regular";
};

export function ThemedText({
  style,
  type = "default",
  weight,
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
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
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
});
