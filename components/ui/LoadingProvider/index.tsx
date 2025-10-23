import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ColorDto, useThemedStyles } from "@/theme";

interface Props {
  loading: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const LoadingProvider = ({ loading, children, ...props }: Props) => {
  const styles = useThemedStyles(createStyle);

  return (
    <>
      {loading && (
        <View
          style={[
            styles.flex,
            styles.justifyContentCenter,
            styles.alignItemsCenter,
            styles.loadingContainer,
            props?.style || {},
          ]}
          {...props}
        >
          <ActivityIndicator />
        </View>
      )}

      {children}
    </>
  );
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    loadingContainer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: colors.secondaryBackgroundAlpha,
      opacity: 0.9,
      height: "100%",
      width: "100%",
    },
  });
