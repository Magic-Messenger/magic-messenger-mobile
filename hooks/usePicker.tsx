import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useState } from "react";
import { Video } from "react-native-compressor";

import { trackEvent } from "@/utils";

const IMAGE_COMPRESSION_QUALITY = 0.6;
const MAX_VIDEO_DURATION = 300; // 5 dakika (saniye cinsinden)

export interface PickedMedia {
  uri: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export function usePicker() {
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        compress: IMAGE_COMPRESSION_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return result.uri;
    } catch (error) {
      trackEvent("image_compression_error", { error });
      return uri;
    }
  };

  const compressVideo = async (uri: string): Promise<string> => {
    try {
      const compressedUri = await Video.compress(
        uri,
        {
          compressionMethod: "auto",
          maxSize: 1280,
          minimumFileSizeForCompress: 0,
        },
        (currentProgress) => {
          setProgress(Math.round(currentProgress * 100));
        },
      );

      return compressedUri;
    } catch (error) {
      trackEvent("video_compression_error", { error });
      return uri;
    }
  };

  const generateVideoThumbnail = async (
    uri: string,
  ): Promise<string | undefined> => {
    try {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri,
        { time: 1000 },
      );
      return thumbnailUri;
    } catch (error) {
      trackEvent("video_thumbnail_error", { error });
      return undefined;
    }
  };

  const pickMedia = async (): Promise<PickedMedia | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: MAX_VIDEO_DURATION,
      });

      if (result.canceled) {
        return null;
      }

      setIsProcessing(true);
      setProgress(0);

      const asset = result.assets[0];
      const isVideo = asset.type === "video";
      let processedUri = asset.uri;
      let thumbnail: string | undefined;
      let duration: number | undefined;

      if (isVideo) {
        duration = asset.duration ? asset.duration / 1000 : 0;

        if (duration > MAX_VIDEO_DURATION) {
          trackEvent("video_too_long", { duration });
          setIsProcessing(false);
          return null;
        }

        thumbnail = await generateVideoThumbnail(asset.uri);
        processedUri = await compressVideo(asset.uri);
      } else {
        processedUri = await compressImage(asset.uri);
      }

      const pickedMedia: PickedMedia = {
        uri: processedUri,
        type: isVideo ? "video" : "image",
        thumbnail,
        duration,
        width: asset.width,
        height: asset.height,
      };

      setMedia(pickedMedia);
      setIsProcessing(false);
      setProgress(0);
      return pickedMedia;
    } catch (error) {
      trackEvent("media_picker_error", { error });
      setIsProcessing(false);
      setProgress(0);
      return null;
    }
  };

  const pickImage = async (): Promise<string | null> => {
    const result = await pickMedia();
    return result?.uri ?? null;
  };

  return {
    pickMedia,
    pickImage,
    media,
    isProcessing,
    progress,
  };
}
