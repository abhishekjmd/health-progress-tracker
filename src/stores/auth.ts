import { create } from "zustand";
import { User } from "@/interfaces/auth";
import {
  login as loginRequest,
  logout as clearSession,
  restoreSession,
} from "@/services/auth";
import { useCheckInsStore } from "@/stores/checkIns";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let hydrationSequence = 0;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  async hydrate() {
    const requestId = ++hydrationSequence;
    set({ isLoading: true });
    let savedUser: User | null = null;
    try {
      savedUser = await restoreSession();
    } catch {
      savedUser = null;
    }
    if (requestId === hydrationSequence) {
      set({ user: savedUser, isLoading: false });
    }
  },

  async signIn(email, password) {
    const signedInUser = await loginRequest(email, password);
    set({ user: signedInUser });
  },

  async signOut() {
    await clearSession();
    useCheckInsStore.getState().clear();
    set({ user: null });
  },
}));
