import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, View } from "react-native";

import { AppLayout, Button, Icon, ThemedText } from "@/components";
import { Colors, Images } from "@/constants";

import { useServers } from "../hooks";

export default function ServersScreen() {
  const {
    t,
    styles,
    title,
    isConnected,
    loading,
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleCheckConnection,
  } = useServers();

  return (
    <AppLayout
      container
      scrollable
      title={title}
      footer={
        <>
          {isConnected && (
            <Button
              loading={loading}
              type="danger"
              label={t("servers.disconnect")}
              leftIcon={<Icon type="ant" name="disconnect" />}
              onPress={handleDisconnect}
              style={styles.mb2}
            />
          )}

          {!isConnected && (
            <Button
              loading={loading}
              type="secondary"
              label={t("servers.startConnection")}
              leftIcon={<Icon type="ionicons" name="cloud-done-outline" />}
              onPress={handleConnect}
              style={styles.mb2}
            />
          )}

          {isConnected && (
            <Button
              type="secondary"
              label={t("servers.checkConnection")}
              leftIcon={<Icon type="feather" name="refresh-cw" />}
              onPress={handleCheckConnection}
              style={styles.mb2}
            />
          )}

          {/*  {isConnected && (
            <Button
              type="primary"
              label={t("servers.restartConnection")}
              leftIcon={<Icon type="feather" name="refresh-cw" />}
              onPress={handleReconnect}
            />
          )} */}
        </>
      }
    >
      <ThemedText type="title" weight="semiBold" size={18}>
        {t("servers.connections")}
      </ThemedText>
      <View style={[styles.flex, styles.mt3]}>
        <View style={styles.flexRow}>
          <Ionicons
            name={isConnected ? "checkmark-circle" : "close-circle"}
            size={20}
            color={isConnected ? Colors.success : Colors.danger}
          />
          <ThemedText style={styles.ml2}>{t("servers.step1")}</ThemedText>
          <ThemedText weight="bold" style={styles.ml2}>
            {t("servers.connection")}
          </ThemedText>
        </View>

        <View style={[styles.flexRow, styles.mt3]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <ThemedText style={styles.ml2}>{t("servers.step2")}</ThemedText>
          <ThemedText weight="bold" style={styles.ml2}>
            {t("servers.encryption")}
          </ThemedText>
        </View>

        <View style={[styles.flexRow, styles.mt3]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <ThemedText style={styles.ml2}>{t("servers.step3")}</ThemedText>
          <ThemedText weight="bold" style={styles.ml2}>
            {t("servers.magicServer")}
          </ThemedText>
        </View>

        <ThemedText type="title" weight="semiBold" size={18} style={styles.mt6}>
          {t("servers.trafficRoute")}
        </ThemedText>

        <View
          style={[
            styles.mt2,
            styles.flexRow,
            styles.justifyContentBetween,
            styles.alignItemsCenter,
            styles.pl6,
            styles.pr4,
          ]}
        >
          <View style={[styles.justifyContentCenter, styles.alignItemsCenter]}>
            <Image source={Images.serverImage} />
            <ThemedText weight="bold" style={styles.mt2}>
              TOR
            </ThemedText>
          </View>
          <View
            style={[
              styles.justifyContentCenter,
              styles.alignItemsCenter,
              styles.ml4,
            ]}
          >
            <Image
              source={
                isConnected ? Images.connectionImage : Images.noConnectionImage
              }
            />
          </View>
          <View style={[styles.justifyContentCenter, styles.alignItemsCenter]}>
            <Image source={Images.magicServerImage} />
            <ThemedText weight="bold" style={styles.mt2}>
              {t("servers.magicServer")}
            </ThemedText>
          </View>
        </View>
      </View>
    </AppLayout>
  );
}
