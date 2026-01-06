import { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { mediaDevices, MediaStream } from "react-native-webrtc";

export type PermissionType = "camera" | "microphone" | "both";

export type PermissionStatus = {
  camera: boolean;
  microphone: boolean;
};

export type UseMediaPermissionsReturn = {
  permissionStatus: PermissionStatus;
  permissionDenied: boolean;
  deniedPermissionType: PermissionType | null;
  checkAndRequestPermissions: (type: PermissionType) => Promise<boolean>;
  openSettings: () => Promise<void>;
  resetPermissionDenied: () => void;
};

export const useMediaPermissions = (): UseMediaPermissionsReturn => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
  });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deniedPermissionType, setDeniedPermissionType] =
    useState<PermissionType | null>(null);

  const checkSinglePermission = useCallback(
    async (type: "camera" | "microphone"): Promise<boolean> => {
      try {
        const constraints = {
          audio: type === "microphone",
          video: type === "camera",
        };

        const stream = (await mediaDevices.getUserMedia(
          constraints,
        )) as MediaStream;

        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const checkAndRequestPermissions = useCallback(
    async (type: PermissionType): Promise<boolean> => {
      try {
        // For "both", check each permission separately to identify which one is denied
        if (type === "both") {
          const [hasCameraPermission, hasMicrophonePermission] =
            await Promise.all([
              checkSinglePermission("camera"),
              checkSinglePermission("microphone"),
            ]);

          if (!hasCameraPermission && !hasMicrophonePermission) {
            setPermissionDenied(true);
            setDeniedPermissionType("both");
            setPermissionStatus({ camera: false, microphone: false });
            return false;
          }

          if (!hasCameraPermission) {
            setPermissionDenied(true);
            setDeniedPermissionType("camera");
            setPermissionStatus({ camera: false, microphone: true });
            return false;
          }

          if (!hasMicrophonePermission) {
            setPermissionDenied(true);
            setDeniedPermissionType("microphone");
            setPermissionStatus({ camera: true, microphone: false });
            return false;
          }

          // Both permissions granted
          setPermissionStatus({ camera: true, microphone: true });
          setPermissionDenied(false);
          setDeniedPermissionType(null);
          return true;
        }

        // For single permission check
        const hasPermission = await checkSinglePermission(type);

        if (!hasPermission) {
          setPermissionDenied(true);
          setDeniedPermissionType(type);
          setPermissionStatus((prev) => ({ ...prev, [type]: false }));
          return false;
        }

        setPermissionStatus((prev) => ({ ...prev, [type]: true }));
        setPermissionDenied(false);
        setDeniedPermissionType(null);
        return true;
      } catch (error) {
        console.log("Permission check error:", error);
        setPermissionDenied(true);
        setDeniedPermissionType(type);
        return false;
      }
    },
    [checkSinglePermission],
  );

  const openSettings = useCallback(async () => {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error("Failed to open settings:", error);
      Alert.alert(
        "Error",
        "Could not open settings. Please open settings manually.",
      );
    }
  }, []);

  const resetPermissionDenied = useCallback(() => {
    setPermissionDenied(false);
    setDeniedPermissionType(null);
  }, []);

  return {
    permissionStatus,
    permissionDenied,
    deniedPermissionType,
    checkAndRequestPermissions,
    openSettings,
    resetPermissionDenied,
  };
};
