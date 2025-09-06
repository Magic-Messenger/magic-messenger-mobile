import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useGetApiFaqsList } from "@/api/endpoints/magicMessenger";
import { FaqCategory } from "@/api/models";
import { spacing } from "@/constants";
import { useThemedStyles } from "@/theme";

export const useFaq = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const { data: faqsResponse, isLoading } = useGetApiFaqsList({
    pageSize: 999,
  });

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const faqCategories = [
    {
      title: t("support.faqCategoryGeneral"),
      value: FaqCategory.General,
      count: faqsResponse?.data?.filter?.(
        (x) => x.category === FaqCategory.General,
      )?.length,
    },
    {
      title: t("support.faqCategoryPrivacy"),
      value: FaqCategory.Privacy,
      count: faqsResponse?.data?.filter?.(
        (x) => x.category === FaqCategory.Privacy,
      )?.length,
    },
    {
      title: t("support.faqCategoryPricing"),
      value: FaqCategory.Pricing,
      count: faqsResponse?.data?.filter?.(
        (x) => x.category === FaqCategory.Pricing,
      )?.length,
    },
  ];

  const handleSetActive = (index?: number) => {
    setActiveIndex(index === activeIndex ? undefined : index);
  };

  const handleGoToFaq = () =>
    router.push("/(tabs)/(settings)/support/screens/faq");

  const handleGoToFaqDetail = (faqCategory: FaqCategory) => {
    router.push({
      pathname: "/(tabs)/(settings)/support/screens/faqDetail",
      params: {
        category: faqCategory,
      } as never,
    });
  };

  return {
    t,
    styles,
    isLoading,
    handleGoToFaq,
    handleGoToFaqDetail,
    faqCategories,
    activeIndex,
    handleSetActive,
    allFaqs: faqsResponse?.data ?? [],
  };
};

const createStyle = () =>
  StyleSheet.create({
    faqItem: {
      ...spacing({
        mb: 16,
      }),
    },
    viewButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 5,
      ...spacing({
        pl: 16,
        pr: 16,
        pt: 8,
        pb: 8,
      }),
    },
  });
