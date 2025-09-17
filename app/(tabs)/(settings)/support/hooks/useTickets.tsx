import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useGetApiTicketsList } from "@/api/endpoints/magicMessenger";
import { TicketDto } from "@/api/models";
import { Icon, ThemedText } from "@/components";
import { spacing } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { heightPixel, spacingPixel, widthPixel } from "@/utils";

export const useTickets = () => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  const { data: ticketsResponse, isLoading } = useGetApiTicketsList({
    pageSize: 999,
  });

  const handleGoToDetail = (ticketId: string) => {
    router.push({
      pathname: "/ticketDetail/screens/ticketDetail",
      params: {
        ticketId,
      } as never,
    });
  };

  const renderItem = ({ item }: { item: TicketDto }) => (
    <TouchableOpacity
      key={item.ticketId}
      style={styles.ticketItem}
      activeOpacity={0.5}
      onPress={() => handleGoToDetail(item.ticketId!)}
    >
      <View
        style={[
          styles.flexRow,
          styles.justifyContentBetween,
          styles.alignItemsCenter,
        ]}
      >
        <View style={styles.flex}>
          <ThemedText weight="semiBold" size={14}>
            #{item.ticketCode}
          </ThemedText>
        </View>

        <View
          style={[styles.statusContainer, styles[item.ticketStatus as never]]}
        >
          <ThemedText weight="bold" size={8}>
            {t(`tickets.${item.ticketStatus!.toString?.()?.toLowerCase?.()}`)}
          </ThemedText>
        </View>

        <View style={styles.viewButton}>
          <ThemedText weight="semiBold" size={14}>
            {t("support.view")}
          </ThemedText>

          <Icon type="feather" name="chevron-right" size={22} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const tickets = ticketsResponse?.data ?? [];

  return {
    t,
    styles,
    isLoading,
    tickets,
    renderItem,
    handleGoToDetail,
  };
};

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    ticketItem: {
      ...spacing({
        mb: 16,
      }),
    },
    statusContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: widthPixel(45),
      height: heightPixel(25),
      marginRight: spacingPixel(8),
      borderRadius: spacingPixel(5),
    },
    Open: {
      backgroundColor: colors.success,
    },
    Waiting: {
      backgroundColor: colors.warning,
    },
    Closed: {
      backgroundColor: colors.danger,
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
