import { NativeModule, requireNativeModule } from "expo";

import {
  ExpoTorModuleEvents,
  TorStartResponse,
  TorStopResponse,
} from "./ExpoTor.types";

declare class ExpoTorModule extends NativeModule<ExpoTorModuleEvents> {
  /**
   * Start the Tor service
   * @returns Promise with success status and message
   */
  startTor(): Promise<TorStartResponse>;

  /**
   * Stop the Tor service
   * @returns Promise with success status and message
   */
  stopTor(): Promise<TorStopResponse>;

  /**
   * Get current Tor status
   * @returns Current status string (OFF, ON, STARTING, STOPPING)
   */
  getTorStatus(): string;

  /**
   * Get SOCKS proxy port
   * @returns SOCKS port number or -1 if not available
   */
  getSocksPort(): number;

  /**
   * Get HTTP tunnel port
   * @returns HTTP tunnel port number or -1 if not available
   */
  getHttpTunnelPort(): number;

  /**
   * Get Tor information by key
   * @param key - The info key to query
   * @returns Promise with the requested information
   */
  getTorInfo(key: string): Promise<string>;

  /**
   * Check if Tor is connected
   * @returns true if Tor is connected, false otherwise
   */
  isTorConnected(): boolean;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoTorModule>("ExpoTor");
