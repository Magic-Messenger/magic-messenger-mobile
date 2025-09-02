import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components";
import { PasswordInputType } from "@/components/app/PasswordInput/type";

export function PasswordInput(props: PasswordInputType) {
  const { t } = useTranslation();

  const {
    name = "password",
    placeholder,
    label = "password",
    control,
    errors,
    ...rest
  } = props;
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  return (
    <Input
      {...rest}
      control={control}
      name={name}
      label={t(label)}
      secureTextEntry={!passwordVisible}
      placeholder={placeholder ? t(placeholder) : undefined}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="off"
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
      error={errors?.password?.message}
      rightIcon={{
        type: "feather",
        name: passwordVisible ? "eye" : "eye-off",
        onPress: () => setPasswordVisible(!passwordVisible),
      }}
    />
  );
}
