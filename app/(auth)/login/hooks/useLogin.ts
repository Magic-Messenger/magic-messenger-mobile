import LogRocket from "@logrocket/react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";

import {
  getApiAccountGetProfile,
  useDeleteApiAccountDeleteProfile,
  usePostApiAccountLogin,
  usePostApiAccountRegisterDeviceToken,
  usePostApiAccountRegisterFirebaseToken,
  usePostApiAccountUpdatePublicKey,
} from "@/api/endpoints/magicMessenger";
import { flexBox, spacing } from "@/constants";
import { registerForPushNotificationsAsync } from "@/services";
import {
  useCallingStore,
  useTorStore,
  useUserStore,
  useWebRTCStore,
} from "@/store";
import { useThemedStyles } from "@/theme";
import {
  fontPixel,
  getInstallationId,
  heightPixel,
  trackEvent,
  userPublicKey,
  widthPixel,
} from "@/utils";

interface RegisterFormData {
  username: string;
  password: string;
}

export const useLogin = () => {
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();

  const {
    login,
    userName,
    profile,
    setProfile,
    setUsername,
    showDeleteButton,
    setShowDeleteButton,
  } = useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();
  const { mutateAsync: updatePublicKeyApi } =
    usePostApiAccountUpdatePublicKey();
  const { mutateAsync: registerDeviceToken } =
    usePostApiAccountRegisterDeviceToken();
  const { mutateAsync: registerFirebaseToken } =
    usePostApiAccountRegisterFirebaseToken();
  const { mutateAsync: deleteAccount, isPending: isDeleteAccountLoading } =
    useDeleteApiAccountDeleteProfile();

  const startTor = useTorStore((state) => state.startTor);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: userName ?? (__DEV__ ? "omer-test" : undefined),
      password: __DEV__ ? "Omer123*+" : undefined,
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (__DEV__) {
      reset({
        username: userName ?? (__DEV__ ? "omer-test" : undefined),
        password: __DEV__ ? "Omer123*+" : undefined,
      });
    }
  }, [__DEV__]);

  const onSubmit = async (formValues: RegisterFormData) => {
    try {
      setIsLoading(true);

      const { success, data } = await loginApi({
        data: {
          username: formValues?.username?.trim(),
          password: formValues?.password?.trim(),
          deviceId: await getInstallationId(),
        },
      });

      if (!success) {
        setIsLoading(false);
        return;
      }
      trackEvent("login_success");
      login(
        data?.accessToken?.token as string,
        data?.account?.username as string,
      );
      getApiAccountGetProfile().then((profileResponse) => {
        if (profileResponse.success) {
          LogRocket.identify(formValues?.username?.trim());
          trackEvent("profile_fetched");

          setProfile(profileResponse.data!);
          setShowDeleteButton(profileResponse.data?.deleteButton ?? false);

          if (profileResponse.data?.enableTor) startTor();
        }
      });

      registerForPushNotificationsAsync().then(
        async (pushNotificationTokens) => {
          if (pushNotificationTokens) {
            registerDeviceToken({
              data: { deviceToken: pushNotificationTokens.token },
            })
              .then()
              .catch();

            registerFirebaseToken({
              data: { firebaseToken: pushNotificationTokens.firebaseToken },
            })
              .then()
              .catch();
          }
        },
      );

      updatePublicKeyApi({
        data: {
          publicKey: userPublicKey(),
        },
      })
        .then()
        .catch();

      setIsLoading(false);

      // Pending call kontrolü - persist edilen callingStore'dan oku
      const pendingCall = useCallingStore.getState().pendingCall;
      trackEvent("Checking pending call from store", { pendingCall });

      if (pendingCall) {
        trackEvent(
          "Found pending call, showing incoming call modal",
          pendingCall,
        );

        // Store'dan sil (artık işlendi)
        useCallingStore.getState().clearPendingCall();

        // incomingCallData olarak set et - IncomingCallModal otomatik açılacak
        useWebRTCStore.getState().setIncomingCallData(pendingCall);
        useWebRTCStore.getState().setIsIncoming(true);
      }

      // Her durumda ana sayfaya git
      router.replace("/chat/home");
    } catch {
      setIsLoading(false);
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

  return {
    t,
    styles,
    control,
    errors,
    handleSubmit,
    onSubmit,
    isLoading,
    userName,
    password,
    profile,
    isDeleteAccountLoading,
    showDeleteButton,
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
