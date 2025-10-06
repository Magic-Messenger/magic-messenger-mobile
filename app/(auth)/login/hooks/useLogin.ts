import { router } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";

import {
  useGetApiAccountGetProfile,
  usePostApiAccountLogin,
  usePostApiAccountUpdatePublicKey,
} from "@/api/endpoints/magicMessenger";
import { flexBox, spacing } from "@/constants";
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
  const { login, userName, isLogin, setProfile, setUsername } = useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();
  const { data: profileResponse, refetch } = useGetApiAccountGetProfile({
    query: { enabled: isLogin },
  });
  const { mutateAsync: updatePublicKeyApi } =
    usePostApiAccountUpdatePublicKey();

  const styles = useThemedStyles(createStyle);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: userName ?? (__DEV__ ? "omer-test-user" : undefined),
      password: __DEV__ ? "Omer123*+" : undefined,
    },
  });

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
      router.push("/home");
    }
  };

  const onChangeAccount = () => {
    setUsername(undefined);
    reset({ username: undefined, password: undefined });
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

  const handleProfileUpdate = async () => {
    if (profileResponse?.data) {
      setProfile(profileResponse?.data);

      const { success: updateSuccess } = await updatePublicKeyApi({
        data: {
          publicKey: userPublicKey(),
        },
      });
      if (!updateSuccess) {
        Alert.alert(t("login.publicKeyUpdateError"));
      }
    }
  };

  useEffect(() => {
    handleProfileUpdate();
  }, [profileResponse?.data]);

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
    handleChangeAccount,
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
