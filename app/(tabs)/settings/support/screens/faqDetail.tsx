import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

import { FaqCategory } from "@/api/models";
import { AppLayout, Collapsible } from "@/components";

import { useFaq } from "../hooks";

export default function FaqDetailScreen() {
  const { t, styles, allFaqs, activeIndex, handleSetActive } = useFaq();
  const { category }: { category?: FaqCategory } = useLocalSearchParams();

  const faqList = allFaqs?.filter((faq) => faq.category === category);

  return (
    <AppLayout container title={t("support.title")}>
      <View style={[styles.flex, styles.mt3]}>
        {faqList?.map((faq, faqIndex) => (
          <Collapsible
            key={faq.faqId}
            question={faq.faqQuestion!}
            answer={faq.faqAnswer!}
            isActive={faqIndex === activeIndex}
            onPress={() => handleSetActive(faqIndex)}
          />
        ))}
      </View>
    </AppLayout>
  );
}
