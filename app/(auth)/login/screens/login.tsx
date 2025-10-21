import { router } from "expo-router";
import { View } from "react-native";

import {
  AppImage,
  AppLayout,
  Button,
  Icon,
  Input,
  PasswordInput,
  SectionHeader,
  ThemedText,
} from "@/components";
import { Images } from "@/constants";

import { useLogin } from "../hooks";

export default function LoginScreen() {
  const {
    t,
    control,
    errors,
    styles,
    isSubmitting,
    handleSubmit,
    onSubmit,
    userName,
    password,
    profile,
    isDeleteAccountLoading,
    handleChangeAccount,
    handleDeleteAccount,
  } = useLogin();

  return (
    <AppLayout
      container
      keyboardAvoiding
      showBadge={false}
      footer={
        <>
          <Button
            type="primary"
            label={t("login.button")}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<Icon type="feather" name="log-in" />}
          />

          <Button
            type="secondary"
            label={t("forgotAccount.title")}
            onPress={() => router.push("/(auth)/verifyPhrases")}
            style={styles.mt2}
            leftIcon={<Icon type="material" name="question-mark" />}
          />

          {userName && (
            <>
              <Button
                type="default"
                label={t("login.changeAccount")}
                onPress={handleChangeAccount}
                style={styles.mt2}
                leftIcon={<Icon type="feather" name="refresh-ccw" />}
              />

              {profile?.deleteButton && (
                <Button
                  type="danger"
                  label={t("login.deleteAccount")}
                  onPress={handleDeleteAccount}
                  style={styles.mt2}
                  loading={isDeleteAccountLoading}
                  disabled={isDeleteAccountLoading}
                  leftIcon={<Icon type="feather" name="trash" />}
                />
              )}
            </>
          )}
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
            <AppImage
              source={Images.logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
              autoFocus
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

          <PasswordInput
            control={control}
            errors={errors.password?.message}
            placeholder="login.password"
          />
        </View>
      </View>
    </AppLayout>
  );
}
