import React from "react";
import { ImageBackground, View } from "react-native";

import { AppLayout, Camera } from "@/components";
import { Images } from "@/constants";

import { useScanQr } from "../hooks";

export default function ScanQrScreen() {
  const { t, styles, barcodeScanned } = useScanQr();

  return (
    <AppLayout container safeAreaBottom={false} title={t("scanQr.title")}>
      <View style={styles.cameraContainer}>
        <Camera
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={styles.camera}
          onBarcodeScanned={barcodeScanned}
        />
        <ImageBackground
          source={Images.scanQrBgImage}
          style={styles.cameraBackground}
          resizeMode="contain"
        />
      </View>
    </AppLayout>
  );
}
