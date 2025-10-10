import type { StyleProp, ViewStyle } from "react-native";

export type OnLoadEventPayload = {
  url: string;
};

export type TorStatusPayload = {
  status: string;
};

export type TorConnectedPayload = {
  connected: boolean;
};

export type TorDisconnectedPayload = {
  connected: boolean;
};

export type TorErrorPayload = {
  error: string;
};

export type ExpoTorModuleEvents = {
  onTorStatus: (params: TorStatusPayload) => void;
  onTorConnected: (params: TorConnectedPayload) => void;
  onTorDisconnected: (params: TorDisconnectedPayload) => void;
  onTorError: (params: TorErrorPayload) => void;
};

export type TorStartResponse = {
  success: boolean;
  message: string;
};

export type TorStopResponse = {
  success: boolean;
  message: string;
};

export type ExpoTorViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
