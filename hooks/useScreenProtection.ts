import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

export function useScreenProtection() {
  useEffect(() => {
    let isActive = true;

    if (Platform.OS === "ios") ScreenCapture.enableAppSwitcherProtectionAsync();

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && !isActive) {
        isActive = true;

        if (Platform.OS === "ios")
          await ScreenCapture.disableAppSwitcherProtectionAsync();
        await new Promise((res) => setTimeout(res, 100)); // küçük gecikme
        if (Platform.OS === "ios")
          await ScreenCapture.enableAppSwitcherProtectionAsync();
      } else if (state.match(/inactive|background/)) {
        isActive = false;
      }
    });

    return () => {
      sub.remove();
      if (Platform.OS === "ios")
        ScreenCapture.disableAppSwitcherProtectionAsync();
    };
  }, []);
}
