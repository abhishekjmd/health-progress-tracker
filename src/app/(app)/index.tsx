import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { calculateHealthProgress, formatCheckInDate } from "@/domain/healthProgress";
import { useAuth } from "@/providers/AuthProvider";
import { useCheckInsStore } from "@/stores/checkIns";

const statusStyles = {
  improving: {
    title: "Improving",
    icon: "↘",
    color: "#16804A",
    background: "#E8F7EF",
  },
  declining: {
    title: "Declining",
    icon: "↗",
    color: "#B54708",
    background: "#FFF4E5",
  },
  unchanged: {
    title: "Unchanged",
    icon: "→",
    color: "#475467",
    background: "#F0F2F5",
  },
} as const;

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const storeUserId = useCheckInsStore((state) => state.userId);
  const storedCheckIns = useCheckInsStore((state) => state.checkIns);
  const isLoading = useCheckInsStore((state) => state.isLoading);
  const isRefreshing = useCheckInsStore((state) => state.isRefreshing);
  const isOffline = useCheckInsStore((state) => state.isOffline);
  const error = useCheckInsStore((state) => state.error);
  const loadCheckIns = useCheckInsStore((state) => state.load);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (user?.id) void loadCheckIns(user.id);
  }, [user?.id, loadCheckIns]);

  const checkIns = storeUserId === user?.id ? storedCheckIns : [];
  const waitingForCurrentUser = storeUserId !== user?.id || isLoading;
  const progress = useMemo(() => calculateHealthProgress(checkIns), [checkIns]);
  const status =
    progress.checkInCount < 2
      ? { ...statusStyles.unchanged, title: "Building baseline" }
      : statusStyles[progress.status];

  async function handleSignOut() {
    setIsSigningOut(true);
    setLogoutError("");
    try {
      await signOut();
    } catch {
      setLogoutError("Could not log out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  const progressDescription =
    progress.status === "improving" && progress.weightChange !== null
      ? `Weight is down ${Math.abs(progress.weightChange).toFixed(1)} kg since your first check-in.`
      : progress.status === "declining" && progress.weightChange !== null
        ? `Weight is up ${progress.weightChange.toFixed(1)} kg since your first check-in.`
        : progress.checkInCount < 2
          ? "Add another check-in to see how your weight is changing over time."
          : "Your weight is unchanged since your first check-in.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>HEALTH PROGRESS</Text>
            <Text style={styles.title}>Hi{user?.name ? `, ${user.name}` : " there"}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#1675D1" size="small" />
            ) : (
              <Text style={styles.logoutText}>Log out</Text>
            )}
          </Pressable>
        </View>

        {!!logoutError && <Text style={styles.logoutError}>{logoutError}</Text>}

        {waitingForCurrentUser ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#1675D1" size="large" />
            <Text style={styles.loadingText}>Loading your health data…</Text>
          </View>
        ) : error && checkIns.length === 0 ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Couldn’t load your dashboard</Text>
            <Text style={styles.messageBody}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => user?.id && void loadCheckIns(user.id)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : checkIns.length === 0 ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Your progress starts here</Text>
            <Text style={styles.messageBody}>
              You don’t have any health check-ins yet. Add your first check-in to see your
              dashboard and weight trend.
            </Text>
            {isOffline && !!error && <Text style={styles.offlineText}>{error}</Text>}
          </View>
        ) : (
          <>
            {!!error && (
              <View style={styles.offlineBanner}>
                <View style={styles.bannerCopy}>
                  <Text style={styles.offlineTitle}>
                    {isOffline ? "Showing saved data offline" : "Sync needs attention"}
                  </Text>
                  <Text style={styles.offlineText}>{error}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading dashboard data"
                  disabled={isRefreshing}
                  onPress={() => user?.id && void loadCheckIns(user.id)}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                >
                  {isRefreshing ? (
                    <ActivityIndicator color="#1675D1" size="small" />
                  ) : (
                    <Text style={styles.retryText}>Retry</Text>
                  )}
                </Pressable>
              </View>
            )}

            <View style={[styles.progressCard, { backgroundColor: status.background }]}>
              <View style={[styles.statusIcon, { backgroundColor: "#FFFFFF" }]}>
                <Text style={[styles.statusIconText, { color: status.color }]}>{status.icon}</Text>
              </View>
              <View style={styles.statusCopy}>
                <Text style={[styles.statusTitle, { color: status.color }]}>
                  {status.title}
                </Text>
                <Text style={styles.statusDescription}>{progressDescription}</Text>
              </View>
              <Text style={styles.basedOnText}>WEIGHT TREND</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your overview</Text>
              {isRefreshing && <ActivityIndicator color="#1675D1" size="small" />}
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                label="Current weight"
                value={formatWeight(progress.currentWeight)}
                detail="Latest check-in"
              />
              <MetricCard
                label="Starting weight"
                value={formatWeight(progress.startingWeight)}
                detail="First check-in"
              />
              <MetricCard
                label="Weight change"
                value={formatWeightChange(progress.weightChange)}
                detail="Since you started"
                valueColor={
                  progress.status === "improving"
                    ? "#16804A"
                    : progress.status === "declining"
                      ? "#B54708"
                      : "#172B4D"
                }
              />
              <MetricCard
                label="BMI"
                value={progress.bmi === null ? "—" : progress.bmi.toFixed(1)}
                detail="Based on latest height"
              />
              <MetricCard
                label="Check-ins"
                value={String(progress.checkInCount)}
                detail="Total recorded"
              />
              <MetricCard
                label="Latest check-in"
                value={formatCheckInDate(progress.latestCheckInDate)}
                detail="Most recent entry"
              />
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeading}>
                <View>
                  <Text style={styles.chartTitle}>Weight trend</Text>
                  <Text style={styles.chartSubtitle}>Your recorded weight over time</Text>
                </View>
                <Text style={styles.chartUnit}>kg</Text>
              </View>
              {progress.sortedCheckIns.length >= 2 ? (
                <WeightTrendChart checkIns={progress.sortedCheckIns} />
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.chartEmptyText}>
                    Add another check-in to see your trend.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  valueColor?: string;
};

