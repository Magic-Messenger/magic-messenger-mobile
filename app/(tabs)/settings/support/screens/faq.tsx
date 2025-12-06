import React from "react";
import { TouchableOpacity, View } from "react-native";

import { AppLayout, Icon, ThemedText } from "@/components";

import { useFaq } from "../hooks";

export default function FaqScreen() {
  const { t, styles, isLoading, faqCategories, handleGoToFaqDetail } = useFaq();

  return (
    <AppLayout container title={t("support.title")} loading={isLoading}>
      <View style={[styles.flex, styles.mt3]}>
        {faqCategories?.map((category) => (
          <TouchableOpacity
            key={category.title}
            style={styles.faqItem}
            activeOpacity={0.5}
            onPress={() => handleGoToFaqDetail(category.value)}
          >
            <View
              style={[
                styles.flexRow,
                styles.justifyContentBetween,
                styles.alignItemsCenter,
              ]}
            >
              <View>
                <ThemedText weight="semiBold" size={16}>
                  {category.title}
                </ThemedText>
              </View>

              <View style={styles.viewButton}>
                <ThemedText weight="semiBold" size={14}>
                  {t("support.browse")} ({category.count})
                </ThemedText>

                <Icon type="feather" name="chevron-right" size={24} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </AppLayout>
  );
}
