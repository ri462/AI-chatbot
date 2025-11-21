// @/tailStore.ts
import { create } from "zustand";

interface TailState {
  tail: string;
  setTail: (tail: string) => void;
}

export const useTailStore = create<TailState>((set) => ({
  tail: "", // デフォルトの語尾
  setTail: (tail) => set({ tail }),
}));
