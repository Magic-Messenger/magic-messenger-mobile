import {useTranslation} from "react-i18next";
import {router, useLocalSearchParams} from "expo-router";
import {useThemedStyles} from "@/theme";
import {useForm} from "react-hook-form";
import {CreateContactCommandRequest} from "@/api/models";
import {usePostApiContactsCreate} from "@/api/endpoints/magicMessenger";
import {showToast} from "@/utils";
import {useEffect} from "react";


export const useAddContact = () => {

    const { t } = useTranslation();
    const { username } = useLocalSearchParams();
    const styles = useThemedStyles();

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting, isLoading },
    } = useForm<CreateContactCommandRequest>();

    const { mutateAsync: addContact, isPending } = usePostApiContactsCreate();

    const onSubmit = async (formValues: CreateContactCommandRequest) => {
        const { success } = await addContact({
            data: {
                ...formValues,
            },
        });
        if (success) {
            showToast({
                text1: t("contacts.successAddedContact"),
            });
            router.back();
        }
    };

    const nickNameField = watch()?.nickname;
    useEffect(() => {
        if (username) {
            reset({ username: username as string, nickname: nickNameField });
        }
    }, [username, nickNameField, reset]);

    return {
        t,
        styles,
        control,
        handleSubmit,
        errors,
        isSubmitting,
        isLoading,
        onSubmit,
        isPending,
    }

}
