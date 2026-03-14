import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  subHours,
  subMonths,
} from "date-fns";
import { he } from "date-fns/locale";
import { EMPTY_MICRONUTRIENTS, MICRONUTRIENT_KEYS } from "./nutrition-utils";
import type { DailyAggregations, DailyLog } from "../store";

export type DashboardPeriod = "daily" | "weekly" | "monthly";
export type NavigationDirection = "previous" | "next";

export interface PeriodDetails {
  mode: DashboardPeriod;
  referenceDate: Date;
  startDate: Date;
  endDate: Date;
  startKey: string;
  endKey: string;
  dayKeys: string[];
  label: string;
  caption: string;
  isCurrentPeriod: boolean;
}

export interface PeriodDaySummary {
  dayKey: string;
  date: Date;
  log: DailyLog | null;
  aggregations: DailyAggregations;
  mealsCount: number;
}

export interface AggregatedPeriodData {
  aggregations: DailyAggregations;
  days: PeriodDaySummary[];
  loggedDays: number;
  totalMeals: number;
}

const WEEK_STARTS_ON = 0;
const HISTORY_MONTH_WINDOW = 2;

export function createEmptyAggregations(): DailyAggregations {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    micronutrients: { ...EMPTY_MICRONUTRIENTS },
  };
}

export function getLogicalDate(date: Date = new Date()): Date {
  const logicalDate = subHours(date, 3);

  return new Date(
    logicalDate.getFullYear(),
    logicalDate.getMonth(),
    logicalDate.getDate(),
    12,
    0,
    0,
    0,
  );
}

export function formatDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dayKeyToDate(dayKey: string): Date {
  return parseISO(`${dayKey}T12:00:00`);
}

export function getHistoryWindow(now: Date = new Date()) {
  const latest = getLogicalDate(now);
  const earliest = getLogicalDate(subMonths(latest, HISTORY_MONTH_WINDOW));

  return {
    earliest,
    latest,
  };
}

export function clampToHistoryWindow(date: Date, now: Date = new Date()): Date {
  const normalizedDate = getLogicalDate(date);
  const { earliest, latest } = getHistoryWindow(now);

  if (isBefore(normalizedDate, earliest)) {
    return earliest;
  }

  if (isAfter(normalizedDate, latest)) {
    return latest;
  }

  return normalizedDate;
}

export function shiftReferenceDate(
  referenceDate: Date,
  mode: DashboardPeriod,
  direction: NavigationDirection,
  now: Date = new Date(),
): Date {
  const normalizedDate = clampToHistoryWindow(referenceDate, now);
  const amount = direction === "previous" ? -1 : 1;

  if (mode === "daily") {
    return clampToHistoryWindow(addDays(normalizedDate, amount), now);
  }

  if (mode === "weekly") {
    return clampToHistoryWindow(addDays(normalizedDate, amount * 7), now);
  }

  return clampToHistoryWindow(addMonths(normalizedDate, amount), now);
}

export function canShiftReferenceDate(
  referenceDate: Date,
  mode: DashboardPeriod,
  direction: NavigationDirection,
  now: Date = new Date(),
): boolean {
  const normalizedDate = clampToHistoryWindow(referenceDate, now);
  const shiftedDate = shiftReferenceDate(normalizedDate, mode, direction, now);

  return formatDayKey(shiftedDate) !== formatDayKey(normalizedDate);
}

function formatPeriodLabel(
  mode: DashboardPeriod,
  referenceDate: Date,
  startDate: Date,
  endDate: Date,
): string {
  if (mode === "daily") {
    return format(referenceDate, "EEEE, d בMMMM", { locale: he });
  }

  if (mode === "weekly") {
    return `${format(startDate, "d MMM", { locale: he })} - ${format(
      endDate,
      "d MMM yyyy",
      {
        locale: he,
      },
    )}`;
  }

  return format(referenceDate, "MMMM yyyy", { locale: he });
}

function formatPeriodCaption(
  mode: DashboardPeriod,
  startDate: Date,
  endDate: Date,
  isCurrentPeriod: boolean,
): string {
  if (mode === "daily") {
    return isCurrentPeriod ? "היום הלוגי הפעיל" : "יום שנשמר בהיסטוריה";
  }

  if (mode === "weekly") {
    return isCurrentPeriod
      ? "מהתחלת השבוע ועד היום"
      : `שבוע מלא בין ${format(startDate, "d/M")} ל-${format(endDate, "d/M")}`;
  }

  return isCurrentPeriod
    ? "מהתחלת החודש ועד היום"
    : `חודש מלא עד ${format(endDate, "d/M/yyyy")}`;
}

export function getPeriodDetails(
  mode: DashboardPeriod,
  referenceDate: Date,
  now: Date = new Date(),
): PeriodDetails {
  const normalizedReferenceDate = clampToHistoryWindow(referenceDate, now);
  const { earliest, latest } = getHistoryWindow(now);

  let startDate = normalizedReferenceDate;
  let endDate = normalizedReferenceDate;
  let isCurrentPeriod =
    formatDayKey(normalizedReferenceDate) === formatDayKey(latest);

  if (mode === "weekly") {
    startDate = startOfWeek(normalizedReferenceDate, {
      weekStartsOn: WEEK_STARTS_ON,
    });
    endDate = endOfWeek(normalizedReferenceDate, {
      weekStartsOn: WEEK_STARTS_ON,
    });
    isCurrentPeriod = isSameWeek(normalizedReferenceDate, latest, {
      weekStartsOn: WEEK_STARTS_ON,
    });
  }

  if (mode === "monthly") {
    startDate = startOfMonth(normalizedReferenceDate);
    endDate = endOfMonth(normalizedReferenceDate);
    isCurrentPeriod = isSameMonth(normalizedReferenceDate, latest);
  }

  if (isBefore(startDate, earliest)) {
    startDate = earliest;
  }

  if (isAfter(endDate, latest) || isCurrentPeriod) {
    endDate = latest;
  }

  const dayKeys = eachDayOfInterval({
    start: startDate,
    end: endDate,
  }).map((day) => formatDayKey(day));

  return {
    mode,
    referenceDate: normalizedReferenceDate,
    startDate,
    endDate,
    startKey: formatDayKey(startDate),
    endKey: formatDayKey(endDate),
    dayKeys,
    label: formatPeriodLabel(mode, normalizedReferenceDate, startDate, endDate),
    caption: formatPeriodCaption(mode, startDate, endDate, isCurrentPeriod),
    isCurrentPeriod,
  };
}

export function aggregatePeriodLogs(
  dailyLogs: Record<string, DailyLog>,
  period: PeriodDetails,
): AggregatedPeriodData {
  const totals = createEmptyAggregations();
  let loggedDays = 0;
  let totalMeals = 0;

  const days = [...period.dayKeys].reverse().map((dayKey) => {
    const log = dailyLogs[dayKey] ?? null;
    const dayAggregations = log?.aggregations ?? createEmptyAggregations();

    if (log) {
      loggedDays += 1;
      totalMeals += log.meals.length;
      totals.calories += dayAggregations.calories;
      totals.protein += dayAggregations.protein;
      totals.carbs += dayAggregations.carbs;
      totals.fat += dayAggregations.fat;

      MICRONUTRIENT_KEYS.forEach((key) => {
        totals.micronutrients[key] += dayAggregations.micronutrients[key];
      });
    }

    return {
      dayKey,
      date: dayKeyToDate(dayKey),
      log,
      aggregations: dayAggregations,
      mealsCount: log?.meals.length ?? 0,
    };
  });

  return {
    aggregations: totals,
    days,
    loggedDays,
    totalMeals,
  };
}
