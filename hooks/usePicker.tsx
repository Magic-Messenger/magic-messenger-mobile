import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export function usePicker() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log(result);

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        return result.assets[0].uri;
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  return { pickImage, image };
}
