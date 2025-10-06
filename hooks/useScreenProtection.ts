import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { AppState } from "react-native";

export function useScreenProtection() {
  useEffect(() => {
    let isActive = true;

    // Uygulama açıldığında etkinleştir
    ScreenCapture.enableAppSwitcherProtectionAsync();

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && !isActive) {
        isActive = true;

        // Arka plandan dönünce blur resetle
        await ScreenCapture.disableAppSwitcherProtectionAsync();
        await new Promise((res) => setTimeout(res, 100)); // küçük gecikme
        await ScreenCapture.enableAppSwitcherProtectionAsync();
      } else if (state.match(/inactive|background/)) {
        isActive = false;
      }
    });

    return () => {
      sub.remove();
      ScreenCapture.disableAppSwitcherProtectionAsync();
    };
  }, []);
}
