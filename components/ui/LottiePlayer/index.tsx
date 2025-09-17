import LottieView from "lottie-react-native";
import { View } from "react-native";

import { useThemedStyles } from "@/theme";

type LottieProps = {
  source: any;
  loop?: boolean;
  autoPlay?: boolean;
  style?: object;
};

export function LottiePlayer({
  source,
  loop = true,
  autoPlay = true,
  ...props
}: LottieProps) {
  const styles = useThemedStyles();

  if (!source) return null;

  return (
    <View {...props}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={styles.flex}
      />
    </View>
  );
}
