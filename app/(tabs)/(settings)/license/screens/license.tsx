import dayjs from "dayjs";
import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { useInAppPurchase } from "@/app/(tabs)/(settings)/license/hooks/useInAppPurchase";
import { AppLayout, Icon, ProductItem, ThemedText } from "@/components";

import { useLicense } from "../hooks";

export default function LicenseScreen() {
  const { t, styles, profile, handleCopy } = useLicense();
  const { products, handlePurchase, isProfileLoading } = useInAppPurchase();

  return (
    <AppLayout
      container
      scrollable
      title={t("license.title")}
      loading={isProfileLoading}
    >
      <ThemedText type="title" weight="semiBold" size={20}>
        {t("license.yourLicense")}
      </ThemedText>

      <View style={[styles.flex, styles.mt2]}>
        <View style={styles.licenseContainer}>
          <View>
            <ThemedText style={styles.activeLicenseText}>
              {t("license.activeLicenseText")}
            </ThemedText>
            <TouchableOpacity onPress={handleCopy}>
              <ThemedText style={styles.licenseCodeText}>
                <Icon type="feather" name="copy" size={14} />{" "}
                {profile?.license?.licenseCode}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <View>
            <View style={styles.expireDateContainer}>
              <ThemedText style={styles.expireLicenseDate}>
                {t("license.expireLicenseDate", {
                  expireDate: dayjs(profile?.license?.expirationDate).format(
                    "DD.MM.YYYY",
                  ),
                })}
              </ThemedText>
            </View>
          </View>
        </View>

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
