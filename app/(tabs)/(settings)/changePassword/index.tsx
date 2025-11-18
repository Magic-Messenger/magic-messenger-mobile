import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePostApiAccountChangePassword } from "@/api/endpoints/magicMessenger";
import { AppLayout, PasswordInput, ThemedText } from "@/components";
import { Button, Icon } from "@/components/ui";
import { useThemedStyles } from "@/theme";
import { showToast } from "@/utils";

export default function ChangePassword() {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  const { mutateAsync: changePasswordRequest, isPending } = usePostApiAccountChangePassword(); //prettier-ignore

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    const { success } = await changePasswordRequest({
      data: {
        currentPassword: data.password,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      },
    });
    if (success) {
      showToast({
        type: "success",
        text1: t("profile.passwordSuccessChanged"),
      });
      router.back();
      return;
    }
  };

  return (
    <AppLayout
      keyboardAvoiding
      container
      footer={
        <Button
          type="primary"
          label={t("profile.changePassword")}
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          disabled={isPending}
          leftIcon={<Icon type="feather" name="log-in" />}
        />
      }
    >
      <View style={[styles.alignItemsCenter, styles.gap2]}>
        <ThemedText type="subtitle" size={18} center>
          {t("profile.changePasswordTitle")}
        </ThemedText>
        <ThemedText type="default" size={15} center>
          {t("profile.changePasswordDescription")}
        </ThemedText>
      </View>
      <View style={[styles.mt5, styles.gap5]}>
        <PasswordInput
          name="password"
          control={control}
          errors={errors.password?.message}
          label="profile.enterOldPassword"
        />
        <PasswordInput
          name="newPassword"
          control={control}
          errors={errors.newPassword?.message}
          label="profile.enterNewPassword"
        />
        <PasswordInput
          name="confirmNewPassword"
          control={control}
          errors={errors.confirmNewPassword?.message}
          label="profile.confirmNewPassword"
        />
      </View>
    </AppLayout>
  );
}
