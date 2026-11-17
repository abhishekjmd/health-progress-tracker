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
