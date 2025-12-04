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

export type TorFileData = {
  uri: string;
  name: string;
  type: string;
};

export type TorRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
  headers?: Record<string, string>;
  body?: string;
  formData?: Record<string, string | TorFileData>;
};

export type TorRequestResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  url: string;
};

export type ExpoTorViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
