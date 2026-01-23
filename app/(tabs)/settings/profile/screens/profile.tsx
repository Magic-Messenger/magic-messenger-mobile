import { Image } from "expo-image";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import {
  AppLayout,
  Button,
  Dropdown,
  Icon,
  Input,
  ThemedText,
} from "@/components";
import { Colors } from "@/constants";
import { appSupportLanguages, copyToClipboard, widthPixel } from "@/utils";

import { useProfile } from "../hooks";

export default function ProfileScreen() {
  const {
    t,
    styles,
    isLoading,
    data,
    language,
    deleteApprove,
    setDeleteApprove,
    setUserPassword,
    isPending,
    isUploading,
    isProcessing,
    deleteProfile,
    handleChangeLanguage,
    changePassword,
    uploadProfilePicture,
  } = useProfile();

  return (
    <AppLayout
      keyboardAvoiding
      loading={isLoading}
      title={t("profile.yourProfile")}
    >
      <View style={styles.mainContainer}>
        <View>
          <TouchableOpacity
            onPress={uploadProfilePicture}
            disabled={isUploading || isProcessing}
            style={{
              position: "relative",
              width: widthPixel(80),
              height: widthPixel(80),
              borderRadius: widthPixel(50),
              backgroundColor: Colors.mainAccent,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {data?.data?.photoUrl ? (
              <Image
                source={{ uri: data.data.photoUrl }}
                style={{
                  width: widthPixel(100),
                  height: widthPixel(100),
                  borderRadius: widthPixel(50),
                }}
                contentFit="cover"
              />
            ) : (
              <Icon type="feather" name="user" size={40} color={Colors.white} />
            )}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {(isUploading || isProcessing) && (
                <ActivityIndicator size="small" color={Colors.white} />
              )}
              <Icon type="feather" name="edit" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
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
          selectedValue={language ?? "en"}
          options={appSupportLanguages()}
          onValueChange={handleChangeLanguage}
          style={styles.mt7}
        />
      </View>

      <View style={[styles.mainContainer, styles.mt5, styles.gap2]}>
        <ThemedText type="title" size={16}>
          {t("profile.userSettings")}
        </ThemedText>
        <Button
          type="secondary"
          label={t("profile.changePassword")}
          onPress={changePassword}
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
