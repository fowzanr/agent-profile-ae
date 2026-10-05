export function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString("en-US")}`;
}

export function formatAEDCompact(amount: number): string {
  const trim = (n: number) => (Math.round(n * 10) / 10).toString();
  if (amount >= 1_000_000_000) return `AED ${trim(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `AED ${trim(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `AED ${trim(amount / 1_000)}K`;
  return formatAED(amount);
}

export const RENTAL_PERIODS = ["yearly", "monthly", "weekly", "daily"] as const;
export type RentalPeriod = (typeof RENTAL_PERIODS)[number];

const RENTAL_PERIOD_SUFFIX: Record<RentalPeriod, string> = {
  yearly: "/yr",
  monthly: "/mo",
  weekly: "/wk",
  daily: "/day",
};

const RENTAL_PERIOD_LABEL: Record<RentalPeriod, string> = {
  yearly: "Yearly",
  monthly: "Monthly",
  weekly: "Weekly",
  daily: "Daily",
};

export function rentalSuffix(period: string | null | undefined): string {
  return period && period in RENTAL_PERIOD_SUFFIX ? RENTAL_PERIOD_SUFFIX[period as RentalPeriod] : "/yr";
}

export function rentalLabel(period: string): string {
  return period in RENTAL_PERIOD_LABEL ? RENTAL_PERIOD_LABEL[period as RentalPeriod] : period;
}

export function csvToList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
