import { commonStyle } from "@/constants";
import { View, ViewStyle } from "react-native";
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
  return (
    <View style={[commonStyle.alignItemsCenter, commonStyle.gap2, style]}>
      {icon && <Icon name={icon} type={iconType} />}
      <ThemedText type="default">{label ?? ""}</ThemedText>
    </View>
  );
};
