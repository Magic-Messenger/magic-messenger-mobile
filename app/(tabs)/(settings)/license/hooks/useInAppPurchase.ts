import { PurchaseResult, useIAP } from "expo-iap";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import {
  useGetApiAccountGetProfile,
  usePostApiInAppPurchaseValidateAppleReceipt,
  usePostApiInAppPurchaseValidateGoogleReceipt,
} from "@/api/endpoints/magicMessenger";
import { useUserStore } from "@/store";
import { getInstallationId, showToast } from "@/utils";

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
  const setProfile = useUserStore((state) => state.setProfile);
  const isLogin = useUserStore((state) => state.isLogin);

  const {
    connected,
    products,
    requestPurchase,
    currentPurchase,
    finishTransaction,
    fetchProducts,
  } = useIAP();

  const { refetch: getProfile, isLoading: isProfileLoading } =
    useGetApiAccountGetProfile({ query: { enabled: false } });
  const { mutateAsync: validateApple } =
    usePostApiInAppPurchaseValidateAppleReceipt();
  const { mutateAsync: validateGoogle } =
    usePostApiInAppPurchaseValidateGoogleReceipt();

  const refreshAfterCompletePurchase = async () => {
    showToast({
      text1: t("license.successUpgrade"),
      type: "success",
    });
    if (isLogin) {
      const profileDataResponse = await getProfile();
      profileDataResponse.data?.data &&
        setProfile(profileDataResponse.data?.data);
    } else {
      router.replace("/(auth)/login/screens/login");
    }
  };

  const completePurchase = async () => {
    try {
      if (currentPurchase) {
        console.log("Purchase completed: ", currentPurchase.id);
        const transactionResponse = await finishTransaction({
          purchase: currentPurchase,
          isConsumable: true,
        });
        const purchaseResult = transactionResponse as PurchaseResult;
        let validateResponse = false;
        if (Platform.OS === "ios") {
          const appleValidateResponse = await validateApple({
            data: {
              username: userName,
              deviceId: await getInstallationId(),
              receiptData: purchaseResult.purchaseToken,
            },
          });
          validateResponse = appleValidateResponse.success ?? false;
        } else {
          const googleValidateResponse = await validateGoogle({
            data: {
              username: userName,
              deviceId: await getInstallationId(),
              purchaseToken: purchaseResult.purchaseToken,
              productId: currentPurchase.productId,
              packageName: "com.magicmessenger.app",
            },
          });
          validateResponse = googleValidateResponse.success ?? false;
        }

        console.log("Purchase completed:", transactionResponse);
        if (validateResponse) await refreshAfterCompletePurchase();
      }
    } catch (error) {
      console.error("Failed to complete purchase:", error);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      await requestPurchase({
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
      console.error("Purchase failed:", error);
    }
  };

  useEffect(() => {
    if (currentPurchase) {
      completePurchase();
    }
  }, [currentPurchase]);

  useEffect(() => {
    if (connected) {
      // Fetch your products
      fetchProducts({ skus: productIds, type: "inapp" })
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
    isProfileLoading,
  };
};
