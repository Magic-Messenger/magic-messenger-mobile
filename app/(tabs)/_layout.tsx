import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Images } from "@/constants";
import { StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTintColor: Colors.white,
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: Colors.menuInactiveColor,
        headerTitleAlign: "center",
        headerTitle: () => (
          <Image
            source={Images.logo}
            contentFit="contain"
            style={styles.headerImage}
          />
        ),
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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="house.fill"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="paperplane.fill"
              color={focused ? Colors.white : Colors.menuInactiveColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: 105,
    height: 30,
  },
});
