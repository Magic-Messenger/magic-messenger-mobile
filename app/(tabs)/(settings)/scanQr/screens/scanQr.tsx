import {AppLayout, Camera} from "@/components";
import {useScanQr} from "../hooks";
import {Images} from "@/constants";
import {ImageBackground, View} from "react-native";
import React from "react";

export default function ScanQrScreen() {
    const {t, styles, barcodeScanned} = useScanQr()

    return (
        <AppLayout container title={t("scanQr.title")}>
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
