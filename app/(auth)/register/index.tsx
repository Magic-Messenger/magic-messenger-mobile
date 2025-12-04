import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { usePostApiAccountRegister } from "@/api/endpoints/magicMessenger";
import {
  AppLayout,
  Button,
  Dropdown,
  Input,
  PasswordChecklist,
  PasswordInput,
  SectionHeader,
} from "@/components";
import { DEFAULT_LANGUAGE, spacing } from "@/constants";
import {
  appSupportLanguages,
  getInstallationId,
  showToast,
  userPublicKey,
} from "@/utils";

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  language: number | string;
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { mutateAsync: registerApi } = usePostApiAccountRegister();

  const supportLanguages = useMemo(() => {
    return appSupportLanguages();
  }, [appSupportLanguages]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: undefined,
      password: undefined,
      confirmPassword: undefined,
      language: DEFAULT_LANGUAGE,
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const language = watch("language");

  const onSubmit = async (formValues: RegisterFormData) => {
    if (formValues.password !== formValues.confirmPassword) {
      showToast({
        type: "error",
        text1: t("register.passwordNotMatch"),
      });
      return;
    }

    const { success, data } = await registerApi({
      data: {
        username: formValues?.username,
        password: formValues?.password,
        confirmPassword: formValues?.confirmPassword,
        deviceId: await getInstallationId(),
        publicKey: userPublicKey(),
      },
    });

    if (success) {
      router.push({
        pathname: "/(auth)/securityPhrases",
        params: {
          accessToken: data?.accessToken?.token,
          securityPhrases: data?.securityPhrases,
          userName: data?.account?.username,
        },
      });
    }
  };

  return (
    <AppLayout
      container
      scrollable
      keyboardAvoiding
      showBadge={false}
      footer={
        <Button
          type="primary"
          label={t("register.button")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      }
    >
      <View>
        <SectionHeader
          title={t("register.title")}
          description={t("register.subtitle")}
        />

        <View style={styles.formContainer}>
          <Dropdown
            control={control}
            name="language"
            label={t("register.selectLanguage")}
            options={supportLanguages}
            rules={{
              required: t("inputError.required", {
                field: t("register.selectLanguage"),
              }),
            }}
            error={errors.language?.message}
            style={styles.dropDown}
          />

          <Input
            control={control}
            name="username"
            label={t("userName")}
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
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
              pattern: {
                value: /^[A-Za-z0-9_-]+$/,
                message: t("inputError.invalidUsername"),
              },
            }}
            error={errors.username?.message}
          />

          <PasswordInput
            control={control}
            name="password"
            label={t("password")}
            rules={{
              required: t("inputError.required", {
                field: t("password"),
              }),
              minLength: {
                value: 8,
                message: t("inputError.minLength", {
                  field: t("password"),
                  count: 8,
                }),
              },
            }}
            errors={errors.password?.message}
          />

          <PasswordInput
            control={control}
            name="confirmPassword"
            label={t("confirmPassword")}
            rules={{
              required: t("inputError.required", {
                field: t("password"),
              }),
              minLength: {
                value: 8,
                message: t("inputError.minLength", {
                  field: t("password"),
                  count: 8,
                }),
              },
            }}
            errors={errors.confirmPassword?.message}
          />

          <PasswordChecklist
            rules={[
              "minLength",
              "capital",
              "lowercase",
              "number",
              "specialChar",
              "match",
            ]}
            language={(language as string) ?? "en"}
            minLength={8}
            value={password}
            valueAgain={confirmPassword}
          />
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    ...spacing({
      gap: 16,
      pb: 120,
    }),
  },
  dropDown: {
    ...spacing({
      mb: 0,
    }),
  },
});
