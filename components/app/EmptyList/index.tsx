import { View, ViewStyle } from "react-native";

import { useThemedStyles } from "@/theme";

import { Icon, IconLibrary } from "../../ui";
import { ThemedText } from "../ThemedText";

interface Props {
  label: string;
  iconType?: IconLibrary;
  icon?: string;
  style?: ViewStyle;
}

export const EmptyList = ({
  label,
  icon,
  iconType = "feather",
  style,
}: Props) => {
  const styles = useThemedStyles();

  return (
    <View style={[styles.alignItemsCenter, styles.gap2, style]}>
      {icon && <Icon name={icon} type={iconType} />}
      <ThemedText type="default">{label ?? ""}</ThemedText>
    </View>
  );
};
