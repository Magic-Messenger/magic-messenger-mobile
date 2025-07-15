import { ThemedText, ThemedTextProps } from "@/components/ThemedText";
import { Colors, commonStyle, spacing } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface Props {
  type?: "default" | "primary" | "secondary";
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textProps?: ThemedTextProps;
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  type = "default",
  label = "",
  onPress = () => {},
  disabled,
  loading,
  leftIcon,
  rightIcon,
  textProps = {
    weight: "semiBold",
  },
  style,
  activeOpacity = 0.8,
}: Props) {
  const handlePress = (): void => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  function backgroundColor() {
    if (type === "default") {
      return Colors.buttonTransparent;
    } else if (type === "primary") {
      return Colors.buttonPrimary;
    } else if (type === "secondary") {
      return Colors.buttonSecondary;
    }
  }

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={handlePress}
      activeOpacity={activeOpacity}
      style={[styles.button, style]}
    >
      <LinearGradient
        colors={backgroundColor() as never}
        style={[
          commonStyle.fullWidth,
          commonStyle.fullHeight,
          commonStyle.justifyContentCenter,
          commonStyle.alignItemsCenter,
        ]}
      >
        {loading && <ActivityIndicator />}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <ThemedText {...textProps}>{label}</ThemedText>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 54,
    borderRadius: 9,
    overflow: "hidden",
  },
  leftIcon: {
    ...spacing({
      mr: 8,
    }),
  },
  rightIcon: {
    ...spacing({
      ml: 8,
    }),
  },
});
