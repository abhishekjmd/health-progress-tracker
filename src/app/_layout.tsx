import { Href, Stack, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthStore } from "@/stores/auth";

function RouteGuard() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hydrate = useAuthStore((state) => state.hydrate);
  const setPendingRoute = useAuthStore((state) => state.setPendingRoute);
  const clearPendingRoute = useAuthStore((state) => state.clearPendingRoute);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading) return;

    const isAppRoute = String(segments[0]) === "(app)";
    if (!user && isAppRoute && pathname !== "/login") {
      if (pathname === "/checkins" || /^\/checkin\/[^/]+$/.test(pathname)) {
        setPendingRoute(pathname);
      }
      router.replace("/login");
    } else if (user && !isAppRoute) {
      const pendingRoute = useAuthStore.getState().pendingRoute;
      const destination = getPostLoginDestination(pendingRoute);
      clearPendingRoute();
      router.replace(destination);
    }
  }, [user, isLoading, segments, pathname, router, setPendingRoute, clearPendingRoute]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function getPostLoginDestination(route: string | null): Href {
  if (route === "/checkins") return "/checkins";
  const checkInId = route?.match(/^\/checkin\/([^/]+)$/)?.[1];
  if (checkInId) {
    return { pathname: "/checkin/[id]", params: { id: checkInId } };
  }
  return "/";
}

export default function RootLayout() {
  return <RouteGuard />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
