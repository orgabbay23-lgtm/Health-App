import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  ActivityLevel,
  EMPTY_MICRONUTRIENTS,
  MICRONUTRIENT_KEYS,
  MicronutrientTotals,
  NutritionProfileInput,
  NutritionSafetyAlert,
  NutritionTargets,
  addMicronutrients,
  calculateNutritionTargets,
  diffSafetyAlerts,
  evaluateMicronutrientSafety,
  normalizeMicronutrients,
  subtractMicronutrients,
} from "../utils/nutrition-utils";

type MealSourceType = "food" | "supplement";

export const MAX_USERS = 5;
export const USER_ACCENT_TOKENS = [
  "sun",
  "sky",
  "mint",
  "rose",
  "slate",
] as const;

export type UserAccentToken = (typeof USER_ACCENT_TOKENS)[number];

export interface UserProfile extends NutritionProfileInput {
  targets: NutritionTargets;
}

export interface MealItem {
  id: string;
  timestamp: string;
  meal_name: string;
  calories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  micronutrients: MicronutrientTotals;
  confidence_score?: number;
  sourceType?: MealSourceType;
}

export interface SavedMeal {
  id: string;
  savedAt: string;
  signature: string;
  meal: MealItem;
}

export interface DailyAggregations {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients: MicronutrientTotals;
}

export interface DailyLog {
  meals: MealItem[];
  aggregations: DailyAggregations;
}

export interface UserData {
  id: string;
  name: string;
  accent: UserAccentToken;
  createdAt: string;
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  savedMeals: SavedMeal[];
}

export interface CreateUserInput {
  name: string;
  accent?: UserAccentToken;
}

export interface CreateUserResult {
  ok: boolean;
  id?: string;
  reason?: "limit" | "invalid";
}

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  users: Record<string, UserData>;
  activeUserId: string | null;
  selectUser: (userId: string | null) => void;
  createUser: (input: CreateUserInput) => CreateUserResult;
  updateActiveUserIdentity: (
    details: Partial<Pick<UserData, "name" | "accent">>,
  ) => void;

  setUserProfile: (profile: NutritionProfileInput) => void;
  updateProfileDetails: (details: Partial<NutritionProfileInput>) => void;

  addMealLog: (dayKey: string, meal: MealItem) => NutritionSafetyAlert[];
  removeMealLog: (dayKey: string, mealId: string) => void;

  saveMealAsFavorite: (meal: MealItem) => boolean;
  removeSavedMeal: (savedMealId: string) => void;
  addSavedMealToDay: (
    dayKey: string,
    savedMealId: string,
  ) => NutritionSafetyAlert[];
}

interface PersistedAppStateV4 {
  users?: Record<string, Partial<UserData>> | null;
  activeUserId?: string | null;
}

interface PersistedLegacyAppState {
  userProfile?: Partial<UserProfile> | null;
  dailyLogs?: Record<string, Partial<DailyLog>> | null;
  savedMeals?: Partial<SavedMeal>[] | null;
}

const VALID_ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toRoundedNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 10) / 10;
}

function normalizeActivityLevel(value: unknown): ActivityLevel {
  return VALID_ACTIVITY_LEVELS.includes(value as ActivityLevel)
    ? (value as ActivityLevel)
    : "sedentary";
}

function normalizeGender(value: unknown): NutritionProfileInput["gender"] {
  return value === "female" ? "female" : "male";
}

function buildUserProfile(profile: NutritionProfileInput): UserProfile {
  // Ensure targets are only recalculated when profile data changes
  return {
    ...profile,
    targets: calculateNutritionTargets(profile),
  };
}

function normalizeUserProfile(
  profile: Partial<UserProfile> | null | undefined,
): UserProfile | null {
  if (!profile) {
    return null;
  }

  return buildUserProfile({
    age: toFiniteNumber(profile.age, 30),
    gender: normalizeGender(profile.gender),
    height: toFiniteNumber(profile.height, 170),
    weight: toFiniteNumber(profile.weight, 70),
    activityLevel: normalizeActivityLevel(profile.activityLevel),
    goalDeficit: toFiniteNumber(profile.goalDeficit, 500),
    isSmoker: Boolean(profile.isSmoker),
  });
}

