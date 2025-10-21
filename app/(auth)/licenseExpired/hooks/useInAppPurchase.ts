import { Purchase, useIAP } from "expo-iap";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform } from "react-native";

import {
  usePostApiInAppPurchaseValidateAppleReceipt,
  usePostApiInAppPurchaseValidateGoogleReceipt,
} from "@/api/endpoints/magicMessenger";
import { PURCHASE_ON_WEB_URL } from "@/constants";
import { useUserStore } from "@/store";
import {
  getApplicationId,
  getInstallationId,
  showToast,
  trackEvent,
} from "@/utils";

const productIds = [
  "one_month",
  "two_months",
  "three_months",
  "six_months",
  "nine_months",
  "twelve_months",
];

export const useInAppPurchase = () => {
  const { t } = useTranslation();

  const userName = useUserStore((state) => state.userName);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePurchaseOnWeb = () => Linking.openURL(PURCHASE_ON_WEB_URL);

  const {
    connected,
    products,
    requestPurchase,
    finishTransaction,
    fetchProducts,
  } = useIAP({
    onPurchaseSuccess: completePurchase,
  });

  const { mutateAsync: validateApple } =
    usePostApiInAppPurchaseValidateAppleReceipt();
  const { mutateAsync: validateGoogle } =
    usePostApiInAppPurchaseValidateGoogleReceipt();

  async function completePurchase(currentPurchase: Purchase) {
    try {
      setIsLoading(true);

      trackEvent("current_purchase", currentPurchase);

      await finishTransaction({
        purchase: currentPurchase,
        isConsumable: true,
      });

      let validateResponse = false;
      if (Platform.OS === "ios") {
        const appleValidateResponse = await validateApple({
          data: {
            username: userName,
            deviceId: await getInstallationId(),
            receiptData: currentPurchase.purchaseToken,
          },
        });
        validateResponse = appleValidateResponse.success ?? false;
      } else {
        const googleValidateResponse = await validateGoogle({
          data: {
            username: userName,
            deviceId: await getInstallationId(),
            purchaseToken: currentPurchase.purchaseToken,
            productId: currentPurchase.productId,
            packageName: getApplicationId(),
          },
        });
        validateResponse = googleValidateResponse.success ?? false;
      }

      if (validateResponse) await refreshAfterCompletePurchase();

      trackEvent("purchase_completed", { productId: currentPurchase.id });

      setIsLoading(false);
    } catch (error) {
      trackEvent("Failed to complete purchase:", { error });
      setIsLoading(false);
    }
  }

  const refreshAfterCompletePurchase = async () => {
    showToast({
      text1: t("license.successUpgrade"),
      type: "success",
    });
    router.canDismiss() && router.dismissAll();
    router.replace("/(auth)/login/screens/login");
  };

  const handlePurchase = async (productId: string) => {
    try {
      trackEvent("handlePurchase: ", { productId });
      await requestPurchase({
        type: "in-app",
        request: {
          ios: {
            sku: productId,
          },
          android: {
            skus: [productId],
          },
        },
      });
    } catch (error) {
      trackEvent("Purchase failed:", { error });
    }
  };

  useEffect(() => {
    if (connected) {
      // Fetch your products
      fetchProducts({ skus: productIds, type: "in-app" })
        .then()
        .catch(console.error);
    }
  }, [connected]);

  return {
    connected,
    products: products?.sort(
      (a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id),
    ),
    handlePurchase,
    handlePurchaseOnWeb,
    isLoading,
  };
};
