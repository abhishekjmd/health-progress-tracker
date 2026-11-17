import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckInForm } from "@/components/CheckInForm";
import { formatCheckInDate } from "@/domain/healthProgress";
import { CheckInInput } from "@/interfaces/checkIn";
import { useAuthStore } from "@/stores/auth";
import { useCheckInsStore } from "@/stores/checkIns";

type LookupStatus = "loading" | "found" | "not-found" | "error";

export default function CheckInDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const storedCheckIns = useCheckInsStore((state) => state.checkIns);
  const storeUserId = useCheckInsStore((state) => state.userId);
  const getById = useCheckInsStore((state) => state.getById);
  const update = useCheckInsStore((state) => state.update);
  const remove = useCheckInsStore((state) => state.remove);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("loading");
  const [lookupError, setLookupError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!id || !user?.id) {
      setLookupStatus("not-found");
      return;
    }

    let isActive = true;
    setLookupStatus("loading");
    setLookupError("");
    getById(user.id, id)
      .then((checkIn) => {
        if (isActive) setLookupStatus(checkIn ? "found" : "not-found");
      })
      .catch((cause) => {
        if (!isActive) return;
        setLookupError(cause instanceof Error ? cause.message : "Could not load this check-in.");
        setLookupStatus("error");
      });

    return () => {
      isActive = false;
    };
  }, [getById, id, retryCount, user?.id]);

  const checkIn =
    storeUserId === user?.id ? storedCheckIns.find((item) => item.id === id) ?? null : null;

  async function handleSave(values: CheckInInput) {
    if (!user?.id || !id) return;
    setIsSaving(true);
    setFormError("");
    try {
      const synced = await update(user.id, id, values);
      setIsFormVisible(false);
      setActionError("");
      setActionMessage(
        synced ? "Check-in changes saved." : "Saved on this device. It will sync when you reconnect.",
      );
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save these changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!user?.id || !id) return;
    setIsDeleting(true);
    try {
      await remove(user.id, id);
      setIsDeleteVisible(false);
      router.replace("/checkins");
    } catch (cause) {
      setIsDeleteVisible(false);
      setActionError(cause instanceof Error ? cause.message : "Could not delete this check-in.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/checkins")}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>‹  Check-ins</Text>
        </Pressable>

        {lookupStatus === "loading" ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#1675D1" size="large" />
            <Text style={styles.stateBody}>Loading check-in…</Text>
          </View>
        ) : lookupStatus === "error" ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Couldn’t load this check-in</Text>
            <Text style={styles.stateBody}>{lookupError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRetryCount((count) => count + 1)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : lookupStatus === "not-found" || !checkIn ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Check-in not found</Text>
            <Text style={styles.stateBody}>
              This check-in may have been removed or may not belong to this account.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/checkins")}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Back to check-ins</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>HEALTH CHECK-IN</Text>
                <Text style={styles.title}>{formatCheckInDate(checkIn.createdAt)}</Text>
                <Text style={styles.time}>
                  {new Date(checkIn.createdAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.moodBadge}>
                <Text style={styles.moodBadgeText}>{capitalize(checkIn.mood)}</Text>
              </View>
            </View>

            {!!actionMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{actionMessage}</Text>
                <Pressable onPress={() => setActionMessage("")} hitSlop={8}>
                  <Text style={styles.dismissText}>×</Text>
                </Pressable>
              </View>
            )}
            {!!actionError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{actionError}</Text>
              </View>
            )}

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Measurements</Text>
              <View style={styles.metricGrid}>
                <Metric label="Weight" value={`${checkIn.weight} kg`} />
                <Metric label="Height" value={`${checkIn.height} cm`} />
                <Metric label="Sleep duration" value={`${checkIn.sleepDuration} hours`} />
                <Metric label="Daily steps" value={checkIn.dailySteps.toLocaleString()} />
                <Metric label="Water intake" value={`${checkIn.waterIntake} liters`} />
                <Metric label="Mood" value={capitalize(checkIn.mood)} />
              </View>
              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>
                  {checkIn.notes?.trim() || "No notes for this check-in."}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFormError("");
                  setIsFormVisible(true);
                }}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <Text style={styles.editButtonText}>Edit check-in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsDeleteVisible(true)}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        visible={isFormVisible}
        onRequestClose={() => {
          if (!isSaving) setIsFormVisible(false);
        }}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>UPDATE ENTRY</Text>
              <Text style={styles.modalTitle}>Edit check-in</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close check-in form"
              disabled={isSaving}
              onPress={() => setIsFormVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {checkIn && (
            <CheckInForm
              key={checkIn.id}
              checkIn={checkIn}
              busy={isSaving}
              error={formError}
              onCancel={() => setIsFormVisible(false)}
              onSave={handleSave}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isDeleteVisible}
        onRequestClose={() => {
          if (!isDeleting) setIsDeleteVisible(false);
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.stateTitle}>Delete this check-in?</Text>
            <Text style={styles.stateBody}>This entry will be removed from your health history.</Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setIsDeleteVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Keep it</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => void handleDelete()}
                style={styles.confirmDeleteButton}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not set";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
  },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, paddingRight: 12, marginBottom: 18 },
  backText: { color: "#1675D1", fontSize: 14, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerText: { flexShrink: 1, paddingRight: 10 },
  eyebrow: { color: "#1675D1", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: "#172B4D", fontSize: 25, fontWeight: "700", marginTop: 5 },
  time: { color: "#7A8699", fontSize: 13, marginTop: 4 },
  moodBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 15, backgroundColor: "#E8F3FF" },
  moodBadgeText: { color: "#1265B3", fontSize: 12, fontWeight: "700" },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF4",
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: { color: "#172B4D", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  metric: { width: "46%", minWidth: 130, paddingVertical: 3 },
  metricLabel: { color: "#7A8699", fontSize: 12 },
  metricValue: { color: "#344054", fontSize: 15, fontWeight: "600", marginTop: 5 },
  notesBlock: { borderTopWidth: 1, borderTopColor: "#EEF1F5", marginTop: 18, paddingTop: 14 },
  notesLabel: { color: "#7A8699", fontSize: 12, fontWeight: "600" },
  notesText: { color: "#475467", fontSize: 14, lineHeight: 21, marginTop: 5 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  editButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#1675D1",
  },
  editButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  deleteButton: {
    minWidth: 96,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1C5C1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
  },
  deleteButtonText: { color: "#B42318", fontSize: 14, fontWeight: "600" },
  stateCard: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7EDF4",
    backgroundColor: "#FFFFFF",
  },
  stateTitle: { color: "#172B4D", fontSize: 18, fontWeight: "700", textAlign: "center" },
  stateBody: { color: "#667085", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8 },
  primaryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#1675D1",
    marginTop: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  modalSafeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EDF4",
  },
  modalTitle: { color: "#172B4D", fontSize: 20, fontWeight: "700", marginTop: 3 },
  closeButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "#F4F7FB" },
  closeText: { color: "#475467", fontSize: 25, lineHeight: 28 },
  confirmOverlay: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(16, 24, 40, 0.42)" },
  confirmCard: { padding: 20, borderRadius: 18, backgroundColor: "#FFFFFF" },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelButton: { flex: 1, minHeight: 46, justifyContent: "center", alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "#D0D5DD" },
  cancelText: { color: "#344054", fontSize: 14, fontWeight: "600" },
  confirmDeleteButton: { flex: 1, minHeight: 46, justifyContent: "center", alignItems: "center", borderRadius: 11, backgroundColor: "#B42318" },
  confirmDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  successBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, marginBottom: 12, borderRadius: 11, backgroundColor: "#E8F7EF" },
  successText: { flex: 1, color: "#16804A", fontSize: 13 },
  dismissText: { color: "#667085", fontSize: 22, paddingLeft: 12 },
  errorBanner: { padding: 12, marginBottom: 12, borderRadius: 11, backgroundColor: "#FEECEB" },
  errorText: { color: "#B42318", fontSize: 13, lineHeight: 18 },
});
