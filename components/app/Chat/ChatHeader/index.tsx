import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppImage, ThemedText, TorBadge } from "@/components";
import { Images } from "@/constants";
import { ColorDto, useThemedStyles } from "@/theme";
import { spacingPixel, widthPixel } from "@/utils";

interface ChatHeaderProps {
  userName?: string;
  typingUsername?: string;
  onlineUsers?: string[];
}
export function ChatHeader({
  userName,
  onlineUsers,
  typingUsername,
}: ChatHeaderProps) {
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        styles.flexRow,
        styles.alignItemsCenter,
        styles.mb4,
      ]}
    >
      <View
        style={[
          styles.flex,
          styles.flexRow,
          styles.alignItemsCenter,
          styles.gap2,
        ]}
      >
        <AppImage source={Images.icon} style={styles.avatar} />
        <View>
          <ThemedText type="title" size={16} numberOfLines={1}>
            {userName}
          </ThemedText>
          <ThemedText type="subtitle">
            {typingUsername ? t("chat.typing") : t("chat.online")}
          </ThemedText>
        </View>
      </View>

      <View
        style={[styles.flex, styles.justifyContentEnd, styles.alignItemsEnd]}
      >
        <TorBadge />
      </View>
    </View>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacingPixel(15),
    },
    avatar: {
      width: widthPixel(40),
      height: widthPixel(40),
    },
  });
