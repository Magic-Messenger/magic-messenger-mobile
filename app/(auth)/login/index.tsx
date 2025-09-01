import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { usePostApiAccountLogin } from "@/api/endpoints/magicMessenger";
import {
  AppImage,
  AppLayout,
  Button,
  Input,
  PasswordInput,
  SectionHeader,
  ThemedText,
} from "@/components";
import { flexBox, Images, spacing } from "@/constants";
import { useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import { fontPixel, getInstallationId, heightPixel, widthPixel } from "@/utils";

interface RegisterFormData {
  username: string;
  password: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, userName } = useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();
  const styles = useThemedStyles(createStyle);

  const [passwordVisible, setPasswordVisible] = useState(false);

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

  return (
    <AppLayout
      container
      scrollable
      showBadge={false}
      footer={
        <>
          <Button
            type="primary"
            label={t("login.button")}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <Button
            type="secondary"
            label={t("forgotAccount.title")}
            onPress={() => router.push("/(auth)/verifyPhrases")}
            style={styles.mt2}
          />
        </>
      }
    >
      <View style={[userName ? styles.pt10 : undefined]}>
        {!userName && (
          <SectionHeader
            title={t("login.title")}
            description={t("register.subtitle")}
          />
        )}

        {userName && (
          <View style={[styles.alignItemsCenter, styles.mb5]}>
            <AppImage source={Images.logo} style={styles.logoImage} />
            <ThemedText weight="semiBold" style={styles.pt2}>
              {t("login.userName", {
                userName,
              })}
            </ThemedText>
          </View>
        )}

        <View style={[styles.formContainer, styles.fullWidth]}>
          {!userName && (
            <Input
              control={control}
              name="username"
              label={t("userName")}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              rules={{
                required: t("inputError.required", {
                  field: t("userName"),
                }),
                minLength: {
                  value: 3,
                  message: t("inputError.minLength", {
                    field: t("userName"),
                    count: 3,
                  }),
                },
              }}
              error={errors.username?.message}
            />
          )}

          <PasswordInput control={control} error={errors.password?.message} />
        </View>
      </View>
    </AppLayout>
  );
}

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
