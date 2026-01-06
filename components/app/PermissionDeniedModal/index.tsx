import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

import { PermissionType } from "@/hooks/useMediaPermissions";

import { Button, Icon } from "../../ui";
import { ThemedText } from "../ThemedText";

type PermissionDeniedModalProps = {
  visible: boolean;
  permissionType: PermissionType | null;
  onOpenSettings: () => void;
  onClose: () => void;
};

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  visible,
  permissionType,
  onOpenSettings,
  onClose,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (permissionType) {
      case "camera":
        return "video-slash";
      case "microphone":
        return "microphone-slash";
      case "both":
      default:
        return "exclamation-triangle";
    }
  };

  const getTitle = () => {
    switch (permissionType) {
      case "camera":
        return t("permissions.cameraRequired");
      case "microphone":
        return t("permissions.microphoneRequired");
      case "both":
      default:
        return t("permissions.cameraAndMicrophoneRequired");
    }
  };

  const getMessage = () => {
    switch (permissionType) {
      case "camera":
        return t("permissions.cameraDescription");
      case "microphone":
        return t("permissions.microphoneDescription");
      case "both":
      default:
        return t("permissions.cameraAndMicrophoneDescription");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon
              name={getIcon()}
              type="fontawesome5"
              color="#FF3B30"
              size={48}
            />
          </View>

          {/* Title */}
          <ThemedText style={styles.title}>{getTitle()}</ThemedText>

          {/* Message */}
          <ThemedText style={styles.message}>{getMessage()}</ThemedText>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.closeButtonText}>
                {t("common.close")}
              </ThemedText>
            </TouchableOpacity>

            {/* Settings Button */}
            <Button
              style={[{ width: "50%" }]}
              label={t("permissions.openSettings")}
              type="primary"
              onPress={onOpenSettings}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsButton: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
  },
  settingsButtonText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
