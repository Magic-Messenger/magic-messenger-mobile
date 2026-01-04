import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";

import { useAppStore } from "@/store";

type UseSecureScreenOptions = {
  enabled?: boolean;
};

export function useScreenProtection({
  enabled = true,
}: UseSecureScreenOptions = {}) {
  const currentAppState = useAppStore((state) => state.currentAppState);

  const protectionEnabled = useCallback(async () => {
    if (!enabled) return;

    try {
      if (Platform.OS === "ios") {
        // iOS: App Switcher snapshot protection
        await ScreenCapture.enableAppSwitcherProtectionAsync();
      }

      if (Platform.OS === "android") {
        // Android: FLAG_SECURE (screenshot + recording + recent apps)
        await ScreenCapture.preventScreenCaptureAsync();
      }
    } catch (e) {
      console.warn("Screen protection enable error:", e);
    }
  }, [enabled]);

  const protectionDisabled = useCallback(async () => {
    if (!enabled) return;

    try {
      if (Platform.OS === "ios") {
        await ScreenCapture.disableAppSwitcherProtectionAsync();
      }

      if (Platform.OS === "android") {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    } catch (e) {
      console.warn("Screen protection disable error:", e);
    }
  }, [enabled]);

  /**
   * AppState based protection
   */
  useEffect(() => {
    if (!enabled) return;

    // iOS logic:
    // active → protection OFF
    // inactive/bg → protection ON (snapshot taken here)
    if (Platform.OS === "ios") {
      if (currentAppState === "active") {
        protectionDisabled();
      } else {
        protectionEnabled();
      }
    }

    // Android logic:
    // active → protection ON
    // a background → no need to toggle (safe)
    if (Platform.OS === "android") {
      if (currentAppState === "active") {
        protectionEnabled();
      }
    }

    return () => {
      // Cleanup: avoid FLAG_SECURE leak
      protectionDisabled();
    };
  }, [enabled, currentAppState, protectionEnabled, protectionDisabled]);
}
