import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { create } from "zustand";

import { createMagicHubClient, MagicHubClient } from "@/constants";

type TypingUser = {
  username: string;
  chatId: string;
};

type SignalRStore = {
  magicHubClient?: MagicHubClient;
  connection?: HubConnection;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: TypingUser[];
  currentRoute?: string;

  startConnection: (token: string) => Promise<void>;
  stopConnection: () => Promise<void>;
  addOnlineUser: (user: string) => void;
  setOnlineUsers: (users: string[]) => void;
  removeOnlineUser: (user: string) => void;
  startTyping: (chatId: string, user: string) => void;
  stopTyping: (chatId: string, user: string) => void;

  setCurrentRoute: (route: string) => void;
};

export const useSignalRStore = create<SignalRStore>((set, get) => ({
  isConnected: false,
  onlineUsers: [],
  typingUsers: [],
  currentRoute: undefined,
  receivedMessage: undefined,

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

  addOnlineUser: (user: string) => {
    set({ onlineUsers: [...get().onlineUsers, user] });
  },

  setOnlineUsers: (users: string[]) => {
    set({ onlineUsers: [...users] });
  },

  removeOnlineUser: (user: string) => {
    set({ onlineUsers: get().onlineUsers.filter((u) => u !== user) });
  },

  startTyping: (chatId: string, user: string) => {
    const existing = get().typingUsers.some(
      (u) => u.chatId === chatId && u.username === user,
    );
    if (!existing) {
      set({ typingUsers: [...get().typingUsers, { chatId, username: user }] });
    }
  },

  stopTyping: (chatId: string, user: string) => {
    set({
      typingUsers: get().typingUsers.filter(
        (u) => !(u.chatId === chatId && u.username === user),
      ),
    });
  },

  setCurrentRoute: (route: string) => {
    set({ currentRoute: route });
  },
}));
