import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import {
  useDeleteApiAccountDeleteProfile,
  useGetApiAccountGetProfile,
} from "@/api/endpoints/magicMessenger";
import { Colors, flexBox, spacing } from "@/constants";
import { useAppStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { showToast, widthPixel } from "@/utils";

export const useProfile = () => {
  const { t } = useTranslation();
  const { settings } = useAppStore();
  const { logout } = useUserStore();
  const styles = useThemedStyles(createStyle);

  const { data, isLoading } = useGetApiAccountGetProfile();
  const { mutateAsync: deleteProfileRequest, isPending } =
    useDeleteApiAccountDeleteProfile();

  const [userPassword, setUserPassword] = useState<string | null>(null);
  const [deleteApprove, setDeleteApprove] = useState<boolean>(false);

  const deleteProfile = async () => {
    if (deleteApprove) {
      if (userPassword && userPassword?.length >= 8) {
        const { success } = await deleteProfileRequest({
          params: {
            password: userPassword,
          },
        });
        if (success) logout();
      } else {
        showToast({
          type: "error",
          text1: t("profile.passwordError"),
        });
      }
    } else {
      setDeleteApprove(true);
    }
  };

  return {
    t,
    settings,
    styles,
    data,
    isLoading,
    isPending,
    userPassword,
    setUserPassword,
    deleteApprove,
    setDeleteApprove,
    deleteProfile,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {
      ...spacing({
        pl: 20,
        pr: 20,
      }),
    },
    userIDInfo: {
      ...spacing({
        gap: 10,
      }),
    },
    qrSection: {
      ...spacing({ p: 20, pt: 30, mt: 25 }),
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: Colors.mainAccent,
    },
    qrContainer: {
      ...flexBox(1, "row", "center", "center"),
      ...spacing({ gap: 15 }),
    },
    qrCodeImage: {
      ...spacing({ p: 8 }),
      borderRadius: widthPixel(8),
      backgroundColor: Colors.white,
    },
  });
