import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { View } from "react-native";

import { AppLayout, EmptyList } from "@/components";

import { useTickets } from "../hooks";

export default function TicketsScreen() {
  const { t, styles, isLoading, tickets, renderItem } = useTickets();

  // Empty list component
  const renderEmptyList = useCallback(
    () => (
      <EmptyList
        label={t("tickets.noTickets")}
        icon="inbox"
        style={styles.mt10}
      />
    ),
    [t, styles.mt10],
  );

  return (
    <AppLayout container title={t("tickets.myTickets")} loading={isLoading}>
      <View style={styles.flex}>
        <FlashList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.ticketId!}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          drawDistance={400}
          removeClippedSubviews
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
          }}
        />
      </View>
    </AppLayout>
  );
}
