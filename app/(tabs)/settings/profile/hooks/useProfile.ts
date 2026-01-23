import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import {
  useDeleteApiAccountDeleteProfile,
  useGetApiAccountGetProfile,
  usePostApiAccountChangeLanguage,
  usePostApiAccountUploadProfilePicture,
} from "@/api/endpoints/magicMessenger";
import { Colors, flexBox, spacing } from "@/constants";
import { usePicker } from "@/hooks";
import { useAppStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { changeLanguage, showToast, widthPixel } from "@/utils";

export const useProfile = () => {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const logout = useUserStore((state) => state.logout);
  const styles = useThemedStyles(createStyle);

  const { data, isLoading, refetch } = useGetApiAccountGetProfile();
  const { mutateAsync: deleteProfileRequest, isPending } =
    useDeleteApiAccountDeleteProfile();
  const { mutateAsync: changeLanguageRequest } =
    usePostApiAccountChangeLanguage();
  const { mutateAsync: uploadProfilePictureRequest, isPending: isUploading } =
    usePostApiAccountUploadProfilePicture();
  const { pickMedia, isProcessing } = usePicker();

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

  const handleChangeLanguage = async (value: string | number) => {
    changeLanguage(value as string);
    await changeLanguageRequest({ data: { language: value as string } });
  };

  const changePassword = () => {
    router.push("/(tabs)/settings/changePassword");
  };

  const uploadProfilePicture = async () => {
    try {
      const media = await pickMedia();
      if (!media || media.type !== "image") return;

      const { success } = await uploadProfilePictureRequest({
        data: {
          file: {
            uri: media.uri,
            name: `profile-${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any,
        },
      });

      if (success) {
        showToast({
          text1: t("profile.profilePictureUpdated"),
        });
        refetch();
      }
    } catch (error) {
      showToast({
        type: "error",
        text1: t("profile.profilePictureError"),
      });
    }
  };

  return {
    t,
    language,
    styles,
    data,
    isLoading,
    isPending,
    isUploading,
    isProcessing,
    userPassword,
    setUserPassword,
    deleteApprove,
    setDeleteApprove,
    deleteProfile,
    handleChangeLanguage,
    changePassword,
    uploadProfilePicture,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {
      ...spacing({
        pl: 20,
        pr: 20,
        gap: 15,
      }),
      flexDirection: "row",
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
