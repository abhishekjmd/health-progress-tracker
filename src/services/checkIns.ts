import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn, CheckInInput, PendingCheckInMutation } from "@/interfaces/checkIn";
import { requestJson } from "@/services/api";

function cacheKey(userId: string): string {
  return `health-progress-check-ins:${userId}`;
}

function queueKey(userId: string): string {
  return `health-progress-pending-check-ins:${userId}`;
}

function jsonRequest(method: "POST" | "PATCH", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function fetchCheckIns(userId: string): Promise<CheckIn[]> {
  const checkIns = await requestJson<CheckIn[]>(
    `/checkIns?userId=${encodeURIComponent(userId)}`,
  );
  return checkIns.filter((checkIn) => checkIn.userId === userId);
}

export async function createRemoteCheckIn(
  userId: string,
  data: CheckInInput,
  timestamps?: { createdAt: string; updatedAt?: string },
): Promise<CheckIn> {
  const now = new Date().toISOString();
  return requestJson<CheckIn>(
    "/checkIns",
    jsonRequest("POST", {
      ...data,
      userId,
      createdAt: timestamps?.createdAt ?? now,
      updatedAt: timestamps?.updatedAt ?? now,
    }),
  );
}

export async function updateRemoteCheckIn(
  recordId: string,
  data: CheckInInput,
): Promise<CheckIn> {
  return requestJson<CheckIn>(
    `/checkIns/${encodeURIComponent(recordId)}`,
    jsonRequest("PATCH", { ...data, updatedAt: new Date().toISOString() }),
  );
}

export async function deleteRemoteCheckIn(recordId: string): Promise<void> {
  await requestJson<void>(`/checkIns/${encodeURIComponent(recordId)}`, { method: "DELETE" });
}

export async function readCachedCheckIns(userId: string): Promise<CheckIn[] | null> {
  try {
    const serialized = await AsyncStorage.getItem(cacheKey(userId));
    if (!serialized) return null;

    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return null;
    return value as CheckIn[];
  } catch {
    return null;
  }
}

export async function cacheCheckIns(userId: string, checkIns: CheckIn[]): Promise<void> {
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(checkIns));
}

export async function readPendingCheckInMutations(
  userId: string,
): Promise<PendingCheckInMutation[]> {
  try {
    const serialized = await AsyncStorage.getItem(queueKey(userId));
    if (!serialized) return [];
    const value: unknown = JSON.parse(serialized);
    return Array.isArray(value) ? (value as PendingCheckInMutation[]) : [];
  } catch {
    return [];
  }
}

export async function writePendingCheckInMutations(
  userId: string,
  mutations: PendingCheckInMutation[],
): Promise<void> {
  const key = queueKey(userId);
  if (mutations.length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(mutations));
}
