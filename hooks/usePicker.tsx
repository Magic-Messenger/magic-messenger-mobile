import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { trackEvent } from "@/utils";

const COMPRESSION_QUALITY = 0.5;

export function usePicker() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: COMPRESSION_QUALITY,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        return uri;
      }
    } catch (error) {
      trackEvent("image_picker_error", { error });
    }
  };

  return { pickImage, image };
}
