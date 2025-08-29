import {Input} from "@/components";
import {useTranslation} from "react-i18next";
import {PasswordInputType} from "@/components/app/PasswordInput/type";
import {useState} from "react";

export function PasswordInput(props: PasswordInputType) {
    const {t} = useTranslation();

    const {name = "password", label = "password", control, errors} = props;
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

    return (
        <Input
            control={control}
            name={name}
            label={t(label)}
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
            error={errors?.password?.message}
            rightIcon={{
                type: "feather",
                name: passwordVisible ? "eye" : "eye-off",
                onPress: () => setPasswordVisible(!passwordVisible),
            }}
        />
    )
}
