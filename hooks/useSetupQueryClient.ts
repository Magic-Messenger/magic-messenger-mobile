import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, AppStateStatus } from "react-native";

export function useSetupReactQueryLifecycle() {
  /** APP FOREGROUND / BACKGROUND */
  AppState.addEventListener("change", (status: AppStateStatus) => {
    focusManager.setFocused(status === "active");
  });

  /** NETWORK STATUS */
  NetInfo.addEventListener((state) => {
    onlineManager.setOnline(
      Boolean(state.isConnected && state.isInternetReachable),
    );
  });
}
