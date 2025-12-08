import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MessageDto } from "@/api/models";

interface Chat {
  id: string;
  messages: MessageDto[];
}

interface ChatStore {
  chats: Chat[];
  // Get messages for a specific chat
  getMessages: (chatId: string) => MessageDto[];
  // Set messages for a specific chat
  setMessages: (chatId: string, messages: MessageDto[]) => void;
  // Add a message to a specific chat
  sendMessage: (chatId: string, message: MessageDto) => void;
  // Update message ID for a specific chat
  updateMessageId: (chatId: string, tempId: string, newId: string) => void;
  // Delete temp message from a specific chat
  deleteTempMessage: (chatId: string, tempId: string) => void;
  // Update message status in a specific chat
  updateStatus: (chatId: string, messageId: string, status: string) => void;
  // Clear messages for a specific chat
  clearChat: (chatId: string) => void;
  // Clear all chats (for app close/logout)
  clearStore: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],

      getMessages: (chatId: string) => {
        const chat = get().chats.find((c) => c.id === chatId);
        return chat?.messages || [];
      },

      setMessages: (chatId: string, messages: MessageDto[]) =>
        set((state) => {
          const existingChatIndex = state.chats.findIndex(
            (c) => c.id === chatId,
          );
          if (existingChatIndex >= 0) {
            // Update existing chat
            const updatedChats = [...state.chats];
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              messages,
            };
            return { chats: updatedChats };
          } else {
            // Add new chat
            return { chats: [...state.chats, { id: chatId, messages }] };
          }
        }),

      sendMessage: (chatId: string, message: MessageDto) =>
        set((state) => {
          const existingChatIndex = state.chats.findIndex(
            (c) => c.id === chatId,
          );
          if (existingChatIndex >= 0) {
            const updatedChats = [...state.chats];
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              messages: [...updatedChats[existingChatIndex].messages, message],
            };
            return { chats: updatedChats };
          } else {
            return {
              chats: [...state.chats, { id: chatId, messages: [message] }],
            };
          }
        }),

      updateMessageId: (chatId: string, tempId: string, newId: string) =>
        set((state) => {
          const existingChatIndex = state.chats.findIndex(
            (c) => c.id === chatId,
          );
          if (existingChatIndex < 0) return state;

          const updatedChats = [...state.chats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            messages: updatedChats[existingChatIndex].messages.map((msg) =>
              msg.messageId === tempId ? { ...msg, messageId: newId } : msg,
            ),
          };
          return { chats: updatedChats };
        }),

      deleteTempMessage: (chatId: string, tempId: string) =>
        set((state) => {
          const existingChatIndex = state.chats.findIndex(
            (c) => c.id === chatId,
          );
          if (existingChatIndex < 0) return state;

          const updatedChats = [...state.chats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            messages: updatedChats[existingChatIndex].messages.filter(
              (msg) => msg.messageId !== tempId,
            ),
          };
          return { chats: updatedChats };
        }),

      updateStatus: (chatId: string, messageId: string, status: string) =>
        set((state) => {
          const existingChatIndex = state.chats.findIndex(
            (c) => c.id === chatId,
          );
          if (existingChatIndex < 0) return state;

          const updatedChats = [...state.chats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            messages: updatedChats[existingChatIndex].messages.map((msg) =>
              msg.messageId === messageId
                ? {
                    ...msg,
                    messageStatus: status as MessageDto["messageStatus"],
                  }
                : msg,
            ),
          };
          return { chats: updatedChats };
        }),

      clearChat: (chatId: string) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== chatId),
        })),

      clearStore: () => set(() => ({ chats: [] })),
    }),
    {
      name: "chat-store",
    },
  ),
);

// Custom hook to get messages for a specific chat with proper reactivity
const emptyMessages: MessageDto[] = [];
export const useChatMessages = (chatId: string | null): MessageDto[] => {
  return useChatStore((state) => {
    if (!chatId) return emptyMessages;
    const chat = state.chats.find((c) => c.id === chatId);
    return chat?.messages || emptyMessages;
  });
};
