import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const SecureStoreStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error("SecureStore getItem error:", e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error("SecureStore setItem error:", e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error("SecureStore removeItem error:", e);
    }
  },
};

export interface NoteDto {
  id?: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  cipherText: string;
  nonce: string;
}

interface NoteStore {
  notes: NoteDto[];
  sortType: "asc" | "desc";
  setSortType: (type: "asc" | "desc") => void;
  getNoteById?: (id: string) => NoteDto | undefined;
  addNote: (note: NoteDto) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updatedNote: Partial<NoteDto>) => void;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set) => ({
      notes: [],
      sortType: "desc",
      setSortType: (type: "asc" | "desc") => set(() => ({ sortType: type })),
      addNote: (note: NoteDto) =>
        set((state) => ({ notes: [...state.notes, note] })),
      deleteNote: (id: string) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      updateNote: (id: string, updatedNote: Partial<NoteDto>) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updatedNote } : note,
          ),
        })),
    }),
    {
      name: "note-store",
      storage: createJSONStorage(() => SecureStoreStorage),
    },
  ),
);
