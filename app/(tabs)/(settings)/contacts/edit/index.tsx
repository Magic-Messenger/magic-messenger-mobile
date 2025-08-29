import {
    useDeleteApiContactsDelete, usePostApiAccountBlockAccount, usePostApiAccountUnblockAccount,
    usePostApiContactsUpdate,
} from "@/api/endpoints/magicMessenger";
import {UpdateContactCommandRequest} from "@/api/models";
import {
    AppLayout,
    Button,
    ContactScanQr,
    Icon,
    Input,
    ThemedText,
} from "@/components";
import {useThemedStyles} from "@/theme";
import {showToast} from "@/utils";
import {router, useLocalSearchParams} from "expo-router";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Alert, View} from "react-native";

export default function ContactEdit() {
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

    return (
        <AppLayout
            container
            scrollable
            title={<ContactScanQr/>}
            footer={
                <>
                    <Button
                        type="secondary"
                        label={isContactBlocked ? t("contacts.unblockContact") : t("contacts.blockContact")}
                        leftIcon={isContactBlocked ? <Icon type="material-community" name="account-check-outline"/> : <Icon type="material-community" name="account-cancel-outline"/>}
                        onPress={isContactBlocked ? handleUnblockAccount : handleBlockAccount}
                        style={styles.mb2}
                        loading={isBlockPending || isUnblockPending}
                        disabled={isBlockPending || isUnblockPending}
                    />
                    <Button
                        type="danger"
                        label={t("contacts.deleteContact")}
                        leftIcon={<Icon type="feather" name="trash"/>}
                        onPress={handleDeleteContact}
                        style={styles.mb2}
                    />
                    <Button
                        loading={isPending || isLoading}
                        disabled={isSubmitting}
                        type="primary"
                        label={t("contacts.editContact")}
                        onPress={handleSubmit(onSubmit)}
                    />
                </>
            }
        >
            <ThemedText type="title" weight="semiBold" size={20}>
                {t("contacts.editContact")}
            </ThemedText>

            <View style={[styles.gap5, styles.mt10]}>
                <Input
                    control={control}
                    name="username"
                    label={t("contacts.userName")}
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
                    name="nickname"
                    label={t("contacts.nickName")}
                    rules={{
                        required: t("inputError.required", {
                            field: t("contacts.nickName"),
                        }),
                        minLength: {
                            value: 3,
                            message: t("inputError.minLength", {
                                field: t("contacts.nickName"),
                                count: 3,
                            }),
                        },
                    }}
                    error={errors.username?.message}
                />


            </View>
        </AppLayout>
    );
}
