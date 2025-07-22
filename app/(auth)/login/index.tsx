import { usePostApiAccountLogin } from "@/api/endpoints/magicMessenger";
import {
  AppImage,
  AppLayout,
  Button,
  Input,
  SectionHeader,
  ThemedText,
} from "@/components";
import { commonStyle, Images, spacing } from "@/constants";
import { useUserStore } from "@/store";
import { heightPixel, widthPixel } from "@/utils";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

interface RegisterFormData {
  username: string;
  password: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, userName } = useUserStore();
  const { mutateAsync: loginApi } = usePostApiAccountLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (formValues: RegisterFormData) => {
    try {
      if (formValues) {
        const { success, data } = await loginApi({
          data: {
            username: formValues?.username,
            password: formValues?.password,
          },
        });
        console.log("data: ", data);

        if (success && data?.accessToken) {
          await login(
            data?.accessToken as string,
            data?.account?.username as string
          );
          router.push("/(tabs)/home");
        }
      }
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
      <View
        style={[styles.mainContainer, userName ? commonStyle.pt10 : undefined]}
      >
        {!userName && (
          <SectionHeader
            title={t("login.title")}
            description={t("register.subtitle")}
          />
        )}

        {userName && (
          <View style={[commonStyle.alignItemsCenter, commonStyle.mb5]}>
            <AppImage source={Images.logo} style={styles.logoImage} />
            <ThemedText weight="semiBold" style={commonStyle.pt2}>
              {t("login.userName", {
                userName,
              })}
            </ThemedText>
          </View>
        )}

        <View style={[styles.formContainer, commonStyle.fullWidth]}>
          {!userName && (
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
          )}

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
                value: 8,
                message: t("inputError.minLength", {
                  field: t("password"),
                  count: 8,
                }),
              },
            }}
            error={errors.password?.message}
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
  logoImage: {
    width: widthPixel(220),
    height: heightPixel(50),
  },
});
