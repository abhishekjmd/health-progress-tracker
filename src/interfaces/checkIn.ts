export type CheckIn = {
  id: string;
  userId: string;
  weight: number;
  height: number;
  sleepDuration: number;
  dailySteps: number;
  waterIntake: number;
  mood: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
};

export type CheckInInput = Pick<
  CheckIn,
  "weight" | "height" | "sleepDuration" | "dailySteps" | "waterIntake" | "mood" | "notes"
>;

export type PendingCheckInMutation =
  | {
      kind: "create";
      clientId: string;
      checkIn: Omit<CheckIn, "id">;
    }
  | {
      kind: "update";
      recordId: string;
      data: CheckInInput;
    }
  | {
      kind: "delete";
      recordId: string;
    };

export type ProgressStatus = "improving" | "declining" | "unchanged";

export type HealthProgress = {
  currentWeight: number | null;
  startingWeight: number | null;
  weightChange: number | null;
  bmi: number | null;
  checkInCount: number;
  latestCheckInDate: string | null;
  status: ProgressStatus;
  sortedCheckIns: CheckIn[];
};

export type CheckInDraft = {
  weight: string;
  height: string;
  sleepDuration: string;
  dailySteps: string;
  waterIntake: string;
  mood: string;
  notes: string;
};

export type CheckInField = keyof CheckInDraft;
export type CheckInErrors = Partial<Record<CheckInField, string>>;
export type CheckInValidationResult = {
  values: CheckInInput | null;
  errors: CheckInErrors;
};

export type CheckInFormMode = "create" | "edit" | null;
export type CheckInLookupStatus = "loading" | "found" | "not-found" | "error";

export type CheckInTimestamps = { createdAt: string; updatedAt?: string };
