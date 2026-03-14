import { create } from "zustand";
import { supabase } from "../lib/supabase";
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
} from "../utils/nutrition-utils";

type MealSourceType = "food" | "supplement";

export const USER_ACCENT_TOKENS = [
  "sun",
  "sky",
  "mint",
  "rose",
  "slate",
] as const;

export type UserAccentToken = (typeof USER_ACCENT_TOKENS)[number];

export interface UserData {
  id: string;
  name: string;
  accent: UserAccentToken;
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  savedMeals: SavedMeal[];
}

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
  if (!profile) return null;
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
    timestamp: typeof meal.timestamp === "string" ? meal.timestamp : new Date().toISOString(),
    meal_name: typeof meal.meal_name === "string" ? meal.meal_name : "Meal",
    calories: toFiniteNumber(meal.calories, 0),
    macronutrients: {
      protein: toFiniteNumber(meal.macronutrients?.protein, 0),
      carbs: toFiniteNumber(meal.macronutrients?.carbs, 0),
      fat: toFiniteNumber(meal.macronutrients?.fat, 0),
    },
    micronutrients: normalizeMicronutrients(meal.micronutrients),
    confidence_score: meal.confidence_score === undefined ? undefined : toFiniteNumber(meal.confidence_score, 0),
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
    ...MICRONUTRIENT_KEYS.map((key) => toRoundedNumber(normalizedMeal.micronutrients[key])),
  ].join("|");
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
      micronutrients: addMicronutrients(acc.micronutrients, meal.micronutrients),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      micronutrients: { ...EMPTY_MICRONUTRIENTS },
    }
  );
}

function getSupplementalMagnesium(meals: MealItem[]): number {
  return meals.reduce((total, meal) => {
    if (meal.sourceType !== "supplement") return total;
    return total + meal.micronutrients.magnesium;
  }, 0);
}

function appendMealToDailyLogs(
  dailyLogs: Record<string, DailyLog>,
  userProfile: UserProfile | null,
  dayKey: string,
  meal: MealItem,
): { dailyLogs: Record<string, DailyLog>; alerts: NutritionSafetyAlert[] } {
  const currentLog = dailyLogs[dayKey] ?? createEmptyDailyLog();
  const normalizedMeal = normalizeMealItem(meal);
  const nextMeals = [...currentLog.meals, normalizedMeal];
  const nextAggregations = aggregateMeals(nextMeals);

  let alerts: NutritionSafetyAlert[] = [];
  if (userProfile) {
    const previousAlerts = evaluateMicronutrientSafety(
      currentLog.aggregations.micronutrients,
      userProfile,
      { supplementalMagnesium: getSupplementalMagnesium(currentLog.meals) },
    );
    const nextAlerts = evaluateMicronutrientSafety(
      nextAggregations.micronutrients,
      userProfile,
      { supplementalMagnesium: getSupplementalMagnesium(nextMeals) },
    );
    alerts = diffSafetyAlerts(previousAlerts, nextAlerts);
  }

  return {
    alerts,
    dailyLogs: {
      ...dailyLogs,
      [dayKey]: { meals: nextMeals, aggregations: nextAggregations },
    },
  };
}

function removeMealFromDailyLogs(
  dailyLogs: Record<string, DailyLog>,
  dayKey: string,
  mealId: string,
): Record<string, DailyLog> {
  const currentLog = dailyLogs[dayKey];
  if (!currentLog) return dailyLogs;

  const nextMeals = currentLog.meals.filter((meal) => meal.id !== mealId);
  const nextAggregations = aggregateMeals(nextMeals);

  return {
    ...dailyLogs,
    [dayKey]: {
      meals: nextMeals,
      aggregations: nextAggregations,
    },
  };
}

interface AppState {
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  savedMeals: SavedMeal[];
  isLoadingData: boolean;
  userId: string | null;

  fetchUserData: (userId: string) => Promise<void>;
  clearUserData: () => void;
  setUserProfile: (profile: NutritionProfileInput) => Promise<void>;
  updateProfileDetails: (details: Partial<NutritionProfileInput>) => Promise<void>;
  addMealLog: (dayKey: string, meal: MealItem) => Promise<NutritionSafetyAlert[]>;
  removeMealLog: (dayKey: string, mealId: string) => Promise<void>;
  saveMealAsFavorite: (meal: MealItem) => Promise<boolean>;
  removeSavedMeal: (savedMealId: string) => Promise<void>;
  addSavedMealToDay: (dayKey: string, savedMealId: string) => Promise<NutritionSafetyAlert[]>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  profile: null,
  dailyLogs: {},
  savedMeals: [],
  isLoadingData: false,
  userId: null,

