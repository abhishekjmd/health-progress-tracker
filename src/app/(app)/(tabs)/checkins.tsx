import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
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
import { CheckInCard } from "@/components/CheckInCard";
import { CheckInForm } from "@/components/CheckInForm";
import { CheckInStateCard } from "@/components/CheckInStateCard";
import { CheckIn, CheckInInput } from "@/interfaces/checkIn";
import { useAuthStore } from "@/stores/auth";
import { useCheckInsStore } from "@/stores/checkIns";

type FormMode = "create" | "edit" | null;

export default function CheckInsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const storeUserId = useCheckInsStore((state) => state.userId);
  const storedCheckIns = useCheckInsStore((state) => state.checkIns);
  const isLoading = useCheckInsStore((state) => state.isLoading);
  const isRefreshing = useCheckInsStore((state) => state.isRefreshing);
  const isOffline = useCheckInsStore((state) => state.isOffline);
  const error = useCheckInsStore((state) => state.error);
  const load = useCheckInsStore((state) => state.load);
  const create = useCheckInsStore((state) => state.create);
  const update = useCheckInsStore((state) => state.update);
  const remove = useCheckInsStore((state) => state.remove);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CheckIn | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (user?.id && storeUserId !== user.id) void load(user.id);
  }, [user?.id, storeUserId, load]);

  const checkIns = storeUserId === user?.id ? storedCheckIns : [];
  const isWaitingForData = storeUserId !== user?.id || isLoading;

  function openCreateForm() {
    setSelectedCheckIn(null);
    setFormError("");
    setFormMode("create");
  }

  function openEditForm(checkIn: CheckIn) {
    setSelectedCheckIn(checkIn);
    setFormError("");
    setFormMode("edit");
  }

  async function handleSave(values: CheckInInput) {
    if (!user?.id || !formMode) return;
    setIsSaving(true);
    setFormError("");
    try {
      const synced =
        formMode === "create"
          ? await create(user.id, values)
          : selectedCheckIn
            ? await update(user.id, selectedCheckIn.id, values)
            : false;
      setFormMode(null);
      setActionError("");
      setActionMessage(
        synced
          ? formMode === "create"
            ? "Check-in saved."
            : "Changes saved."
          : "Saved on this device. It will sync when you reconnect.",
      );
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save this check-in.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!user?.id || !pendingDelete) return;
    setIsDeleting(true);
    try {
      const synced = await remove(user.id, pendingDelete.id);
      setPendingDelete(null);
      setActionError("");
      setActionMessage(
        synced
          ? "Check-in deleted."
          : "Deletion saved on this device and will sync when you reconnect.",
      );
    } catch (cause) {
      setPendingDelete(null);
      setActionMessage("");
      setActionError(cause instanceof Error ? cause.message : "Could not delete this check-in.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>YOUR HEALTH HISTORY</Text>
            <Text style={styles.title}>Check-ins</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateForm}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Text style={styles.addButtonIcon}>＋</Text>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {(actionMessage || actionError) && (
          <View style={[styles.feedbackBanner, actionError && styles.errorBanner]}>
            <Text style={[styles.feedbackText, actionError && styles.errorText]}>
              {actionError || actionMessage}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss message"
              onPress={() => {
                setActionMessage("");
                setActionError("");
              }}
              hitSlop={8}
            >
              <Text style={styles.dismissText}>×</Text>
            </Pressable>
          </View>
        )}

        {!!error && checkIns.length > 0 && (
          <View style={styles.offlineBanner}>
            <View style={styles.bannerCopy}>
              <Text style={styles.offlineTitle}>
                {isOffline ? "Saved locally" : "Sync needs attention"}
              </Text>
              <Text style={styles.offlineText}>{error}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isRefreshing}
              onPress={() => user?.id && void load(user.id)}
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

        {isWaitingForData ? (
          <CheckInStateCard loading message="Loading check-ins…" />
        ) : error && checkIns.length === 0 ? (
          <CheckInStateCard
            title="Couldn’t load check-ins"
            message={error}
            actionLabel="Retry"
            onAction={() => user?.id && void load(user.id)}
          />
        ) : checkIns.length === 0 ? (
          <CheckInStateCard
            title="Start your health history"
            message="Record weight, sleep, activity, hydration, mood, and notes in one check-in."
            actionLabel="Create your first check-in"
            onAction={openCreateForm}
          />
        ) : (
          <View style={styles.list}>
            <Text style={styles.listCaption}>
              {checkIns.length} {checkIns.length === 1 ? "check-in" : "check-ins"} · newest first
            </Text>
            {checkIns.map((checkIn) => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                onView={() =>
                  router.push({ pathname: "/checkin/[id]", params: { id: checkIn.id } })
                }
                onEdit={() => openEditForm(checkIn)}
                onDelete={() => setPendingDelete(checkIn)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          if (!isSaving) setFormMode(null);
        }}
        visible={formMode !== null}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.eyebrow}>{formMode === "edit" ? "UPDATE ENTRY" : "NEW ENTRY"}</Text>
              <Text style={styles.modalTitle}>
                {formMode === "edit" ? "Edit check-in" : "New check-in"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close check-in form"
              disabled={isSaving}
              onPress={() => setFormMode(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {formMode && (
            <CheckInForm
              key={`${formMode}-${selectedCheckIn?.id ?? "new"}`}
              checkIn={formMode === "edit" ? selectedCheckIn : null}
              busy={isSaving}
              error={formError}
              onCancel={() => setFormMode(null)}
              onSave={handleSave}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={pendingDelete !== null}
        onRequestClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete this check-in?</Text>
            <Text style={styles.confirmBody}>
              This entry will be removed from your health history.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setPendingDelete(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Keep it</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => void confirmDelete()}
                style={styles.deleteButton}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  content: {
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
    marginBottom: 20,
  },
  headerText: { flex: 1 },
  eyebrow: { color: "#1675D1", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: "#172B4D", fontSize: 28, fontWeight: "700", marginTop: 4 },
  addButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#1675D1",
  },
  addButtonIcon: { color: "#FFFFFF", fontSize: 20, lineHeight: 22 },
  addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  list: { gap: 12 },
  listCaption: { color: "#7A8699", fontSize: 12, marginBottom: 2 },
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
  },
  retryText: { color: "#1675D1", fontSize: 13, fontWeight: "700" },
  feedbackBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 12,
    borderRadius: 11,
    backgroundColor: "#E8F7EF",
  },
  errorBanner: { backgroundColor: "#FEECEB" },
  feedbackText: { flex: 1, color: "#16804A", fontSize: 13, lineHeight: 18 },
  errorText: { color: "#B42318" },
  dismissText: { color: "#667085", fontSize: 22, paddingLeft: 12 },
  modalSafeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EDF4",
  },
  modalTitleWrap: { gap: 4 },
  modalTitle: { color: "#172B4D", fontSize: 20, fontWeight: "700" },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F4F7FB",
  },
  closeText: { color: "#475467", fontSize: 25, lineHeight: 28 },
  confirmOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(16, 24, 40, 0.42)",
  },
  confirmCard: { padding: 20, borderRadius: 18, backgroundColor: "#FFFFFF" },
  confirmTitle: { color: "#172B4D", fontSize: 18, fontWeight: "700" },
  confirmBody: { color: "#667085", fontSize: 14, lineHeight: 20, marginTop: 8 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
  },
  cancelText: { color: "#344054", fontSize: 14, fontWeight: "600" },
  deleteButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#B42318",
  },
  deleteButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
