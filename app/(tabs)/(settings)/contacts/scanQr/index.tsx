import { AppLayout, Camera } from "@/components";
import { BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";

export default function ScanQr() {
  const barcodeScanned = async (barcode: BarcodeScanningResult) => {
    if (barcode?.data) {
      router.back();

      setTimeout(() => {
        router.setParams({ barcode: barcode?.data });
      }, 500);
    }
  };

  return (
    <AppLayout showBadge={false}>
      <Camera
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={barcodeScanned}
      />
    </AppLayout>
  );
}
