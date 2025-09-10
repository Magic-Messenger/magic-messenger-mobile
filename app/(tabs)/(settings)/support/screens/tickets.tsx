import { FlashList } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";

import { AppLayout } from "@/components";

import { useTickets } from "../hooks";

export default function TicketsScreen() {
  const { t, styles, isLoading, tickets, renderItem } = useTickets();

  return (
    <AppLayout container title={t("tickets.myTickets")} loading={isLoading}>
      <View style={styles.flex}>
        <FlashList
          keyExtractor={(item) => item.ticketId!}
          renderItem={renderItem}
          data={tickets}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </AppLayout>
  );
}
