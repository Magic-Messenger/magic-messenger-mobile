import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components";
import { Colors, spacing } from "@/constants";
import { spacingPixel, widthPixel } from "@/utils";

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
          paddingTop: spacingPixel(5),
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
              type="ionicons"
              size={widthPixel(24)}
              name={
                focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
              }
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
              type="material-community"
              size={widthPixel(24)}
              name={focused ? "account-group" : "account-group-outline"}
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
              type="ionicons"
              size={widthPixel(24)}
              name={focused ? "document-text" : "document-text-outline"}
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
              type="ionicons"
              size={widthPixel(24)}
              name={focused ? "settings" : "settings-outline"}
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}
