import { usePostApiAccountLogin } from "@/api/endpoints/magicMessenger";
import {
  AppLayout,
  Button,
  Dropdown,
  Input,
  SectionHeader,
} from "@/components";
import { spacing } from "@/constants";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  language: number;
}

const LANGUAGE_OPTIONS = [
  { label: "Türkçe", value: 1 },
  { label: "English", value: 2 },
] as const;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formValues: RegisterFormData) => {
    try {
      console.log("Form değerleri: ", formValues);

      if (formValues.password !== formValues.confirmPassword) {
        console.error("Şifreler eşleşmiyor");
        return;
      }

      const loginResponse = await loginApi({
        data: {
          username: formValues?.username,
          password: formValues?.password,
        },
      });

      if (loginResponse.success) {
        console.log(loginResponse);
      }

      router.push("/(auth)/securityPhrases");
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
    }
  };

  return (
    <AppLayout
      container
      scrollable
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
      <View style={styles.mainContainer}>
        <SectionHeader
          title={t("register.title")}
          description={t("register.subtitle")}
        />

        <View style={styles.formContainer}>
          <Input
            control={control}
            name="username"
            label={t("userName")}
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

          <Input
            control={control}
            name="password"
            label={t("password")}
            secureTextEntry
            rules={{
              required: t("inputError.required", {
                field: t("password"),
              }),
              minLength: {
                value: 6,
                message: t("inputError.minLength", {
                  field: t("password"),
                  count: 6,
                }),
              },
            }}
            error={errors.password?.message}
          />

          <Input
            control={control}
            name="confirmPassword"
            label={t("confirmPassword")}
            secureTextEntry
            rules={{
              required: t("inputError.required", {
                field: t("password"),
              }),
              minLength: {
                value: 6,
                message: t("inputError.minLength", {
                  field: t("password"),
                  count: 6,
                }),
              },
            }}
            error={errors.confirmPassword?.message}
          />

          <Dropdown
            control={control}
            name="language"
            label={t("register.selectLanguage")}
            options={LANGUAGE_OPTIONS as never}
            rules={{
              required: t("inputError.required", {
                field: t("register.selectLanguage"),
              }),
            }}
            error={errors.language?.message}
          />
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    ...spacing({
      mt: 60,
    }),
  },
  formContainer: {
    ...spacing({
      gap: 16,
    }),
  },
});
