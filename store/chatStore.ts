import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MessageDto } from "@/api/models";

interface ChatStore {
  messages: MessageDto[];
  setMessages: (messages: MessageDto[]) => void;
  sendMessage: (message: MessageDto) => void;
  updateMessageId: (tempId: string, newId: string) => void;
  deleteTempMessage: (tempId: string) => void;
  updateStatus: (messageId: string, status: string) => void;
  clearStore: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      setMessages: (messages: MessageDto[]) => set(() => ({ messages })),
      sendMessage: (message: MessageDto) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessageId: (tempId: string, newId: string) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.messageId === tempId
              ? {
                  ...msg,
                  messageId: newId,
                }
              : msg,
          ),
        })),
      deleteTempMessage: (tempId: string) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.messageId !== tempId),
        })),
      updateStatus: (messageId: string, status: string) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.messageId === messageId
              ? { ...msg, messageStatus: status as MessageDto["messageStatus"] }
              : msg,
          ),
        })),
      clearStore: () => set(() => ({ messages: [] })),
    }),
    {
      name: "chat-store",
    },
  ),
);