  fetchUserData: async (userId: string) => {
    set({ isLoadingData: true, userId });
    try {
      const [profileRes, logsRes, mealsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('daily_logs').select('*').eq('user_id', userId),
        supabase.from('saved_meals').select('*').eq('user_id', userId),
      ]);

      let profile = null;
      if (profileRes.data) {
        profile = normalizeUserProfile({
          age: profileRes.data.age,
          gender: profileRes.data.gender,
          height: profileRes.data.height,
          weight: profileRes.data.weight,
          activityLevel: profileRes.data.activity_level,
          goalDeficit: profileRes.data.goals?.[0]?.deficit ?? 500,
          isSmoker: profileRes.data.medical_conditions?.includes('smoker') ?? false,
        });
      }

      const dailyLogs: Record<string, DailyLog> = {};
      if (logsRes.data) {
        logsRes.data.forEach(log => {
          const meals = (log.meals || []).map(normalizeMealItem);
          dailyLogs[log.date] = {
            meals,
            aggregations: aggregateMeals(meals),
          };
        });
      }

      const savedMeals: SavedMeal[] = [];
      if (mealsRes.data) {
        mealsRes.data.forEach(sm => {
          savedMeals.push({
            id: sm.id,
            savedAt: sm.created_at,
            signature: createMealSignature(sm.ingredients?.[0] || {}),
            meal: normalizeMealItem(sm.ingredients?.[0] || {}),
          });
        });
      }

      set({ profile, dailyLogs, savedMeals });
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      set({ isLoadingData: false });
    }
  },

  clearUserData: () => {
    set({ profile: null, dailyLogs: {}, savedMeals: [], userId: null });
  },

  setUserProfile: async (profileInput) => {
    const { userId } = get();
    if (!userId) return;
    const profile = buildUserProfile(profileInput);
    set({ profile });

    await supabase.from('profiles').upsert({
      id: userId,
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      activity_level: profile.activityLevel,
      goals: [{ deficit: profile.goalDeficit }],
      medical_conditions: profile.isSmoker ? ['smoker'] : [],
      updated_at: new Date().toISOString()
    });
  },

  updateProfileDetails: async (details) => {
    const { profile, setUserProfile } = get();
    if (!profile) return;
    await setUserProfile({ ...profile, ...details });
  },

  addMealLog: async (dayKey, meal) => {
    const { dailyLogs, profile, userId } = get();
    if (!userId) return [];
    
    const { dailyLogs: nextLogs, alerts } = appendMealToDailyLogs(dailyLogs, profile, dayKey, meal);
    set({ dailyLogs: nextLogs });

    const logToSave = nextLogs[dayKey];
    await supabase.from('daily_logs').upsert({
      user_id: userId,
      date: dayKey,
      meals: logToSave.meals,
      aggregations: logToSave.aggregations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

    return alerts;
  },

  removeMealLog: async (dayKey, mealId) => {
    const { dailyLogs, userId } = get();
    if (!userId) return;

    const nextLogs = removeMealFromDailyLogs(dailyLogs, dayKey, mealId);
    set({ dailyLogs: nextLogs });

    const logToSave = nextLogs[dayKey];
    if (logToSave) {
      await supabase.from('daily_logs').upsert({
        user_id: userId,
        date: dayKey,
        meals: logToSave.meals,
        aggregations: logToSave.aggregations,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });
    } else {
       await supabase.from('daily_logs').delete().eq('user_id', userId).eq('date', dayKey);
    }
  },

  saveMealAsFavorite: async (meal) => {
    const { savedMeals, userId } = get();
    if (!userId) return false;

    const normalizedMeal = normalizeMealItem(meal);
    const signature = createMealSignature(normalizedMeal);

    if (savedMeals.some((sm) => sm.signature === signature)) {
      return false;
    }

    const newSavedMeal: SavedMeal = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      signature,
      meal: normalizedMeal,
    };

    set({ savedMeals: [newSavedMeal, ...savedMeals] });

    await supabase.from('saved_meals').insert({
      id: newSavedMeal.id,
      user_id: userId,
      name: normalizedMeal.meal_name,
      ingredients: [normalizedMeal],
      created_at: newSavedMeal.savedAt,
      updated_at: newSavedMeal.savedAt
    });

    return true;
  },

  removeSavedMeal: async (savedMealId) => {
    const { savedMeals, userId } = get();
    if (!userId) return;

    set({ savedMeals: savedMeals.filter(sm => sm.id !== savedMealId) });
    await supabase.from('saved_meals').delete().eq('id', savedMealId).eq('user_id', userId);
  },

  addSavedMealToDay: async (dayKey, savedMealId) => {
    const { savedMeals } = get();
    const savedMeal = savedMeals.find((sm) => sm.id === savedMealId);
    if (!savedMeal) return [];

    return get().addMealLog(dayKey, {
      ...savedMeal.meal,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
}));

export function useActiveUser() {
  const userId = useAppStore(state => state.userId);
  const profile = useAppStore(state => state.profile);
  const dailyLogs = useAppStore(state => state.dailyLogs);
  const savedMeals = useAppStore(state => state.savedMeals);
  
  if (!userId) return null;
  return {
    id: userId,
    name: "משתמש",
    accent: "sky" as const,
    profile,
    dailyLogs,
    savedMeals,
  };
}


export function useActiveUserProfile() {
  return useAppStore((state) => state.profile);
}

export function useActiveDailyLogs() {
  return useAppStore((state) => state.dailyLogs);
}

export function useActiveSavedMeals() {
  return useAppStore((state) => state.savedMeals);
}

