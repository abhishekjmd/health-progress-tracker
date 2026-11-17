import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCheckInDate } from "@/domain/healthProgress";
import {
  CheckInCardActionProps,
  CheckInCardProps,
  CheckInMetricProps,
} from "@/interfaces/components";

export function CheckInCard({ checkIn, onView, onEdit, onDelete }: CheckInCardProps) {
  const date = formatCheckInDate(checkIn.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{date}</Text>
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

      <View style={styles.metrics}>
        <Metric label="Weight" value={`${checkIn.weight} kg`} />
        <Metric label="Height" value={`${checkIn.height} cm`} />
        <Metric label="Sleep" value={`${checkIn.sleepDuration} hr`} />
        <Metric label="Steps" value={checkIn.dailySteps.toLocaleString()} />
        <Metric label="Water" value={`${checkIn.waterIntake} L`} />
      </View>

      {!!checkIn.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{checkIn.notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Action label="View" accessibilityLabel={`View check-in from ${date}`} onPress={onView} />
        <Action label="Edit" accessibilityLabel={`Edit check-in from ${date}`} onPress={onEdit} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete check-in from ${date}`}
          onPress={onDelete}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ label, value }: CheckInMetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Action({
  label,
  accessibilityLabel,
  onPress,
}: CheckInCardActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not set";
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7EDF4",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  date: { color: "#172B4D", fontSize: 16, fontWeight: "700" },
  time: { color: "#98A2B3", fontSize: 11, marginTop: 3 },
  moodBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: "#E8F3FF" },
  moodBadgeText: { color: "#1265B3", fontSize: 12, fontWeight: "700" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "30%", minWidth: 82, paddingVertical: 2 },
  metricLabel: { color: "#7A8699", fontSize: 11 },
  metricValue: { color: "#344054", fontSize: 14, fontWeight: "600", marginTop: 4 },
  notes: { borderTopWidth: 1, borderTopColor: "#EEF1F5", marginTop: 14, paddingTop: 12 },
  notesLabel: { color: "#7A8699", fontSize: 11, fontWeight: "600" },
  notesText: { color: "#475467", fontSize: 13, lineHeight: 19, marginTop: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F5",
    marginTop: 14,
    paddingTop: 12,
  },
  action: { paddingVertical: 5, paddingHorizontal: 7 },
  actionText: { color: "#1675D1", fontSize: 13, fontWeight: "700" },
  deleteText: { color: "#B42318", fontSize: 13, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
