import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { usePostApiAccountVerifyPhrases } from "@/api/endpoints/magicMessenger";
import {
  AppImage,
  AppLayout,
  Button,
  Input,
  LicenseInput,
  ThemedText,
} from "@/components";
import { Images, spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, showToast, widthPixel } from "@/utils";

interface RegisterFormData {
  username: string;
  phrases: string;
}

export default function VerifyPhrasesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const { mutateAsync: verifyPhrases, isPending } =
    usePostApiAccountVerifyPhrases();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    phrases: "",
  });

  const onSubmit = async () => {
    if (
      formData &&
      formData.username &&
      formData.username?.length <= 3 &&
      formData.phrases
    ) {
      const { success } = await verifyPhrases({
        data: {
          username: formData?.username,
          phrases: formData?.phrases?.match(/.{1,4}/g),
        },
      });

      if (success) {
        router.push({
          pathname: "/(auth)/resetPassword",
          params: {
            username: formData?.username,
            phrases: formData?.phrases?.match(/.{1,4}/g),
          },
        });
      }
    } else {
      showToast({
        type: "error",
        text1: t("common.emptyFile"),
      });
    }
  };

  return (
    <AppLayout
      container
      scrollable
      showBadge={false}
      footer={
        <Button
          type="primary"
          label={t("register.button")}
          onPress={onSubmit}
          loading={isPending}
        />
      }
    >
      <View style={[styles.mainContainer, styles.pt10]}>
        <View style={[styles.alignItemsCenter, styles.mb5]}>
          <AppImage
            source={Images.logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <ThemedText weight="semiBold" style={styles.pt2}>
            {t("forgotAccount.userResetPassword")}
          </ThemedText>
        </View>

        <View style={[styles.formContainer, styles.fullWidth, styles.mt7]}>
          <Input
            label={t("userName")}
            onChangeText={(text) =>
              setFormData({ ...formData, username: text })
            }
          />

          <View style={styles.phrasesInputContainer}>
            <ThemedText weight="semiBold" size={13}>
              {t("forgotAccount.inputPhrases")}
            </ThemedText>
            <LicenseInput
              grid
              groupCount={15}
              charactersPerGroup={4}
              itemsPerRow={3}
              placeholder="----"
              value={formData.phrases}
              onChangeText={(text) =>
                setFormData({ ...formData, phrases: text })
              }
            />
          </View>
        </View>
      </View>
    </AppLayout>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    mainContainer: {},
    formContainer: {
      ...spacing({
        gap: 16,
      }),
    },
    logoImage: {
      width: widthPixel(220),
      height: heightPixel(50),
    },
    phrasesInputContainer: {
      gap: 10,
    },
  });
