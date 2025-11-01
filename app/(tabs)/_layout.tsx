import { Tabs, usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components";
import { Colors, spacing } from "@/constants";
import { needsBottomSafeArea, spacingPixel, widthPixel } from "@/utils";

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const isNeedBottomSafeArea = needsBottomSafeArea();

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if pathname actually changed
    if (pathname !== previousPathname.current) {
      setIsTransitioning(true);
      previousPathname.current = pathname;

      // Force hide spinner after animation completes
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Slightly longer to ensure animation completes
    }

    // Cleanup on unmounting
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // Safety: Force hide spinner after 500 ms regardless
  useEffect(() => {
    if (isTransitioning) {
      const safetyTimeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);

      return () => clearTimeout(safetyTimeout);
    }
  }, [isTransitioning]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: Colors.white,
          tabBarInactiveTintColor: Colors.menuInactiveColor,
          sceneStyle: {
            backgroundColor: Colors.secondaryBackground,
          },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: 0,
            backgroundColor: Colors.secondaryBackground,
            paddingTop: spacingPixel(5),
            ...(isNeedBottomSafeArea && {
              marginBottom: Math.max(insets.bottom, 16),
            }),
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
                  focused
                    ? "chatbubble-ellipses"
                    : "chatbubble-ellipses-outline"
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

      {isTransitioning && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
});
