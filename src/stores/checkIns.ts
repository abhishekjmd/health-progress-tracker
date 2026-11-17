import { create } from "zustand";
import { CheckIn } from "@/interfaces/checkIn";
import {
  cacheCheckIns,
  fetchCheckIns,
  readCachedCheckIns,
} from "@/services/checkIns";

type CheckInState = {
  userId: string | null;
  checkIns: CheckIn[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  clear: () => void;
};

let requestSequence = 0;

export const useCheckInsStore = create<CheckInState>((set, get) => ({
  userId: null,
  checkIns: [],
  isLoading: false,
  isRefreshing: false,
  isOffline: false,
  error: null,

  async load(userId) {
    const requestId = ++requestSequence;
    const current = get();
    const hasCurrentUserData = current.userId === userId && current.checkIns.length > 0;
    set({
      userId,
      checkIns: current.userId === userId ? current.checkIns : [],
      isLoading: !hasCurrentUserData,
      isRefreshing: hasCurrentUserData,
      isOffline: false,
      error: null,
    });

    const cached = await readCachedCheckIns(userId);
    if (requestId !== requestSequence) return;

    if (cached !== null) {
      set({
        userId,
        checkIns: cached,
        isLoading: false,
        isRefreshing: true,
      });
    }

    try {
      const checkIns = await fetchCheckIns(userId);
      if (requestId !== requestSequence) return;

      try {
        await cacheCheckIns(userId, checkIns);
      } catch {
        // A cache write failure should not hide data that was fetched successfully.
      }
      set({
        userId,
        checkIns,
        isLoading: false,
        isRefreshing: false,
        isOffline: false,
        error: null,
      });
    } catch (cause) {
      if (requestId !== requestSequence) return;
      const hasCachedData = cached !== null || hasCurrentUserData;
      set({
        userId,
        checkIns: cached ?? (hasCurrentUserData ? current.checkIns : []),
        isLoading: false,
        isRefreshing: false,
        isOffline: hasCachedData,
        error:
          cause instanceof Error
            ? cause.message
            : "Could not load check-ins. Please retry.",
      });
    }
  },

  clear() {
    requestSequence += 1;
    set({
      userId: null,
      checkIns: [],
      isLoading: false,
      isRefreshing: false,
      isOffline: false,
      error: null,
    });
  },
}));
