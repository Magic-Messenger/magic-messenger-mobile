import { Colors, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ThemedText, ThemedTextProps } from "../../app/ThemedText";

interface Props {
  type?: "default" | "primary" | "secondary" | "danger";
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
  const styles = useThemedStyles(createStyle);
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
    } else if (type === "danger") {
      return Colors.buttonDanger;
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
        start={{ y: 0, x: 1 }}
        end={{ y: 1, x: 0 }}
        style={[
          styles.fullWidth,
          styles.fullHeight,
          styles.justifyContentCenter,
          styles.alignItemsCenter,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View
            style={
              leftIcon ? [styles.flexRow, styles.alignItemsCenter] : undefined
            }
          >
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <ThemedText {...textProps}>{label}</ThemedText>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    button: {
      width: "100%",
      maxHeight: heightPixel(45),
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
