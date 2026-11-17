import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type CheckInStateCardProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export function CheckInStateCard({ title, message, actionLabel, onAction, loading = false }: CheckInStateCardProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1675D1" size="large" />
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.message}>{message}</Text>
      {!!actionLabel && !!onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 250, alignItems: "center", justifyContent: "center", gap: 12 },
  card: { alignItems: "center", padding: 24, borderRadius: 18, borderWidth: 1, borderColor: "#E7EDF4", backgroundColor: "#FFFFFF" },
  title: { color: "#172B4D", fontSize: 18, fontWeight: "700", textAlign: "center" },
  message: { color: "#667085", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 7 },
  action: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 11, backgroundColor: "#1675D1", marginTop: 18 },
  actionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
