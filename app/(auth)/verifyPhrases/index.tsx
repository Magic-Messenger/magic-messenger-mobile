import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { usePostApiAccountVerifyPhrases } from "@/api/endpoints/magicMessenger";
import { AppImage, AppLayout, Button, Input, ThemedText } from "@/components";
import { Images, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { fontPixel, heightPixel, spacingPixel, widthPixel } from "@/utils";

interface RegisterFormData {
  username: string;
  phrases: string;
}

export default function VerifyPhrasesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const { mutateAsync: verifyPhrases } = usePostApiAccountVerifyPhrases();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      phrases: "",
    },
  });

  const onSubmit = async (formValues: RegisterFormData) => {
    if (formValues) {
      const { success } = await verifyPhrases({
        data: {
          username: formValues?.username,
          phrases: formValues?.phrases?.match(/.{1,4}/g),
        },
      });

      if (success) {
        router.push({
          pathname: "/(auth)/resetPassword",
          params: {
            username: formValues?.username,
            phrases: formValues?.phrases?.match(/.{1,4}/g),
          },
        });
      }
    }
  };

  return (
    <AppLayout
      container
      scrollable
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
      <View style={[styles.mainContainer, styles.pt10]}>
        <View style={[styles.alignItemsCenter, styles.mb5]}>
          <AppImage source={Images.logo} style={styles.logoImage} />
          <ThemedText weight="semiBold" style={styles.pt2}>
            {t("forgotAccount.userResetPassword")}
          </ThemedText>
        </View>

        <View style={[styles.formContainer, styles.fullWidth, styles.mt7]}>
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
            name="phrases"
            label={t("forgotAccount.inputPhrases")}
            inputStyle={styles.phrasesInput}
            multiline
            rules={{
              required: t("inputError.required", {
                field: t("forgotAccount.inputPhrases"),
              }),
            }}
            error={errors.phrases?.message}
          />
        </View>
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {},
    formContainer: {
      ...spacing({
        gap: 16,
      }),
    },
    logoImage: {
      width: widthPixel(220),
      height: heightPixel(50),
    },
    phrasesInput: {
      padding: spacingPixel(15),
      height: heightPixel(200),
      fontSize: fontPixel(15),
    },
  });
