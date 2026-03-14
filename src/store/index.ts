import { create } from "zustand";
import { persist } from "zustand/middleware";
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

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  userProfile: UserProfile | null;
  setUserProfile: (profile: NutritionProfileInput) => void;
  updateProfileDetails: (details: Partial<NutritionProfileInput>) => void;

  dailyLogs: Record<string, DailyLog>;
  addMealLog: (dayKey: string, meal: MealItem) => NutritionSafetyAlert[];
  removeMealLog: (dayKey: string, mealId: string) => void;

  savedMeals: SavedMeal[];
  saveMealAsFavorite: (meal: MealItem) => boolean;
  removeSavedMeal: (savedMealId: string) => void;
  addSavedMealToDay: (
    dayKey: string,
    savedMealId: string,
  ) => NutritionSafetyAlert[];
}

interface PersistedAppState {
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
    meal_name: typeof meal.meal_name === "string" ? meal.meal_name : "ארוחה",
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      userProfile: null,
      setUserProfile: (profile) =>
        set({ userProfile: buildUserProfile(profile) }),

      updateProfileDetails: (details) =>
        set((state) => {
          if (!state.userProfile) {
            return state;
          }

          return {
            userProfile: buildUserProfile({
              age: details.age ?? state.userProfile.age,
              gender: details.gender ?? state.userProfile.gender,
              height: details.height ?? state.userProfile.height,
              weight: details.weight ?? state.userProfile.weight,
              activityLevel:
                details.activityLevel ?? state.userProfile.activityLevel,
              goalDeficit: details.goalDeficit ?? state.userProfile.goalDeficit,
              isSmoker: details.isSmoker ?? state.userProfile.isSmoker,
            }),
          };
        }),

      dailyLogs: {},
      addMealLog: (dayKey, meal) => {
        let triggeredAlerts: NutritionSafetyAlert[] = [];

        set((state) => {
          const nextState = appendMealToDailyLogs(
            state.dailyLogs,
            state.userProfile,
            dayKey,
            meal,
          );

          triggeredAlerts = nextState.alerts;

          return {
            dailyLogs: nextState.dailyLogs,
          };
        });

        return triggeredAlerts;
      },

      removeMealLog: (dayKey, mealId) =>
        set((state) => {
          const currentLog = state.dailyLogs[dayKey];
          if (!currentLog) {
            return state;
          }

          const mealToRemove = currentLog.meals.find(
            (meal) => meal.id === mealId,
          );
          if (!mealToRemove) {
            return state;
          }

          const nextMeals = currentLog.meals.filter(
            (meal) => meal.id !== mealId,
          );
          const nextAggregations: DailyAggregations = {
            calories: Math.max(
              0,
              currentLog.aggregations.calories - mealToRemove.calories,
            ),
            protein: Math.max(
              0,
              currentLog.aggregations.protein -
                mealToRemove.macronutrients.protein,
            ),
            carbs: Math.max(
              0,
              currentLog.aggregations.carbs - mealToRemove.macronutrients.carbs,
            ),
            fat: Math.max(
              0,
              currentLog.aggregations.fat - mealToRemove.macronutrients.fat,
            ),
            micronutrients: subtractMicronutrients(
              currentLog.aggregations.micronutrients,
              mealToRemove.micronutrients,
            ),
          };

          return {
            dailyLogs: {
              ...state.dailyLogs,
              [dayKey]: {
                meals: nextMeals,
                aggregations: nextAggregations,
              },
            },
          };
        }),

      savedMeals: [],
      saveMealAsFavorite: (meal) => {
        let wasAdded = false;

        set((state) => {
          const normalizedMeal = normalizeMealItem(meal);
          const signature = createMealSignature(normalizedMeal);

          if (
            state.savedMeals.some(
              (savedMeal) => savedMeal.signature === signature,
            )
          ) {
            return state;
          }

          wasAdded = true;

          return {
            savedMeals: [
              {
                id: crypto.randomUUID(),
                savedAt: new Date().toISOString(),
                signature,
                meal: normalizedMeal,
              },
              ...state.savedMeals,
            ],
          };
        });

        return wasAdded;
      },

      removeSavedMeal: (savedMealId) =>
        set((state) => ({
          savedMeals: state.savedMeals.filter(
            (savedMeal) => savedMeal.id !== savedMealId,
          ),
        })),

      addSavedMealToDay: (dayKey, savedMealId) => {
        const savedMeal = get().savedMeals.find(
          (item) => item.id === savedMealId,
        );
        if (!savedMeal) {
          return [];
        }

        return get().addMealLog(dayKey, {
          ...savedMeal.meal,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
      },
    }),
    {
      name: "health-app-storage",
      version: 3,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as PersistedAppState;

        return {
          userProfile: normalizeUserProfile(state.userProfile),
          dailyLogs: normalizeDailyLogs(state.dailyLogs),
          savedMeals: normalizeSavedMeals(state.savedMeals),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        userProfile: state.userProfile,
        dailyLogs: state.dailyLogs,
        savedMeals: state.savedMeals,
      }),
    },
  ),
);
