import { usePostApiAccountRecoverPassword } from "@/api/endpoints/magicMessenger";
import { AppImage, AppLayout, Button, Input, ThemedText } from "@/components";
import { commonStyle, Images, spacing } from "@/constants";
import { heightPixel, widthPixel } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
interface FormData {
  password: string;
  confirmPassword: string;
}

type RouteParams = {
  username: string;
  phrases: string;
};

export default function ResetPasswordScreen() {
  const { t } = useTranslation();

  const params = useLocalSearchParams<RouteParams>();
  const { mutateAsync: recoverPassword } = usePostApiAccountRecoverPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formValues: FormData) => {
    try {
      if (formValues) {
        const { success } = await recoverPassword({
          data: {
            ...params,
            phrases: params?.phrases?.split(","),
            ...formValues,
          },
        });

        if (success) {
          router.dismissTo("/(auth)/login");
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
      <View style={[styles.mainContainer, commonStyle.pt10]}>
        <View style={[commonStyle.alignItemsCenter, commonStyle.mb5]}>
          <AppImage source={Images.logo} style={styles.logoImage} />
          <ThemedText weight="semiBold" style={commonStyle.pt2}>
            {t("forgotAccount.userResetPassword")}
          </ThemedText>
        </View>

        <View
          style={[styles.formContainer, commonStyle.fullWidth, commonStyle.mt7]}
        >
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

          <Input
            control={control}
            name="confirmPassword"
            label={t("confirmPassword")}
            secureTextEntry
            rules={{
              required: t("inputError.required", {
                field: t("confirmPassword"),
              }),
              minLength: {
                value: 8,
                message: t("inputError.minLength", {
                  field: t("confirmPassword"),
                  count: 8,
                }),
              },
            }}
            error={errors.confirmPassword?.message}
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
