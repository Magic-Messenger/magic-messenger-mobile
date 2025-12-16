import React, { JSX, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageProps,
  ImageStyle,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, runOnJS } from "react-native-reanimated";

import { useImageViewer } from "@/providers";

import { heightPixel } from "../../../utils/pixelHelper";

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
  fallbackSource,
  errorText = "image_not_load",
  onPress,
  onLoad,
  onError,
  resizeMode = "cover",
  showLoading = true,
  showDetail = false,
  ...props
}) => {
  const { open } = useImageViewer();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const imageSource = error && fallbackSource ? fallbackSource : source;

  // Memoize image array to prevent unnecessary re-renders
  const images = useMemo(() => {
    const uri = (source as any)?.uri;
    return uri ? [{ uri }] : [];
  }, [(source as any)?.uri]);

  const handleOpen = useCallback(() => {
    if (!images.length) return;
    open(images, 0);
  }, [images, open]);

  const tapGesture = Gesture.Tap()
    .enabled(showDetail && !loading && !error)
    .onEnd(() => {
      runOnJS(handleOpen)();
    });

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

  const imageStyle = StyleSheet.flatten([styles.image, style]);

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
        <GestureDetector gesture={tapGesture}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={style}>
            <Image
              source={imageSource}
              style={imageStyle}
              onLoad={handleLoad}
              onError={handleError}
              resizeMode={resizeMode}
              {...props}
            />

            {loading && showLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="white" />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
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

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: heightPixel(200),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
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
});
