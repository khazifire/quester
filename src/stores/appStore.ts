import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  showAmounts: boolean;
  identityStatement: string;
  theme: "sage" | "dark" | "light";
  toggleAmounts: () => void;
  setIdentityStatement: (text: string) => void;
  setTheme: (theme: "sage" | "dark" | "light") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      showAmounts: true,
      identityStatement:
        "I am just a little human on planet earth, trying to survive",
      theme: "sage",
      toggleAmounts: () => set((s) => ({ showAmounts: !s.showAmounts })),
      setIdentityStatement: (text) => set({ identityStatement: text }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "questline-app",
      version: 1,
    }
  )
);
