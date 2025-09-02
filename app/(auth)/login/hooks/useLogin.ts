import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { usePostApiAccountLogin } from "@/api/endpoints/magicMessenger";
import { flexBox, spacing } from "@/constants";
import { useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { fontPixel, getInstallationId, heightPixel, widthPixel } from "@/utils";

interface RegisterFormData {
  username: string;
  password: string;
}

export const useLogin = () => {
  const { t } = useTranslation();
  const { login, userName } = useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();
  const styles = useThemedStyles(createStyle);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: userName ?? undefined,
      password: undefined,
    },
  });

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

  return {
    t,
    styles,
    control,
    errors,
    handleSubmit,
    onSubmit,
    isSubmitting,
    userName,
  };
};

const createStyle = (colors: ColorDto) =>
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
