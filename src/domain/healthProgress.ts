import { CheckIn, HealthProgress } from "@/interfaces/checkIn";

function timestamp(checkIn: CheckIn): number {
  const parsed = Date.parse(checkIn.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateHealthProgress(checkIns: CheckIn[]): HealthProgress {
  const sortedCheckIns = [...checkIns].sort((a, b) => timestamp(a) - timestamp(b));
  const starting = sortedCheckIns[0];
  const current = sortedCheckIns[sortedCheckIns.length - 1];
  const currentWeight = current?.weight ?? null;
  const startingWeight = starting?.weight ?? null;
  const weightChange =
    currentWeight !== null && startingWeight !== null && sortedCheckIns.length > 1
      ? currentWeight - startingWeight
      : null;
  const heightInMeters = current ? current.height / 100 : 0;
  const rawBmi =
    currentWeight !== null && heightInMeters > 0
      ? currentWeight / (heightInMeters * heightInMeters)
      : null;
  const latestDate = current && Number.isFinite(Date.parse(current.createdAt))
    ? current.createdAt
    : null;

  return {
    currentWeight,
    startingWeight,
    weightChange,
    bmi: rawBmi === null ? null : Math.round(rawBmi * 10) / 10,
    checkInCount: sortedCheckIns.length,
    latestCheckInDate: latestDate,
    status:
      weightChange === null || weightChange === 0
        ? "unchanged"
        : weightChange < 0
          ? "improving"
          : "declining",
    sortedCheckIns,
  };
}

export function formatCheckInDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
