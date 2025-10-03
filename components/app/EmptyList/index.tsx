import { TextStyle, View, ViewStyle } from "react-native";

import { useThemedStyles } from "@/theme";

import { Icon, IconLibrary } from "../../ui";
import { ThemedText } from "../ThemedText";

interface Props {
  label: string;
  iconType?: IconLibrary;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const EmptyList = ({
  label,
  icon,
  iconType = "feather",
  style,
  textStyle,
}: Props) => {
  const styles = useThemedStyles();

  return (
    <View style={[styles.alignItemsCenter, styles.gap2, style]}>
      {icon && <Icon name={icon} type={iconType} />}
      <ThemedText type="default" style={textStyle ?? undefined}>
        {label ?? ""}
      </ThemedText>
    </View>
  );
};