function normalizeMealItem(meal: Partial<MealItem>): MealItem {
  return {
    id: String(meal.id ?? crypto.randomUUID()),
    timestamp:
      typeof meal.timestamp === "string"
        ? meal.timestamp
        : new Date().toISOString(),
    meal_name: typeof meal.meal_name === "string" ? meal.meal_name : "Meal",
    calories: toFiniteNumber(meal.calories, 0),
    macronutrients: {
      protein: toFiniteNumber(meal.macronutrients?.protein, 0),
      carbs: toFiniteNumber(meal.macronutrients?.carbs, 0),
      fat: toFiniteNumber(meal.macronutrients?.fat, 0),
    },
    micronutrients: normalizeMicronutrients(meal.micronutrients),
    confidence_score:
      meal.confidence_score === undefined
        ? undefined
        : toFiniteNumber(meal.confidence_score, 0),
    sourceType: meal.sourceType === "supplement" ? "supplement" : "food",
  };
}

export function createMealSignature(meal: Partial<MealItem>): string {
  const normalizedMeal = normalizeMealItem(meal);

  return [
    normalizedMeal.meal_name.trim().toLowerCase(),
    toRoundedNumber(normalizedMeal.calories),
    toRoundedNumber(normalizedMeal.macronutrients.protein),
    toRoundedNumber(normalizedMeal.macronutrients.carbs),
    toRoundedNumber(normalizedMeal.macronutrients.fat),
    normalizedMeal.sourceType ?? "food",
    ...MICRONUTRIENT_KEYS.map((key) =>
      toRoundedNumber(normalizedMeal.micronutrients[key]),
    ),
  ].join("|");
}

function normalizeSavedMeal(savedMeal: Partial<SavedMeal>): SavedMeal {
  const meal = normalizeMealItem(savedMeal.meal ?? {});

  return {
    id: String(savedMeal.id ?? crypto.randomUUID()),
    savedAt:
      typeof savedMeal.savedAt === "string"
        ? savedMeal.savedAt
        : new Date().toISOString(),
    signature:
      typeof savedMeal.signature === "string"
        ? savedMeal.signature
        : createMealSignature(meal),
    meal,
  };
}

function normalizeSavedMeals(
  savedMeals: Partial<SavedMeal>[] | null | undefined,
): SavedMeal[] {
  const seenSignatures = new Set<string>();

  return (savedMeals ?? []).reduce<SavedMeal[]>((acc, savedMeal) => {
    const normalizedSavedMeal = normalizeSavedMeal(savedMeal);
    if (seenSignatures.has(normalizedSavedMeal.signature)) {
      return acc;
    }

    seenSignatures.add(normalizedSavedMeal.signature);
    acc.push(normalizedSavedMeal);
    return acc;
  }, []);
}

function createEmptyDailyLog(): DailyLog {
  return {
    meals: [],
    aggregations: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      micronutrients: { ...EMPTY_MICRONUTRIENTS },
    },
  };
}

function aggregateMeals(meals: MealItem[]): DailyAggregations {
  return meals.reduce<DailyAggregations>(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.macronutrients.protein,
      carbs: acc.carbs + meal.macronutrients.carbs,
      fat: acc.fat + meal.macronutrients.fat,
      micronutrients: addMicronutrients(
        acc.micronutrients,
        meal.micronutrients,
      ),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      micronutrients: { ...EMPTY_MICRONUTRIENTS },
    },
  );
}

function normalizeDailyLogs(
  dailyLogs: Record<string, Partial<DailyLog>> | null | undefined,
): Record<string, DailyLog> {
  return Object.entries(dailyLogs ?? {}).reduce<Record<string, DailyLog>>(
    (acc, [dayKey, log]) => {
      const meals = Array.isArray(log?.meals)
        ? log.meals.map((meal) => normalizeMealItem(meal))
        : [];

      acc[dayKey] = {
        meals,
        aggregations: aggregateMeals(meals),
      };

      return acc;
    },
    {},
  );
}

function getSupplementalMagnesium(meals: MealItem[]): number {
  return meals.reduce((total, meal) => {
    if (meal.sourceType !== "supplement") {
      return total;
    }

    return total + meal.micronutrients.magnesium;
  }, 0);
}

