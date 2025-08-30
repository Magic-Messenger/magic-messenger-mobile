import {
    AppLayout,
    Button,
    ContactScanQr,
    Icon,
    Input,
    ThemedText,
} from "@/components";
import {View} from "react-native";
import {useEditContact} from "../hooks";

export default function ContactEdit() {
    const {
        t,
        isContactBlocked,
        styles,
        control,
        handleSubmit,
        errors,
        isSubmitting,
        isLoading,
        isPending,
        isBlockPending,
        isUnblockPending,
        handleBlockAccount,
        handleUnblockAccount,
        handleDeleteContact,
        onSubmit,
    } = useEditContact();

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
                        leftIcon={isContactBlocked ? <Icon type="material-community" name="account-check-outline"/> :
                            <Icon type="material-community" name="account-cancel-outline"/>}
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
