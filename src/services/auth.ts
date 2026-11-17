import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Session, User } from "@/interfaces/auth";
import { requestJson } from "@/services/api";

const SESSION_KEY = "health-progress-tracker-session";

function removePassword(user: User): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

async function readSession(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(SESSION_KEY);
  }
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeSession(session: Session): Promise<void> {
  const serialized = JSON.stringify(session);
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SESSION_KEY, serialized);
    }
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, serialized);
}

export async function login(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await requestJson<User[]>(
    `/users?email=${encodeURIComponent(normalizedEmail)}`,
  );
  const user = users.find(
    (candidate) =>
      candidate.email.trim().toLowerCase() === normalizedEmail &&
      candidate.password === password,
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const safeUser = removePassword(user);
  await writeSession({ user: safeUser });
  return safeUser;
}

export async function restoreSession(): Promise<User | null> {
  try {
    const stored = await readSession();
    if (!stored) return null;

    const session = JSON.parse(stored) as Session;
    if (!session.user?.id || !session.user.email) {
      await logout();
      return null;
    }
    return session.user;
  } catch {
    await logout();
    return null;
  }
}

export async function logout(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
