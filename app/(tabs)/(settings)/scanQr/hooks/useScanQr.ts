import { BarcodeScanningResult } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useQrStore } from "@/store";
import { useThemedStyles } from "@/theme";
import { heightPixel, widthPixel } from "@/utils";

export const useScanQr = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const { setQrCode } = useQrStore();
  const { goToPage } = useLocalSearchParams();

  const barcodeScanned = async (barcode: BarcodeScanningResult) => {
    if (barcode?.data) {
      setQrCode(barcode.data);
      if (goToPage === "contact.add") {
        router.replace("/(tabs)/(settings)/contacts/screens/add");
      } else {
        router.back();
      }
    }
  };

  return { t, styles, barcodeScanned };
};

const createStyle = () =>
  StyleSheet.create({
    cameraContainer: {
      flex: 1,
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
