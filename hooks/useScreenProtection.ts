import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAppStore } from "@/store";

export function useScreenProtection() {
  const previousAppState = useAppStore((state) => state.previousAppState);
  const currentAppState = useAppStore((state) => state.currentAppState);

  let isActive = true;

  const initialize = async () => {
    if (Platform.OS === "ios") ScreenCapture.enableAppSwitcherProtectionAsync();

    if (currentAppState === "active" && !isActive) {
      isActive = true;
      if (Platform.OS === "ios")
        await ScreenCapture.disableAppSwitcherProtectionAsync();
      if (Platform.OS === "ios")
        await ScreenCapture.enableAppSwitcherProtectionAsync();
    } else if (currentAppState.match(/inactive|background/)) {
      isActive = false;
    }
  };

  useEffect(() => {
    initialize();

    return () => {
      if (Platform.OS === "ios")
        ScreenCapture.disableAppSwitcherProtectionAsync();
    };
  }, [previousAppState, currentAppState]);
}
