import React from "react";
import { ActivityIndicator, View } from "react-native";

import {
  AppImage,
  AppLayout,
  Button,
  Icon,
  ProductItem,
  ThemedText,
} from "@/components";
import { Images } from "@/constants";

import { useInAppPurchase, useLicenseExpired } from "../hooks";

export default function LicenseScreen() {
  const { t, styles } = useLicenseExpired();
  const { products, handlePurchase, handlePurchaseOnWeb, isLoading } =
    useInAppPurchase();

  return (
    <AppLayout
      container
      scrollable
      showBadge={false}
      safeAreaBottom={false}
      loading={isLoading}
      footer={
        <Button
          type="secondary"
          label={t("license.purchaseOnWeb")}
          onPress={handlePurchaseOnWeb}
          leftIcon={<Icon type="material" name="payment" />}
        />
      }
    >
      <View style={[styles.alignItemsCenter, styles.mb5]}>
        <AppImage
          source={Images.logo}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.container}>
        <ThemedText type="title" style={styles.textCenter}>
          {t("licenseExpired.yourLicenseExpired")}
        </ThemedText>
        <ThemedText type="subtitle" style={[styles.mt4, styles.textCenter]}>
          {t("licenseExpired.description")}
        </ThemedText>
      </View>

      <View style={[styles.flex, styles.mt2]}>
        <View style={styles.mt4}>
          {!products?.length ? (
            <View
              style={[
                styles.flex,
                styles.alignItemsCenter,
                styles.justifyContentCenter,
              ]}
            >
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <>
              <ThemedText type="title" weight="semiBold" size={18}>
                {t("license.optionsForRenewal")}
              </ThemedText>

              <View style={styles.mt2}>
                {products?.map((product) => (
                  <ProductItem
                    key={product.id}
                    productName={product.title}
                    price={product.displayPrice}
                    onPress={() => handlePurchase(product.id)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </AppLayout>
  );
}
