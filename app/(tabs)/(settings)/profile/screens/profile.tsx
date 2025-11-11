import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";

import {
  AppLayout,
  Button,
  Dropdown,
  Icon,
  Input,
  ThemedText,
} from "@/components";
import { appSupportLanguages, copyToClipboard } from "@/utils";

import { useProfile } from "../hooks";

export default function ProfileScreen() {
  const {
    t,
    styles,
    isLoading,
    data,
    settings,
    deleteApprove,
    setDeleteApprove,
    setUserPassword,
    isPending,
    deleteProfile,
    handleChangeLanguage,
  } = useProfile();

  return (
    <AppLayout
      keyboardAvoiding
      loading={isLoading}
      title={t("profile.yourProfile")}
    >
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
                t("profile.successCopyUserId"),
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
          selectedValue={settings?.language ?? "en"}
          options={appSupportLanguages()}
          onValueChange={handleChangeLanguage}
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
