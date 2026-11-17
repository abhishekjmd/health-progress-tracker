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
