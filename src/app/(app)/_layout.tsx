import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { useCheckInsStore } from "@/stores/checkIns";
import { NetworkConnectionState } from "@/interfaces/stores";

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const syncPending = useCheckInsStore((state) => state.syncPending);

  useEffect(() => {
    if (!user?.id) return;

    const syncWhenConnected = (state: NetworkConnectionState) => {
      if (
        state.isConnected &&
        state.isInternetReachable !== false &&
        useCheckInsStore.getState().userId === user.id
      ) {
        void syncPending(user.id);
      }
    };

    void NetInfo.fetch().then(syncWhenConnected);
    return NetInfo.addEventListener(syncWhenConnected);
  }, [user?.id, syncPending]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkin/[id]" />
      </Stack>
    </ThemeProvider>
  );
}
