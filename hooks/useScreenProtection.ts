import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { Platform } from "react-native";
import { CaptureProtection } from "react-native-capture-protection";

type Options = {
  enabled?: boolean;
};

export function useScreenProtection({ enabled = true }: Options = {}) {
  /** 🔐 IOS — REAL SCREEN BLOCK */
  useEffect(() => {
    if (!enabled || Platform.OS !== "ios") return;

    CaptureProtection.prevent();

    return () => {
      CaptureProtection.allow();
    };
  }, [enabled]);

  /** 🔐 ANDROID — FLAG_SECURE */
  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;

    ScreenCapture.preventScreenCaptureAsync();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [enabled]);
}
