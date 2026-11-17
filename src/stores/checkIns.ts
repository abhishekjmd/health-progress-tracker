import { create } from "zustand";
import { CheckIn, CheckInInput, PendingCheckInMutation } from "@/interfaces/checkIn";
import { CheckInState } from "@/interfaces/stores";
import {
  cacheCheckIns,
  createRemoteCheckIn,
  deleteRemoteCheckIn,
  fetchCheckInById,
  fetchCheckIns,
  readCachedCheckIns,
  readPendingCheckInMutations,
  updateRemoteCheckIn,
  writePendingCheckInMutations,
} from "@/services/checkIns";
import { isNetworkError } from "@/services/api";

let requestSequence = 0;
const syncingUsers = new Set<string>();

function sortNewestFirst(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

function applyPendingMutations(
  checkIns: CheckIn[],
  mutations: PendingCheckInMutation[],
): CheckIn[] {
  let result = [...checkIns];
  for (const mutation of mutations) {
    if (mutation.kind === "create") {
      result = [
        ...result.filter((item) => item.id !== mutation.clientId),
        { ...mutation.checkIn, id: mutation.clientId },
      ];
    } else if (mutation.kind === "update") {
      result = result.map((item) =>
        item.id === mutation.recordId
          ? { ...item, ...mutation.data, updatedAt: new Date().toISOString() }
          : item,
      );
    } else {
      result = result.filter((item) => item.id !== mutation.recordId);
    }
  }
  return sortNewestFirst(result);
}

async function enqueueMutation(
  userId: string,
  mutation: PendingCheckInMutation,
): Promise<void> {
  const queue = await readPendingCheckInMutations(userId);

  if (mutation.kind === "create") {
    queue.push(mutation);
  } else if (mutation.kind === "update") {
    const pendingCreate = queue.find(
      (item) => item.kind === "create" && item.clientId === mutation.recordId,
    );
    if (pendingCreate?.kind === "create") {
      pendingCreate.checkIn = {
        ...pendingCreate.checkIn,
        ...mutation.data,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const pendingUpdate = queue.find(
        (item) => item.kind === "update" && item.recordId === mutation.recordId,
      );
      if (pendingUpdate?.kind === "update") {
        pendingUpdate.data = mutation.data;
      } else {
        queue.push(mutation);
      }
    }
  } else {
    const pendingCreateIndex = queue.findIndex(
      (item) => item.kind === "create" && item.clientId === mutation.recordId,
    );
    if (pendingCreateIndex >= 0) {
      queue.splice(pendingCreateIndex, 1);
    } else {
      const withoutUpdate = queue.filter(
        (item) => !(item.kind === "update" && item.recordId === mutation.recordId),
      );
      if (!withoutUpdate.some((item) => item.kind === "delete" && item.recordId === mutation.recordId)) {
        withoutUpdate.push(mutation);
      }
      await writePendingCheckInMutations(userId, withoutUpdate);
      return;
    }
  }

  await writePendingCheckInMutations(userId, queue);
}

function createLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
      set({ userId, checkIns: sortNewestFirst(cached), isLoading: false, isRefreshing: true });
    }

    await get().syncPending(userId);
    if (requestId !== requestSequence) return;
    const pendingMutations = await readPendingCheckInMutations(userId);
    const syncError = get().error;
    const syncIsOffline = get().isOffline;

    try {
      const checkIns = applyPendingMutations(
        await fetchCheckIns(userId),
        pendingMutations,
      );
      if (requestId !== requestSequence) return;

      try {
        await cacheCheckIns(userId, checkIns);
      } catch {
        // Keep successfully fetched health data visible if the cache is unavailable.
      }
      set({
        userId,
        checkIns,
        isLoading: false,
        isRefreshing: false,
        isOffline: pendingMutations.length > 0 && syncIsOffline,
        error:
          pendingMutations.length > 0
            ? syncError ?? "Some check-ins are waiting to sync."
            : null,
      });
    } catch (cause) {
      if (requestId !== requestSequence) return;
      const hasCachedData = cached !== null || hasCurrentUserData;
      set({
        userId,
        checkIns: applyPendingMutations(
          cached ?? (hasCurrentUserData ? current.checkIns : []),
          pendingMutations,
        ),
        isLoading: false,
        isRefreshing: false,
        isOffline: hasCachedData || isNetworkError(cause),
        error:
          cause instanceof Error
            ? cause.message
            : "Could not load check-ins. Please retry.",
      });
    }
  },

  async create(userId, data) {
    const original = get();
    const now = new Date().toISOString();
    const localCheckIn: CheckIn = {
      ...data,
      id: createLocalId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    const optimistic = sortNewestFirst([...original.checkIns, localCheckIn]);
    set({ userId, checkIns: optimistic, error: null });
    await cacheCheckIns(userId, optimistic);

    try {
      const saved = await createRemoteCheckIn(userId, data);
      const next = sortNewestFirst([
        ...get().checkIns.filter((item) => item.id !== localCheckIn.id),
        { ...saved, id: String(saved.id) },
      ]);
      set({ userId, checkIns: next, isOffline: false, error: null });
      try {
        await cacheCheckIns(userId, next);
      } catch {
        // The server save succeeded; keep the live data even if local caching fails.
      }
      return true;
    } catch (cause) {
      if (!isNetworkError(cause)) {
        set({ checkIns: original.checkIns });
        await cacheCheckIns(userId, original.checkIns);
        throw cause;
      }

      try {
        await enqueueMutation(userId, {
          kind: "create",
          clientId: localCheckIn.id,
          checkIn: {
            userId,
            ...data,
            createdAt: now,
            updatedAt: now,
          },
        });
      } catch {
        set({ checkIns: original.checkIns });
        await cacheCheckIns(userId, original.checkIns);
        throw new Error("Could not save this check-in on the device. Please try again.");
      }
      set({ isOffline: true, error: "Saved on this device. It will sync when you reconnect." });
      return false;
    }
  },

  async getById(userId, id) {
    const current = get();
    if (current.userId !== userId || current.isLoading) {
      await get().load(userId);
    }

    const cached = get().userId === userId
      ? get().checkIns.find((item) => item.id === id)
      : undefined;
    if (cached?.id.startsWith("local-")) return cached;

    let checkIn: CheckIn | null;
    try {
      checkIn = await fetchCheckInById(id, userId);
    } catch (error) {
      if (cached && isNetworkError(error)) return cached;
      throw error;
    }
    if (!checkIn) {
      if (cached) {
        const remaining = get().checkIns.filter((item) => item.id !== id);
        set({ checkIns: remaining });
        try {
          await cacheCheckIns(userId, remaining);
        } catch {
          // The detail is still treated as missing even if the stale cache cannot be cleared.
        }
      }
      return null;
    }

    const next = sortNewestFirst([
      ...get().checkIns.filter((item) => item.id !== id),
      checkIn,
    ]);
    set({ userId, checkIns: next });
    try {
      await cacheCheckIns(userId, next);
    } catch {
      // Keep the detail visible even if the local cache cannot be updated.
    }
    return checkIn;
  },

  async update(userId, id, data) {
    const original = get();
    const oldCheckIn = original.checkIns.find((item) => item.id === id);
    if (!oldCheckIn) throw new Error("This check-in is no longer available.");

    const updated: CheckIn = { ...oldCheckIn, ...data, updatedAt: new Date().toISOString() };
    const optimistic = sortNewestFirst(
      original.checkIns.map((item) => (item.id === id ? updated : item)),
    );
    set({ userId, checkIns: optimistic, error: null });
    await cacheCheckIns(userId, optimistic);

    const queue = await readPendingCheckInMutations(userId);
    const isPendingCreate = queue.some(
      (item) => item.kind === "create" && item.clientId === id,
    );
    if (isPendingCreate) {
      await enqueueMutation(userId, { kind: "update", recordId: id, data });
      set({ isOffline: true, error: "Saved on this device. It will sync when you reconnect." });
      return false;
    }

    const hasPendingUpdate = queue.some(
      (item) => item.kind === "update" && item.recordId === id,
    );
    if (hasPendingUpdate) {
      await enqueueMutation(userId, { kind: "update", recordId: id, data });
      await get().syncPending(userId);
      const remaining = await readPendingCheckInMutations(userId);
      return !remaining.some((item) => item.kind === "update" && item.recordId === id);
    }

    try {
      const saved = await updateRemoteCheckIn(id, data);
      const next = sortNewestFirst(
        get().checkIns.map((item) =>
          item.id === id ? { ...updated, ...saved, id: String(saved.id) } : item,
        ),
      );
      set({ userId, checkIns: next, isOffline: false, error: null });
      try {
        await cacheCheckIns(userId, next);
      } catch {
        // The server save succeeded; keep the live data even if local caching fails.
      }
      return true;
    } catch (cause) {
      if (!isNetworkError(cause)) {
        set({ checkIns: original.checkIns });
        await cacheCheckIns(userId, original.checkIns);
        throw cause;
      }
      await enqueueMutation(userId, { kind: "update", recordId: id, data });
      set({ isOffline: true, error: "Saved on this device. It will sync when you reconnect." });
      return false;
    }
  },

  async remove(userId, id) {
    const original = get();
    const oldCheckIn = original.checkIns.find((item) => item.id === id);
    if (!oldCheckIn) throw new Error("This check-in is no longer available.");

    const optimistic = original.checkIns.filter((item) => item.id !== id);
    set({ userId, checkIns: optimistic, error: null });
    await cacheCheckIns(userId, optimistic);

    const queue = await readPendingCheckInMutations(userId);
    const isPendingCreate = queue.some(
      (item) => item.kind === "create" && item.clientId === id,
    );
    if (isPendingCreate) {
      await enqueueMutation(userId, { kind: "delete", recordId: id });
      const remaining = await readPendingCheckInMutations(userId);
      set({
        isOffline: remaining.length > 0,
        error: remaining.length > 0 ? "Some check-ins are waiting to sync." : null,
      });
      return true;
    }

    const hasPendingUpdate = queue.some(
      (item) => item.kind === "update" && item.recordId === id,
    );
    if (hasPendingUpdate) {
      await enqueueMutation(userId, { kind: "delete", recordId: id });
      await get().syncPending(userId);
      const remaining = await readPendingCheckInMutations(userId);
      return !remaining.some((item) => item.kind === "delete" && item.recordId === id);
    }

    try {
      await deleteRemoteCheckIn(id);
      set({ isOffline: false, error: null });
      return true;
    } catch (cause) {
      if (!isNetworkError(cause)) {
        set({ checkIns: original.checkIns });
        await cacheCheckIns(userId, original.checkIns);
        throw cause;
      }
      await enqueueMutation(userId, { kind: "delete", recordId: id });
      set({ isOffline: true, error: "Deletion saved on this device and will sync when you reconnect." });
      return false;
    }
  },

  async syncPending(userId) {
    if (syncingUsers.has(userId)) return;
    syncingUsers.add(userId);
    try {
      const queue = await readPendingCheckInMutations(userId);
      while (queue.length > 0) {
        const mutation = queue[0];
        try {
          if (mutation.kind === "create") {
            const { userId: ownerId, createdAt, updatedAt, ...data } = mutation.checkIn;
            const saved = await createRemoteCheckIn(ownerId, data, { createdAt, updatedAt });
            const next = sortNewestFirst(
              get().checkIns.map((item) =>
                item.id === mutation.clientId ? { ...saved, id: String(saved.id) } : item,
              ),
            );
            set({ checkIns: next });
            try {
              await cacheCheckIns(userId, next);
            } catch {
              // A cache failure must not leave a synced create in the retry queue.
            }
          } else if (mutation.kind === "update") {
            const saved = await updateRemoteCheckIn(mutation.recordId, mutation.data);
            const next = sortNewestFirst(
              get().checkIns.map((item) =>
                item.id === mutation.recordId
                  ? { ...item, ...saved, id: String(saved.id) }
                  : item,
              ),
            );
            set({ checkIns: next });
            try {
              await cacheCheckIns(userId, next);
            } catch {
              // A cache failure must not leave a synced update in the retry queue.
            }
          } else {
            await deleteRemoteCheckIn(mutation.recordId);
            const next = get().checkIns.filter((item) => item.id !== mutation.recordId);
            set({ checkIns: next });
            try {
              await cacheCheckIns(userId, next);
            } catch {
              // A cache failure must not leave a synced delete in the retry queue.
            }
          }

          queue.shift();
          await writePendingCheckInMutations(userId, queue);
        } catch (cause) {
          set({
            isOffline: isNetworkError(cause),
            error:
              cause instanceof Error
                ? cause.message
                : "Pending check-ins could not be synced.",
          });
          return;
        }
      }
      if (get().userId === userId) set({ isOffline: false, error: null });
    } finally {
      syncingUsers.delete(userId);
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
