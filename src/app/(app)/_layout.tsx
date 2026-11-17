import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import AppTabs from "@/components/app-tabs";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useCheckInsStore } from "@/stores/checkIns";

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const syncPending = useCheckInsStore((state) => state.syncPending);

  useEffect(() => {
    if (!user?.id) return;

    const syncWhenConnected = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
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
      <AppTabs />
    </ThemeProvider>
  );
}
