import { CheckIn, CheckInInput } from "@/interfaces/checkIn";

export type CheckInCardProps = {
  checkIn: CheckIn;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export type CheckInFormProps = {
  checkIn: CheckIn | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (values: CheckInInput) => Promise<void>;
};

export type CheckInFieldProps = {
  label: string;
  value: string;
  error?: string;
  keyboardType: "decimal-pad" | "number-pad";
  onChangeText: (value: string) => void;
};

export type CheckInStateCardProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export type WeightTrendChartProps = { checkIns: CheckIn[] };

export type CheckInMetricProps = { label: string; value: string };

export type CheckInCardActionProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export type DashboardMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  valueColor?: string;
};
