import { CameraView, CameraViewProps, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { spacing } from "../../../constants";
import { ThemedText } from "../../app";
import { Button } from "../Button";

export function Camera({ ...props }: CameraViewProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ThemedText type="subtitle">{t("barcode.permissionTitle")}</ThemedText>

        <Button
          type="primary"
          label={t("barcode.grantPermission")}
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView style={styles.camera} facing="back" {...props}>
        {props?.children}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    ...spacing({ gap: 20, pl: 15, pr: 15 }),
  },
  camera: {
    flex: 1,
  },
});