function appendMealToDailyLogs(
  dailyLogs: Record<string, DailyLog>,
  userProfile: UserProfile | null,
  dayKey: string,
  meal: MealItem,
): {
  dailyLogs: Record<string, DailyLog>;
  alerts: NutritionSafetyAlert[];
} {
  const currentLog = dailyLogs[dayKey] ?? createEmptyDailyLog();
  const normalizedMeal = normalizeMealItem(meal);
  const nextMeals = [...currentLog.meals, normalizedMeal];
  const nextAggregations: DailyAggregations = {
    calories: currentLog.aggregations.calories + normalizedMeal.calories,
    protein:
      currentLog.aggregations.protein + normalizedMeal.macronutrients.protein,
    carbs: currentLog.aggregations.carbs + normalizedMeal.macronutrients.carbs,
    fat: currentLog.aggregations.fat + normalizedMeal.macronutrients.fat,
    micronutrients: addMicronutrients(
      currentLog.aggregations.micronutrients,
      normalizedMeal.micronutrients,
    ),
  };

  let alerts: NutritionSafetyAlert[] = [];

  if (userProfile) {
    const previousAlerts = evaluateMicronutrientSafety(
      currentLog.aggregations.micronutrients,
      userProfile,
      {
        supplementalMagnesium: getSupplementalMagnesium(currentLog.meals),
      },
    );
    const nextAlerts = evaluateMicronutrientSafety(
      nextAggregations.micronutrients,
      userProfile,
      {
        supplementalMagnesium: getSupplementalMagnesium(nextMeals),
      },
    );

    alerts = diffSafetyAlerts(previousAlerts, nextAlerts);
  }

  return {
    alerts,
    dailyLogs: {
      ...dailyLogs,
      [dayKey]: {
        meals: nextMeals,
        aggregations: nextAggregations,
      },
    },
  };
}

function normalizeAccent(value: unknown, fallbackIndex = 0): UserAccentToken {
  if (typeof value === "string" && USER_ACCENT_TOKENS.includes(value as UserAccentToken)) {
    return value as UserAccentToken;
  }

  return USER_ACCENT_TOKENS[fallbackIndex % USER_ACCENT_TOKENS.length];
}

function sanitizeUserName(value: unknown, fallback = "User"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 24) : fallback;
}

function createUserData(
  input: {
    id?: string;
    name?: string;
    accent?: UserAccentToken;
    createdAt?: string;
    profile?: Partial<UserProfile> | UserProfile | null;
    dailyLogs?: Record<string, Partial<DailyLog>> | Record<string, DailyLog> | null;
    savedMeals?: Partial<SavedMeal>[] | SavedMeal[] | null;
  },
  index = 0,
): UserData {
  const id = String(input.id ?? crypto.randomUUID());

  return {
    id,
    name: sanitizeUserName(input.name, `User ${index + 1}`),
    accent: normalizeAccent(input.accent, index),
    createdAt:
      typeof input.createdAt === "string"
        ? input.createdAt
        : new Date().toISOString(),
    profile: normalizeUserProfile(input.profile ?? null),
    dailyLogs: normalizeDailyLogs(input.dailyLogs),
    savedMeals: normalizeSavedMeals(input.savedMeals),
  };
}

function normalizeUsers(
  users: Record<string, Partial<UserData>> | null | undefined,
): Record<string, UserData> {
  return Object.entries(users ?? {}).reduce<Record<string, UserData>>(
    (acc, [userId, user], index) => {
      acc[userId] = createUserData(
        {
          id: userId,
          name: user.name,
          accent: user.accent,
          createdAt: user.createdAt,
          profile: user.profile,
          dailyLogs: user.dailyLogs,
          savedMeals: user.savedMeals,
        },
        index,
      );

      return acc;
    },
    {},
  );
}

function removeMealFromDailyLogs(
  dailyLogs: Record<string, DailyLog>,
  dayKey: string,
  mealId: string,
): Record<string, DailyLog> {
  const currentLog = dailyLogs[dayKey];
  if (!currentLog) {
    return dailyLogs;
  }

  const mealToRemove = currentLog.meals.find((meal) => meal.id === mealId);
  if (!mealToRemove) {
    return dailyLogs;
  }

  const nextMeals = currentLog.meals.filter((meal) => meal.id !== mealId);
  const nextAggregations: DailyAggregations = {
    calories: Math.max(
      0,
      currentLog.aggregations.calories - mealToRemove.calories,
    ),
    protein: Math.max(
      0,
      currentLog.aggregations.protein - mealToRemove.macronutrients.protein,
    ),
    carbs: Math.max(
      0,
      currentLog.aggregations.carbs - mealToRemove.macronutrients.carbs,
    ),
    fat: Math.max(0, currentLog.aggregations.fat - mealToRemove.macronutrients.fat),
    micronutrients: subtractMicronutrients(
      currentLog.aggregations.micronutrients,
      mealToRemove.micronutrients,
    ),
  };

  return {
    ...dailyLogs,
    [dayKey]: {
      meals: nextMeals,
      aggregations: nextAggregations,
    },
  };
}


