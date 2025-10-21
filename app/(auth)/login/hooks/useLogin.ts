import { router } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";

import {
  useDeleteApiAccountDeleteProfile,
  useGetApiAccountGetProfile,
  usePostApiAccountLogin,
  usePostApiAccountRegisterDeviceToken,
  usePostApiAccountUpdatePublicKey,
} from "@/api/endpoints/magicMessenger";
import { flexBox, spacing } from "@/constants";
import { registerForPushNotificationsAsync } from "@/services";
import { useUserStore } from "@/store";
import { useThemedStyles } from "@/theme";
import {
  fontPixel,
  getInstallationId,
  heightPixel,
  userPublicKey,
  widthPixel,
} from "@/utils";

interface RegisterFormData {
  username: string;
  password: string;
}

export const useLogin = () => {
  const { t } = useTranslation();
  const { login, userName, isLogin, profile, setProfile, setUsername } =
    useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();
  const { data: profileResponse, refetch } = useGetApiAccountGetProfile({
    query: { enabled: isLogin },
  });
  const { mutateAsync: updatePublicKeyApi } =
    usePostApiAccountUpdatePublicKey();
  const { mutateAsync: registerDeviceToken } =
    usePostApiAccountRegisterDeviceToken();
  const { mutateAsync: deleteAccount, isPending: isDeleteAccountLoading } =
    useDeleteApiAccountDeleteProfile();

  const styles = useThemedStyles(createStyle);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: userName ?? (__DEV__ ? "omer-test-user" : undefined),
      password: __DEV__ ? "Omer123*+" : undefined,
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (__DEV__) {
      reset({
        username: userName ?? (__DEV__ ? "omer-test-user" : undefined),
        password: __DEV__ ? "Omer123*+" : undefined,
      });
    }
  }, [__DEV__]);

  const onSubmit = async (formValues: RegisterFormData) => {
    const { success, data } = await loginApi({
      data: {
        username: formValues?.username,
        password: formValues?.password,
        deviceId: await getInstallationId(),
      },
    });
    if (success && data?.accessToken) {
      login(
        data?.accessToken?.token as string,
        data?.account?.username as string,
      );

      router.canDismiss() && router.dismissAll();
      router.replace("/home");

      const token = await registerForPushNotificationsAsync();
      await registerDeviceToken({ data: { deviceToken: token } });
      await updatePublicKeyApi({
        data: {
          publicKey: userPublicKey(),
        },
      });
    }
  };

  const onChangeAccount = () => {
    setUsername(undefined);
    reset({ username: undefined, password: undefined });
  };

  const onDeleteAccount = async () => {
    if (!password) {
      Alert.alert(
        t("login.deleteAccountAlertTitle"),
        t("login.deleteAccountPasswordRequired"),
      );
      return;
    }

    const deleteAccountResponse = await deleteAccount({
      params: { username: userName as string, password },
    });
    if (deleteAccountResponse?.success) {
      setUsername(undefined);
      reset({ username: undefined, password: undefined });
      router.canDismiss() && router.dismissAll();
      router.replace("/accountDeleted/screens/accountDeleted");
    }
  };

  const handleChangeAccount = () => {
    Alert.alert(
      t("login.changeAccountAlertTitle"),
      t("login.changeAccountAlertMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("login.changeAccount"),
          style: "destructive",
          onPress: onChangeAccount,
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("login.deleteAccountAlertTitle"),
      t("login.deleteAccountAlertMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("login.deleteAccount"),
          style: "destructive",
          onPress: onDeleteAccount,
        },
      ],
    );
  };

  useEffect(() => {
    if (isLogin && profileResponse?.data) setProfile(profileResponse?.data);
  }, [isLogin, profileResponse?.data]);

  useEffect(() => {
    if (isLogin) refetch();
  }, [isLogin]);

  return {
    t,
    styles,
    control,
    errors,
    handleSubmit,
    onSubmit,
    isSubmitting,
    userName,
    password,
    profile,
    isDeleteAccountLoading,
    handleChangeAccount,
    handleDeleteAccount,
  };
};

const createStyle = () =>
  StyleSheet.create({
    formContainer: {
      ...spacing({
        gap: 16,
      }),
    },
    logoImage: {
      width: widthPixel(220),
      height: heightPixel(50),
    },
    forgotAccountContainer: {
      ...flexBox(1, "row", "flex-end"),
    },
    forgotAccountText: {
      fontSize: fontPixel(14),
    },
  });
