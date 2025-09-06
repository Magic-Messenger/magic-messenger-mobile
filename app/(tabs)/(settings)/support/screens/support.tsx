import React from "react";
import { TouchableOpacity, View } from "react-native";

import { AppLayout, ThemedText } from "@/components";

import { useSupport } from "../hooks";

export default function SupportScreen() {
  const { t, styles, handleGoToFaq } = useSupport();

  return (
    <AppLayout container title={t("support.title")}>
      <View style={[styles.flex, styles.mt3]}>
        <TouchableOpacity
          style={styles.supportItem}
          activeOpacity={0.5}
          onPress={handleGoToFaq}
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
                {t("support.faqTitle")}
              </ThemedText>

              <ThemedText weight="semiBold" size={12} style={styles.mt2}>
                {t("support.faqDescription")}
              </ThemedText>
            </View>

            <View style={styles.viewButton}>
              <ThemedText weight="bold" size={10}>
                {t("support.view")}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem} activeOpacity={0.5}>
          <View
            style={[
              styles.flexRow,
              styles.justifyContentBetween,
              styles.alignItemsCenter,
            ]}
          >
            <View>
              <ThemedText weight="semiBold" size={16}>
                {t("support.ticketsTitle")}
              </ThemedText>

              <ThemedText weight="semiBold" size={12} style={styles.mt2}>
                {t("support.ticketsDescription")}
              </ThemedText>
            </View>

            <View style={styles.viewButton}>
              <ThemedText weight="bold" size={10}>
                {t("support.view")}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem} activeOpacity={0.5}>
          <View
            style={[
              styles.flexRow,
              styles.justifyContentBetween,
              styles.alignItemsCenter,
            ]}
          >
            <View>
              <ThemedText weight="semiBold" size={16}>
                {t("support.startSupportTicketTitle")}
              </ThemedText>

              <ThemedText weight="semiBold" size={12} style={styles.mt2}>
                {t("support.startSupportTicketDescription")}
              </ThemedText>
            </View>

            <View style={styles.viewButton}>
              <ThemedText weight="bold" size={10}>
                {t("support.view")}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}
