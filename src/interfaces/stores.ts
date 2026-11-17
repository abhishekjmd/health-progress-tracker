import { CheckIn, CheckInInput } from "@/interfaces/checkIn";
import { User } from "@/interfaces/auth";

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  pendingRoute: string | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setPendingRoute: (route: string) => void;
  clearPendingRoute: () => void;
};

export type CheckInState = {
  userId: string | null;
  checkIns: CheckIn[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  getById: (userId: string, id: string) => Promise<CheckIn | null>;
  create: (userId: string, data: CheckInInput) => Promise<boolean>;
  update: (userId: string, id: string, data: CheckInInput) => Promise<boolean>;
  remove: (userId: string, id: string) => Promise<boolean>;
  syncPending: (userId: string) => Promise<void>;
  clear: () => void;
};

export type NetworkConnectionState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};
