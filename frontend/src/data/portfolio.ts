import type { TimeRange } from "@/types";

const points: Record<TimeRange, number> = { "7D": 7, "30D": 15, "90D": 18, "1Y": 12 };

const labelFor = (range: TimeRange, i: number, n: number) => {
  if (range === "7D") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ?? "";
  if (range === "1Y")
    return (
      ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][i] ?? ""
    );
  const days = range === "30D" ? 30 : 90;
  return `D${Math.round(((i + 1) / n) * days)}`;
};

const wave = (i: number, base: number, amp: number, drift: number) =>
  Math.round(base + drift * i + amp * Math.sin(i * 1.1) + amp * 0.4 * Math.cos(i * 2.3));

export const revenueSeries = (range: TimeRange) => {
  const n = points[range];
  return Array.from({ length: n }, (_, i) => ({
    label: labelFor(range, i, n),
    revenue: wave(i, 420, 90, 48),
    fees: wave(i, 38, 9, 4),
  }));
};

export const userGrowthSeries = (range: TimeRange) => {
  const n = points[range];
  return Array.from({ length: n }, (_, i) => ({
    label: labelFor(range, i, n),
    users: wave(i, 780, 60, 96),
    subscriptions: wave(i, 320, 40, 52),
  }));
};

export const tokenUsageSeries = (range: TimeRange) => {
  const n = points[range];
  return Array.from({ length: n }, (_, i) => ({
    label: labelFor(range, i, n),
    tokens: wave(i, 120, 34, 11),
  }));
};

export const modelEarnings = [
  { label: "VisionPro", value: 7820 },
  { label: "CodeGen", value: 2430 },
  { label: "TextAI", value: 2232 },
];

export const planSplit = [
  { label: "Monthly", value: 1684 },
  { label: "Yearly", value: 658 },
];

export const ratingDistribution = [
  { label: "5★", value: 268 },
  { label: "4★", value: 112 },
  { label: "3★", value: 31 },
  { label: "2★", value: 11 },
  { label: "1★", value: 6 },
];

export const sentiment = [
  { label: "Positive", value: 78 },
  { label: "Neutral", value: 15 },
  { label: "Negative", value: 7 },
];
