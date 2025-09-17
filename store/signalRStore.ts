import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { create } from "zustand";

import { createMagicHubClient, MagicHubClient } from "@/constants";

type SignalRStore = {
  magicHubClient?: MagicHubClient;
  connection?: HubConnection;
  isConnected: boolean;
  startConnection: (token: string) => Promise<void>;
  stopConnection: () => Promise<void>;
};

export const useSignalRStore = create<SignalRStore>((set, get) => ({
  isConnected: false,

  startConnection: async (token: string) => {
    if (get().connection) return;

    const connection = new HubConnectionBuilder()
      .withUrl(process.env.EXPO_PUBLIC_API_URL + "/hub/magic-app", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.onclose(() =>
      set({ isConnected: false, connection: undefined }),
    );
    connection.onreconnected(() => set({ isConnected: true }));
    connection.onreconnecting(() => set({ isConnected: false }));

    try {
      await connection.start();
      set({
        connection,
        isConnected: true,
        magicHubClient: createMagicHubClient(connection),
      });
    } catch (err) {
      console.error("SignalR connection is not started: ", err);
    }
  },

  stopConnection: async () => {
    const conn = get().connection;
    if (conn) {
      await conn.stop();
      set({ connection: undefined, isConnected: false });
    }
  },
}));
