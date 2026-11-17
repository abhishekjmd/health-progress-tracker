import { create } from "zustand";
import { User } from "@/interfaces/auth";
import { AuthState } from "@/interfaces/stores";
import {
  login as loginRequest,
  logout as clearSession,
  register as registerRequest,
  restoreSession,
} from "@/services/auth";
import { useCheckInsStore } from "@/stores/checkIns";

let hydrationSequence = 0;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  pendingRoute: null,

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

  async signUp(name, email, password) {
    const signedUpUser = await registerRequest(name, email, password);
    set({ user: signedUpUser });
  },

  async signOut() {
    await clearSession();
    useCheckInsStore.getState().clear();
    set({ user: null, pendingRoute: null });
  },

  setPendingRoute(route) {
    set({ pendingRoute: route });
  },

  clearPendingRoute() {
    set({ pendingRoute: null });
  },
}));
