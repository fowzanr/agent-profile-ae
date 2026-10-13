export const REPORT_REASONS = [
  { value: "fake", label: "Fake profile or impersonation" },
  { value: "licence", label: "Wrong or invalid RERA / DED licence" },
  { value: "misleading", label: "Misleading listings or information" },
  { value: "spam", label: "Spam or scam" },
  { value: "abuse", label: "Harassment or inappropriate content" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REPORT_REASON_VALUES = REPORT_REASONS.map((r) => r.value) as [ReportReason, ...ReportReason[]];

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