function MetricCard({ label, value, detail, valueColor = "#172B4D" }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.metricValue, { color: valueColor }]}>
        {value}
      </Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function formatWeight(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)} kg`;
}

function formatWeightChange(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "0.0 kg";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)} kg`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  scrollContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  headerCopy: { flexShrink: 1, paddingRight: 12 },
  eyebrow: {
    color: "#1675D1",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  title: { color: "#172B4D", fontSize: 27, fontWeight: "700" },
  logoutButton: {
    minWidth: 72,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE4EE",
  },
  logoutText: { color: "#344054", fontSize: 13, fontWeight: "600" },
  logoutError: { color: "#B42318", marginBottom: 12, fontSize: 13 },
  pressed: { opacity: 0.75 },
  loadingState: {
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#667085", fontSize: 14 },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E7EDF4",
  },
  messageTitle: { color: "#172B4D", fontSize: 18, fontWeight: "700" },
  messageBody: { color: "#667085", fontSize: 14, lineHeight: 21, marginTop: 8 },
  primaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1675D1",
    paddingHorizontal: 18,
    borderRadius: 11,
    alignSelf: "flex-start",
    marginTop: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F3D69B",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
    gap: 12,
  },
  bannerCopy: { flex: 1 },
  offlineTitle: { color: "#7A4B00", fontSize: 13, fontWeight: "700" },
  offlineText: { color: "#8A5A00", fontSize: 12, lineHeight: 17, marginTop: 3 },
  retryButton: {
    minWidth: 55,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    paddingHorizontal: 9,
  },
  retryText: { color: "#1675D1", fontSize: 13, fontWeight: "700" },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  statusIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statusIconText: { fontSize: 23, fontWeight: "700" },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: "700" },
  statusDescription: { color: "#475467", fontSize: 12, lineHeight: 17, marginTop: 3 },
  basedOnText: { color: "#667085", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: "#172B4D", fontSize: 18, fontWeight: "700" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 135,
    minHeight: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EDF4",
    padding: 14,
  },
  metricLabel: { color: "#667085", fontSize: 12, fontWeight: "500" },
  metricValue: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  metricDetail: { color: "#98A2B3", fontSize: 11, marginTop: 4 },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF4",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  chartHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  chartTitle: { color: "#172B4D", fontSize: 16, fontWeight: "700" },
  chartSubtitle: { color: "#7A8699", fontSize: 12, marginTop: 4 },
  chartUnit: { color: "#667085", fontSize: 12, fontWeight: "600" },
  chartEmpty: { height: 120, justifyContent: "center", alignItems: "center" },
  chartEmptyText: { color: "#7A8699", fontSize: 13, textAlign: "center" },
});
