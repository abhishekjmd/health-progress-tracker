import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CheckIn, CheckInInput } from "@/interfaces/checkIn";
import {
  CheckInDraft,
  CheckInErrors,
  MOOD_OPTIONS,
  validateCheckIn,
} from "@/domain/checkInValidation";

type Props = {
  checkIn: CheckIn | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (values: CheckInInput) => Promise<void>;
};

function toDraft(checkIn: CheckIn | null): CheckInDraft {
  return {
    weight: checkIn ? String(checkIn.weight) : "",
    height: checkIn ? String(checkIn.height) : "",
    sleepDuration: checkIn ? String(checkIn.sleepDuration) : "",
    dailySteps: checkIn ? String(checkIn.dailySteps) : "",
    waterIntake: checkIn ? String(checkIn.waterIntake) : "",
    mood: checkIn?.mood ?? "",
    notes: checkIn?.notes ?? "",
  };
}

export function CheckInForm({ checkIn, busy, error, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState(() => toDraft(checkIn));
  const [errors, setErrors] = useState<CheckInErrors>({});

  function updateField(field: keyof CheckInDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    const result = validateCheckIn(draft);
    setErrors(result.errors);
    if (!result.values || busy) return;
    await onSave(result.values);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Add the details from today. You can update or remove this entry later.
        </Text>

        <View style={styles.fieldsRow}>
          <Field
            label="Weight (kg)"
            value={draft.weight}
            error={errors.weight}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateField("weight", value)}
          />
          <Field
            label="Height (cm)"
            value={draft.height}
            error={errors.height}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateField("height", value)}
          />
        </View>

        <View style={styles.fieldsRow}>
          <Field
            label="Sleep (hours)"
            value={draft.sleepDuration}
            error={errors.sleepDuration}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateField("sleepDuration", value)}
          />
          <Field
            label="Daily steps"
            value={draft.dailySteps}
            error={errors.dailySteps}
            keyboardType="number-pad"
            onChangeText={(value) => updateField("dailySteps", value)}
          />
        </View>

        <Field
          label="Water intake (liters)"
          value={draft.waterIntake}
          error={errors.waterIntake}
          keyboardType="decimal-pad"
          onChangeText={(value) => updateField("waterIntake", value)}
        />

        <View style={styles.moodSection}>
          <Text style={styles.label}>Mood</Text>
          <View style={styles.moods}>
            {MOOD_OPTIONS.map((mood) => {
              const selected = draft.mood === mood;
              return (
                <Pressable
                  key={mood}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => updateField("mood", mood)}
                  style={[styles.moodChip, selected && styles.moodChipSelected]}
                >
                  <Text style={[styles.moodText, selected && styles.moodTextSelected]}>
                    {capitalize(mood)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!!errors.mood && <Text style={styles.fieldError}>{errors.mood}</Text>}
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            accessibilityLabel="Notes"
            multiline
            maxLength={500}
            onChangeText={(value) => updateField("notes", value)}
            placeholder="Anything you want to remember about today?"
            placeholderTextColor="#98A2B3"
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={draft.notes}
          />
          <View style={styles.notesMeta}>
            {!!errors.notes && <Text style={styles.fieldError}>{errors.notes}</Text>}
            <Text style={styles.characterCount}>{draft.notes.length}/500</Text>
          </View>
        </View>

        {!!error && <Text accessibilityLiveRegion="polite" style={styles.submitError}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handleSave()}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveText}>{checkIn ? "Save changes" : "Save check-in"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  error?: string;
  keyboardType: "decimal-pad" | "number-pad";
  onChangeText: (value: string) => void;
};

function Field({ label, value, error, keyboardType, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="#98A2B3"
        style={[styles.input, !!error && styles.inputError]}
        value={value}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 36, gap: 16 },
  intro: { color: "#667085", fontSize: 14, lineHeight: 21, marginBottom: 2 },
  fieldsRow: { flexDirection: "row", gap: 12 },
  field: { flex: 1, minWidth: 0 },
  label: { color: "#344054", fontSize: 13, fontWeight: "600", marginBottom: 7 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    paddingHorizontal: 12,
    color: "#172B4D",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
  },
  inputError: { borderColor: "#D92D20" },
  fieldError: { color: "#B42318", fontSize: 11, lineHeight: 15, marginTop: 5 },
  moodSection: { gap: 2 },
  moods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 20,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
  },
  moodChipSelected: { borderColor: "#1675D1", backgroundColor: "#E8F3FF" },
  moodText: { color: "#475467", fontSize: 13, fontWeight: "500" },
  moodTextSelected: { color: "#1265B3", fontWeight: "700" },
  notesSection: { gap: 7 },
  notesInput: { minHeight: 96, paddingTop: 12 },
  notesMeta: { flexDirection: "row", justifyContent: "space-between" },
  characterCount: { color: "#98A2B3", fontSize: 11, marginLeft: "auto" },
  submitError: { color: "#B42318", fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
  },
  cancelText: { color: "#344054", fontSize: 14, fontWeight: "600" },
  saveButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1675D1",
    paddingHorizontal: 10,
  },
  saveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
