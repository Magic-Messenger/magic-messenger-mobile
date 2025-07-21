import { AppLayout, Button, Dropdown, Input, ThemedText } from "@/components";
import { commonStyle, spacing } from "@/constants";
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
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
    }
  };

  return (
    <AppLayout container scrollable>
      <View style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.title}>
            {t("register.title")}
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            {t("register.subtitle")}
          </ThemedText>
        </View>

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

        <View style={styles.buttonContainer}>
          <Button
            type="primary"
            label={t("register.button", "Register")}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
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
  headerContainer: {
    ...spacing({}),
  },
  title: {
    ...spacing({
      mb: 8,
    }),
  },
  subtitle: {
    ...commonStyle.mb7,
    opacity: 0.8,
  },
  formContainer: {
    ...spacing({
      gap: 16,
    }),
  },
  buttonContainer: {
    ...spacing({
      mt: 32,
    }),
  },
});
