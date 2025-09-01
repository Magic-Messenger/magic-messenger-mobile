import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { flexBox, spacing } from "@/constants";

import { ThemedText } from "../ThemedText";

interface Props {
  title: string;
  description: string;
  style?: {
    mainContainer: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
  };
}

export const SectionHeader = ({ title, description, style }: Props) => {
  return (
    <View style={[styles.main, style?.mainContainer ?? {}]}>
      <ThemedText type="title" style={style?.title ?? {}}>
        {title ?? ""}
      </ThemedText>
      <ThemedText type="subtitle" style={style?.description ?? {}}>
        {description ?? ""}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    ...flexBox(1, "column"),
    ...spacing({
      gap: 5,
      mb: 40,
    }),
  },
});
