import {useEffect} from "react";
import {Alert} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {showToast} from "@/utils";
import {UpdateContactCommandRequest} from "@/api/models";
import {
    useDeleteApiContactsDelete,
    usePostApiAccountBlockAccount,
    usePostApiAccountUnblockAccount,
    usePostApiContactsUpdate
} from "@/api/endpoints/magicMessenger";
import {useTranslation} from "react-i18next";
import {useThemedStyles} from "@/theme";
import {useForm} from "react-hook-form";

export const useEditContact = () => {

    const {t} = useTranslation();
    const {contactUsername, nickname, barcode, isBlocked} = useLocalSearchParams();
    const styles = useThemedStyles();

    const isContactBlocked = isBlocked === 'true';

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: {errors, isSubmitting, isLoading},
    } = useForm<UpdateContactCommandRequest>();

    const {mutateAsync: updateContact, isPending} = usePostApiContactsUpdate();
    const {mutateAsync: blockAccount, isPending: isBlockPending} = usePostApiAccountBlockAccount();
    const {mutateAsync: unblockAccount, isPending: isUnblockPending} = usePostApiAccountUnblockAccount();
    const {mutateAsync: deleteContact} = useDeleteApiContactsDelete();

    const onSubmit = async (formValues: UpdateContactCommandRequest) => {
        const {success} = await updateContact({
            data: {
                ...formValues,
            },
        });
        if (success) {
            showToast({
                text1: t("contacts.shotToast"),
            });
            router.back();
        }
    };

    const onBlockAccount = async () => {
        const {success} = await blockAccount({
            data: {
                blockedUsername: contactUsername as never,
            },
        });
        if (success) {
            showToast({text1: t("contacts.successBlockContact")});
            router.back();
        }
    };
    const handleBlockAccount = () => {
        Alert.alert(
            t("contacts.blockContactAlertTitle"),
            t("contacts.blockContactAlertMessage"),
            [
                {
                    text: t("common.cancel"),
                    style: "cancel",
                },
                {
                    text: t("common.block"),
                    style: "destructive",
                    onPress: onBlockAccount,
                },
            ]
        );
    };

    const onUnblockAccount = async () => {
        const {success} = await unblockAccount({
            data: {
                unblockUsername: contactUsername as never,
            },
        });
        if (success) {
            showToast({text1: t("contacts.successUnblockContact")});
            router.back();
        }
    };
    const handleUnblockAccount = () => {
        Alert.alert(
            t("contacts.unblockContactAlertTitle"),
            t("contacts.unblockContactAlertMessage"),
            [
                {
                    text: t("common.cancel"),
                    style: "cancel",
                },
                {
                    text: t("common.unblock"),
                    onPress: onUnblockAccount,
                },
            ]
        );
    };

    const onDeleteContact = async () => {
        const {success} = await deleteContact({
            params: {
                username: contactUsername as never,
            },
        });
        if (success) {
            showToast({text1: t("contacts.successDeleteContact")});
            router.back();
        }
    };
    const handleDeleteContact = () => {
        Alert.alert(
            t("contacts.deleteContactMessageTitle"),
            t("contacts.deleteContactMessageMessage"),
            [
                {
                    text: t("common.cancel"),
                    style: "cancel",
                },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: onDeleteContact,
                },
            ]
        );
    };

    useEffect(() => {
        if (contactUsername && nickname) {
            reset({
                nickname: nickname as string,
                username: contactUsername as string,
            });
        }
    }, [contactUsername, nickname, reset]);

    const nickNameField = watch()?.nickname;
    useEffect(() => {
        if (barcode) {
            reset({username: barcode as string, nickname: nickNameField});
        }
    }, [barcode, nickNameField, reset]);


    return {
        t,
        errors,
        styles,
        isContactBlocked,
        isBlockPending,
        isUnblockPending,
        control,
        handleSubmit,
        isSubmitting,
        isPending,
        isLoading,
        onSubmit,
        handleBlockAccount,
        handleUnblockAccount,
        handleDeleteContact,
    }

}
