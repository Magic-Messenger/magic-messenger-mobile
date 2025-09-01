import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageProps,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { fontPixel, heightPixel, spacingPixel } from "@/utils";

interface AppImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  source: ImageProps["source"];
  style?: ViewStyle;
  fallbackSource?: ImageProps["source"];
  placeholder?: string;
  errorText?: string;
  onPress?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  showLoading?: boolean;
}

export const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  fallbackSource,
  placeholder = "Yükleniyor...",
  errorText = "Resim yüklenemedi",
  onPress,
  onLoad,
  onError,
  resizeMode = "cover",
  showLoading = true,
  ...props
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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
        <Image
          source={source}
          style={[styles.image, style]}
          onLoad={handleLoad}
          onError={handleError}
          resizeMode={resizeMode}
          {...props}
        />
        {loading && showLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.loadingText}>{placeholder}</Text>
          </View>
        )}
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
  image: ViewStyle;
  placeholder: ViewStyle;
  errorText: TextStyle;
  loadingOverlay: ViewStyle;
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: fontPixel(14),
    marginTop: spacingPixel(8),
  },
});
