import { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePostApiAccountVerifyPassword } from "@/api/endpoints/magicMessenger";
import { useProtectRouteStore } from "@/store";
import { useThemedStyles } from "@/theme";

import { showToast } from "../../../utils/helper";
import { Button, Icon } from "../../ui";
import AppLayout from "../AppLayout";
import { PasswordInput } from "../PasswordInput";
import { ThemedText } from "../ThemedText";

interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonIcon?: ReactNode;
}

export function ProtectedRoute({ ...props }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  const { title, description, buttonText, buttonIcon } = props;
  const { setIsLoginProtected } = useProtectRouteStore();
  const { mutateAsync: passwordRequest, isPending } = usePostApiAccountVerifyPassword(); //prettier-ignore

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    const { success } = await passwordRequest({
      data: {
        password: data.password,
      },
    });
    if (success) {
      setIsLoginProtected(true);
      showToast({
        type: "success",
        text1: t("notes.noteUnlocked"),
      });
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
          label={t(buttonText ?? "login.button")}
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          disabled={isPending}
          leftIcon={buttonIcon ?? <Icon type="feather" name="log-in" />}
        />
      }
    >
      <View style={[styles.alignItemsCenter, styles.gap2]}>
        {title && (
          <ThemedText type="subtitle" size={18} center>
            {t(title)}
          </ThemedText>
        )}
        {description && (
          <ThemedText type="default" size={15} center>
            {t(description)}
          </ThemedText>
        )}
      </View>
      <View style={[styles.mt5]}>
        <PasswordInput
          control={control}
          errors={errors.password?.message}
          placeholder="login.password"
        />
      </View>
    </AppLayout>
  );
}
