import { create } from "zustand";

import { ContactDto } from "@/api/models";

interface AppStore {
  participants: ContactDto[];
  setParticipants: (participants: ContactDto) => void;
  clearParticipants: () => void;
  removeParticipant: (username: string) => void;
}

export const useGroupChatCreateStore = create<AppStore>()((set) => ({
  participants: [],
  setParticipants: (participants: ContactDto) =>
    set((state) => ({
      participants: [...(state?.participants ?? []), participants],
    })),
  clearParticipants: () => set(() => ({ participants: [] })),
  removeParticipant: (username: string) =>
    set((state) => ({
      participants: state?.participants?.filter(
        (p) => p.contactUsername !== username,
      ),
    })),
}));
