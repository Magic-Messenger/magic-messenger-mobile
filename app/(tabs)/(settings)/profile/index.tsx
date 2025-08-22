import {
  useDeleteApiAccountDeleteProfile,
  useGetApiAccountGetProfile,
} from "@/api/endpoints/magicMessenger";
import {
  AppLayout,
  Button,
  Dropdown,
  Icon,
  Input,
  ThemedText,
} from "@/components";
import { Colors, flexBox, spacing } from "@/constants";
import { useAppStore, useUserStore } from "@/store";
import { ColorDto, useThemedStyles } from "@/theme";
import {
  appSupportLanguages,
  changeLanguage,
  copyToClipboard,
  fontPixel,
  showToast,
  widthPixel,
} from "@/utils";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { settings } = useAppStore();
  const { logout } = useUserStore();
  const styles = useThemedStyles(createStyle);

  const { data, isLoading } = useGetApiAccountGetProfile();
  const { mutateAsync: deleteProfileRequest, isPending } =
    useDeleteApiAccountDeleteProfile();

  const [userPassword, setUserPassword] = useState<string | null>(null);
  const [deleteApprove, setDeleteApprove] = useState<boolean>(false);

  const supportLanguages = useMemo(() => {
    return appSupportLanguages();
  }, [appSupportLanguages]);

  const deleteProfile = async () => {
    if (deleteApprove) {
      if (userPassword && userPassword?.length >= 8) {
        console.log({ userPassword });
        const { success } = await deleteProfileRequest({
          params: {
            password: userPassword,
          },
        });
        if (success) {
          logout();
          router.dismissAll();
          router.replace("/(auth)/preLogin");
        }
      } else {
        showToast({
          type: "error",
          text1: t("profile.passwordError"),
        });
      }
      console.log({ userPassword });
    } else {
      setDeleteApprove(true);
    }
  };

  return (
    <AppLayout scrollable loading={isLoading} title={t("profile.yourProfile")}>
      <View style={styles.mainContainer}>
        <View
          style={[
            styles.flex,
            styles.flexRow,
            styles.alignItemsCenter,
            styles.justifyContentBetween,
          ]}
        >
          <View style={styles.userIDInfo}>
            <ThemedText type="subtitle" size={15}>
              {t("profile.userName")}
            </ThemedText>
            <ThemedText type="default" size={14}>
              {data?.data?.username}
            </ThemedText>
          </View>

          <TouchableOpacity
            onPress={() =>
              copyToClipboard(
                data?.data?.username as string,
                t("profile.successCopyUserId")
              )
            }
          >
            <Icon type="feather" name="copy" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.qrSection}>
        <View style={styles.qrContainer}>
          {data?.data?.profileQrCodeLink && (
            <View style={styles.qrCodeImage}>
              <Image
                style={{ width: 75, height: 75 }}
                contentFit="contain"
                source={{
                  uri: data?.data?.profileQrCodeLink,
                }}
              />
            </View>
          )}

          <ThemedText type="default" weight="semiBold" size={15} shrink>
            {t("profile.qr")}
          </ThemedText>
        </View>

        <Dropdown
          label={t("profile.language")}
          labelStyle={{
            fontSize: fontPixel(16),
          }}
          selectedValue={settings?.language as never}
          options={supportLanguages}
          onValueChange={(item) => changeLanguage(item as never)}
          style={styles.mt7}
        />
      </View>

      <View style={[styles.mainContainer, styles.mt5, styles.gap2]}>
        <ThemedText type="title" size={16}>
          {t("profile.dangerzone")}
        </ThemedText>

        {deleteApprove && (
          <Input
            secureTextEntry
            label={t("profile.password")}
            onChangeText={(password) => setUserPassword(password)}
          />
        )}

        <Button
          loading={isPending}
          type="danger"
          label={
            deleteApprove
              ? t("profile.deleteProfile")
              : t("profile.askDeleteProfile")
          }
          onPress={deleteProfile}
        />

        {deleteApprove && (
          <Button
            type="secondary"
            label={t("common.cancel")}
            onPress={() => setDeleteApprove(false)}
          />
        )}

        <ThemedText type="default" size={12}>
          {t("profile.deleteProfileNote")}
        </ThemedText>
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {
      ...spacing({
        pl: 20,
        pr: 20,
      }),
    },
    userIDInfo: {
      ...spacing({
        gap: 10,
      }),
    },
    qrSection: {
      ...spacing({ p: 20, pt: 30, mt: 25 }),
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: Colors.mainAccent,
    },
    qrContainer: {
      ...flexBox(1, "row", "center", "center"),
      ...spacing({ gap: 15 }),
    },
    qrCodeImage: {
      ...spacing({ p: 5 }),
      borderRadius: widthPixel(5),
      backgroundColor: Colors.white,
    },
  });
