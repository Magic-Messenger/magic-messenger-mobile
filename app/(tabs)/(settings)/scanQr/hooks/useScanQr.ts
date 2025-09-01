import { BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export const useScanQr = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const barcodeScanned = async (barcode: BarcodeScanningResult) => {
    if (barcode?.data) {
      router.back();

      setTimeout(() => {
        router.push({
          pathname: "/(tabs)/(settings)/contacts/screens/add",
          params: { username: barcode?.data },
        });
      }, 250);
    }
  };

  return { t, styles, barcodeScanned };
};

const createStyle = () =>
  StyleSheet.create({
    cameraContainer: {
      flex: 1,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    cameraBackground: {
      height: heightPixel(300),
      width: widthPixel(300),
      position: "absolute",
    },
    camera: {
      flex: 1,
      aspectRatio: 1,
    },
  });
