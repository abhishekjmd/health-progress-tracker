import { CheckInDraft, CheckInErrors, CheckInInput, CheckInValidationResult } from "@/interfaces/checkIn";

export const MOOD_OPTIONS = ["excellent", "good", "okay", "low", "poor"] as const;

export function validateCheckIn(draft: CheckInDraft): CheckInValidationResult {
  const errors: CheckInErrors = {};
  const weight = Number(draft.weight);
  const height = Number(draft.height);
  const sleepDuration = Number(draft.sleepDuration);
  const dailySteps = Number(draft.dailySteps);
  const waterIntake = Number(draft.waterIntake);

  if (!draft.weight.trim() || !Number.isFinite(weight) || weight <= 0 || weight > 500) {
    errors.weight = "Enter a weight greater than 0 and at most 500 kg.";
  }
  if (!draft.height.trim() || !Number.isFinite(height) || height < 50 || height > 250) {
    errors.height = "Enter a height between 50 and 250 cm.";
  }
  if (
    !draft.sleepDuration.trim() ||
    !Number.isFinite(sleepDuration) ||
    sleepDuration < 0 ||
    sleepDuration > 24
  ) {
    errors.sleepDuration = "Enter sleep duration from 0 to 24 hours.";
  }
  if (
    !draft.dailySteps.trim() ||
    !Number.isInteger(dailySteps) ||
    dailySteps < 0 ||
    dailySteps > 200000
  ) {
    errors.dailySteps = "Enter a whole number of steps from 0 to 200,000.";
  }
  if (!draft.waterIntake.trim() || !Number.isFinite(waterIntake) || waterIntake < 0 || waterIntake > 20) {
    errors.waterIntake = "Enter water intake from 0 to 20 liters.";
  }
  if (!MOOD_OPTIONS.some((mood) => mood === draft.mood)) {
    errors.mood = "Choose a mood.";
  }
  if (draft.notes.length > 500) {
    errors.notes = "Notes must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) return { values: null, errors };
  return {
    values: {
      weight,
      height,
      sleepDuration,
      dailySteps,
      waterIntake,
      mood: draft.mood,
      notes: draft.notes.trim(),
    },
    errors,
  };
}
