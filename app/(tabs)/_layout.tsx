import { Tabs } from "expo-router";
import React from "react";

import { Icon } from "@/components";
import { Colors, spacing } from "@/constants";
import { widthPixel } from "@/utils";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTintColor: Colors.white,
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: Colors.menuInactiveColor,
        headerTitle: () => null,
        headerTitleAlign: "center",
        sceneStyle: {
          backgroundColor: "transparent",
        },
        tabBarStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
          backgroundColor: Colors.secondaryBackground,
        },
      }}
    >
      <Tabs.Screen
        name="(chat)"
        options={{
          title: t("tabs.chat"),
          tabBarLabelStyle: { ...spacing({ mt: 5 }) },
          tabBarIcon: ({ focused }) => (
            <Icon
              type="ant"
              size={widthPixel(22)}
              name="message1"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(groups)"
        options={{
          title: t("tabs.groups"),
          tabBarLabelStyle: { ...spacing({ mt: 5 }) },
          tabBarIcon: ({ focused }) => (
            <Icon
              type="feather"
              size={widthPixel(23)}
              name="users"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(notes)"
        options={{
          title: t("tabs.notes"),
          tabBarLabelStyle: { ...spacing({ mt: 5 }) },
          tabBarIcon: ({ focused }) => (
            <Icon
              type="feather"
              size={widthPixel(24)}
              name="file"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(settings)"
        options={{
          title: t("tabs.settings"),
          tabBarLabelStyle: { ...spacing({ mt: 5 }) },
          tabBarIcon: ({ focused }) => (
            <Icon
              type="feather"
              size={widthPixel(23)}
              name="settings"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}
