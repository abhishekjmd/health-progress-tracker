import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn } from "@/interfaces/checkIn";
import { requestJson } from "@/services/api";

function cacheKey(userId: string): string {
  return `health-progress-check-ins:${userId}`;
}

export async function fetchCheckIns(userId: string): Promise<CheckIn[]> {
  const checkIns = await requestJson<CheckIn[]>(
    `/checkIns?userId=${encodeURIComponent(userId)}`,
  );
  return checkIns.filter((checkIn) => checkIn.userId === userId);
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
