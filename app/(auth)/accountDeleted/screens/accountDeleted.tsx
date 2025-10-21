import { View } from "react-native";

import { AppImage, AppLayout, Button, Icon, ThemedText } from "@/components";
import { Images } from "@/constants";

import { useAccountDeleted } from "../hooks";

export default function AccountDeletedScreen() {
  const { t, styles, handleGoToRegister } = useAccountDeleted();

  return (
    <AppLayout
      container
      showBadge={false}
      footer={
        <Button
          type="primary"
          label={t("accountDeleted.createAccount")}
          onPress={handleGoToRegister}
          leftIcon={<Icon type="material" name="app-registration" />}
        />
      }
    >
      <View
        style={[
          styles.flex,
          styles.justifyContentCenter,
          styles.alignItemsCenter,
        ]}
      >
        <View style={[styles.alignItemsCenter, styles.mb5]}>
          <AppImage
            source={Images.logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <ThemedText type="title" style={styles.textCenter}>
            {t("accountDeleted.yourAccountDeleted")}
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.mt4, styles.textCenter]}>
            {t("accountDeleted.description")}
          </ThemedText>
        </View>
      </View>
    </AppLayout>
  );
}
