import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { Colors } from "@/constants";

type GradientBackgroundProps = {
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  children: ReactNode;
};

export const GradientBackground = ({
  style,
  colors,
  children,
}: GradientBackgroundProps) => (
  <LinearGradient
    colors={(colors ?? Colors.buttonPrimary) as never}
    start={{ y: 0, x: 1 }}
    end={{ y: 1, x: 0 }}
    style={style}
  >
    {children}
  </LinearGradient>
);
