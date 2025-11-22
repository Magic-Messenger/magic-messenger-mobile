import React, { JSX, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageProps,
  ImageStyle,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import ImageView from "react-native-image-viewing";

import {
  fontPixel,
  heightPixel,
  spacingPixel,
} from "../../../utils/pixelHelper";

interface AppImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  source: ImageProps["source"];
  style?: ImageStyle;
  fallbackSource?: ImageProps["source"];
  placeholder?: string;
  errorText?: string;
  onPress?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  showLoading?: boolean;
  showDetail?: boolean;
}

export const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  errorText = "image_not_load",
  onPress,
  onLoad,
  onError,
  resizeMode = "cover",
  showLoading = true,
  showDetail = false,
  ...props
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);

  const handleLoad = (): void => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = (): void => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const handlePress = (): void => {
    if (onPress && !loading && !error) {
      onPress();
    }
  };

  const renderContent = (): JSX.Element => {
    if (error) {
      return (
        <View style={[styles.placeholder, style]}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      );
    }

    return (
      <View style={style}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!showDetail || loading}
          onPress={() => setDetailsVisible(true)}
        >
          <Image
            source={source}
            style={[styles.image, style]}
            onLoad={handleLoad}
            onError={handleError}
            resizeMode={resizeMode}
            {...props}
          />
          {loading && showLoading && <ActivityIndicator size="small" />}
          {showDetail && !loading && !error && (
            <ImageView
              key={`image-view-${Math.random()}`}
              images={
                (source as any)?.uri
                  ? [{ uri: `${(source as any)?.uri}?v=${Math.random()}` }]
                  : []
              }
              imageIndex={0}
              visible={detailsVisible}
              onRequestClose={() => setDetailsVisible(false)}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

interface Styles {
  image: ImageStyle;
  placeholder: ViewStyle;
  errorText: TextStyle;
  loadingText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  image: {
    width: "100%",
    height: heightPixel(200),
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: heightPixel(200),
  },
  errorText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: fontPixel(14),
    marginTop: spacingPixel(8),
  },
});
