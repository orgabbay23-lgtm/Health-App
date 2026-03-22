import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { parseMealDescription } from "../utils/gemini";
import { getLogicalDayKey as getHydrationDayKey } from "../utils/nutrition-utils";
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
  getLogicalDayKey,
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
  /** Original text used to generate the meal */
  mealText?: string;
  /** How many servings this meal represents (default 1) */
  quantity?: number;
  /** Hard boundary for retention cleanup: favorite-logged meals are preserved */
  isFavorite?: boolean;
}

export interface SavedMeal {
  id: string;
  savedAt: string;
  signature: string;
  meal: MealItem;
  /** Raw text template for Dynamic AI Templates — the prompt sent to Gemini at log time */
  mealText?: string;
  custom_image_url?: string | null;
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

const LOG_RETENTION_DAYS = 60;

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
    name: profile.name || "משתמש",
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
    meal_name: typeof meal.meal_name === "string" ? meal.meal_name : "ארוחה",
    calories: toFiniteNumber(meal.calories, 0),
    macronutrients: {
      protein: toFiniteNumber(meal.macronutrients?.protein, 0),
      carbs: toFiniteNumber(meal.macronutrients?.carbs, 0),
      fat: toFiniteNumber(meal.macronutrients?.fat, 0),
    },
    micronutrients: normalizeMicronutrients(meal.micronutrients),
    confidence_score: meal.confidence_score === undefined ? undefined : toFiniteNumber(meal.confidence_score, 0),
    sourceType: meal.sourceType === "supplement" ? "supplement" : "food",
    mealText: typeof meal.mealText === "string" ? meal.mealText : undefined,
    quantity: typeof meal.quantity === "number" && meal.quantity >= 1 ? meal.quantity : undefined,
    isFavorite: meal.isFavorite === true,
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

function getLogRetentionCutoffDayKey(): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
  return getLogicalDayKey(cutoffDate);
}

function getPrunableLogKeys(logs: Record<string, DailyLog>): string[] {
  const cutoffDayKey = getLogRetentionCutoffDayKey();

  return Object.keys(logs).filter((dayKey) => {
    const dailyLog = logs[dayKey];
    if (!dailyLog) return false;

    return dayKey < cutoffDayKey;
  });
}

export function cleanupOldLogs(logs: Record<string, DailyLog>): Record<string, DailyLog> {
  // Retention cleanup is intentionally scoped to dailyLogs only.
  // It must never inspect or mutate savedMeals.
  const prunableKeys = new Set(getPrunableLogKeys(logs));

  return Object.keys(logs).reduce<Record<string, DailyLog>>((nextLogs, dayKey) => {
    if (!prunableKeys.has(dayKey)) {
      nextLogs[dayKey] = logs[dayKey];
    }
    return nextLogs;
  }, {});
}

async function pruneDailyLogRows(userId: string, dayKeys: string[]): Promise<void> {
  if (dayKeys.length === 0) return;

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("user_id", userId)
    .in("date", dayKeys);

  if (error) {
    console.error("Error pruning old meal logs", error);
  }
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
  name: string | null;
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  savedMeals: SavedMeal[];
  aiInsights: Record<string, string | null>;
  isLoadingData: boolean;
  isAppReady: boolean;
  isRecoveringPassword: boolean;
  _hasHydrated: boolean;
  userId: string | null;
  _lastFetchTime: number;
  activeScreen: "home" | "calendar" | "profile";
  dailyWaterAmount: number;
  waterDateKey: string;
  dailyWaterTarget: number;
  customWaterTarget: number | null;

  setActiveScreen: (screen: "home" | "calendar" | "profile") => void;
  setAiInsight: (key: string, value: string | null) => void;
  fetchUserData: (userId: string, isSilent?: boolean) => Promise<void>;
  setAppReady: (ready: boolean) => void;
  setIsRecoveringPassword: (isRecovering: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  clearUserData: () => void;
  setUserProfile: (profile: NutritionProfileInput) => Promise<void>;
  updateProfileDetails: (details: Partial<NutritionProfileInput>) => Promise<void>;
  addMealLog: (dayKey: string, meal: MealItem) => Promise<NutritionSafetyAlert[]>;
  updateMealLog: (dayKey: string, mealId: string, updatedMeal: MealItem) => Promise<NutritionSafetyAlert[]>;
  removeMealLog: (dayKey: string, mealId: string) => Promise<void>;
  saveMealAsFavorite: (meal: MealItem) => Promise<boolean>;
  removeSavedMeal: (savedMealId: string) => Promise<void>;
  updateSavedMeal: (savedMealId: string, updates: { meal_name: string; meal: MealItem }) => Promise<boolean>;
  createFavoriteTemplate: (name: string, mealText: string) => Promise<boolean>;
  updateFavoriteTemplate: (id: string, newName: string, newMealText: string) => Promise<boolean>;
  addSavedMealToDay: (dayKey: string, savedMealId: string) => Promise<NutritionSafetyAlert[]>;
  incrementMealQuantity: (dayKey: string, mealId: string) => Promise<void>;
  decrementMealQuantity: (dayKey: string, mealId: string) => Promise<void>;
  uploadMealImage: (savedMealId: string, file: File) => Promise<void>;
  deleteMealImage: (savedMealId: string) => Promise<void>;
  fetchTodayWater: () => Promise<void>;
  logWater: (amountMl: number) => Promise<void>;
  removeLastWaterLog: () => Promise<void>;
  setDailyWaterTarget: (target: number) => void;
  setCustomWaterTarget: (target: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      name: null,
      profile: null,
      dailyLogs: {},
      savedMeals: [],
      aiInsights: {},
      isLoadingData: false,
      isAppReady: false,
      isRecoveringPassword: false,
      _hasHydrated: false,
      userId: null,
      _lastFetchTime: 0,
      activeScreen: "home",
      dailyWaterAmount: 0,
      waterDateKey: "",
      dailyWaterTarget: 2500,
      customWaterTarget: null,

      setActiveScreen: (screen) => set({ activeScreen: screen }),

      setAiInsight: (key, value) => {
        set((state) => {
          const next = { ...state.aiInsights };
          if (value === null) {
            delete next[key];
          } else {
            next[key] = value;
          }
          return { aiInsights: next };
        });
      },

      fetchUserData: async (userId: string, isSilent?: boolean) => {
        const now = Date.now();
        const { userId: existingUserId, profile: existingProfile, _lastFetchTime } = get();

        // FIX: Independent time check — prevent redundant fetches within 5 seconds
        if (existingUserId === userId && (now - _lastFetchTime < 5000)) {
          return;
        }

        const shouldBeSilent = isSilent ?? existingProfile !== null;
        if (!shouldBeSilent) {
          set({ isLoadingData: true });
        }

        set({ userId, _lastFetchTime: now });

        try {
          const [profileRes, logsRes, mealsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            supabase.from('daily_logs').select('*').eq('user_id', userId),
            supabase.from('saved_meals').select('*').eq('user_id', userId),
          ]);

          if (profileRes.error && profileRes.status !== 406) throw profileRes.error;

          let name = get().name || "משתמש";
          if (profileRes.data?.name) {
             name = profileRes.data.name;
          }

          let profile = existingProfile;
          if (profileRes.data) {
            profile = normalizeUserProfile({
              name: name,
              age: profileRes.data.age,
              gender: profileRes.data.gender,
              height: profileRes.data.height,
              weight: profileRes.data.weight,
              activityLevel: profileRes.data.activity_level,
              goalDeficit: profileRes.data.goals?.[0]?.deficit ?? 500,
              isSmoker: profileRes.data.medical_conditions?.includes('smoker') ?? false,
            });
          } else if (!existingProfile) {
            profile = null;
          }

          const dailyLogs: Record<string, DailyLog> = { ...get().dailyLogs };
          if (logsRes.data) {
            logsRes.data.forEach(log => {
              const meals = (log.meals || []).map(normalizeMealItem);
              dailyLogs[log.date] = {
                meals,
                aggregations: aggregateMeals(meals),
              };
            });
          }
          const prunableLogKeys = getPrunableLogKeys(dailyLogs);
          const cleanedDailyLogs = cleanupOldLogs(dailyLogs);

          // FIX: Merge optimistic saved meals with server data instead of wholesale overwrite
          let savedMeals = [...get().savedMeals];
          if (mealsRes.data) {
            const serverMeals = mealsRes.data.map(sm => {
              const raw = sm.ingredients?.[0] || {};
              return {
                id: sm.id,
                savedAt: sm.created_at,
                signature: createMealSignature(raw),
                meal: normalizeMealItem(raw),
                mealText: raw.mealText as string | undefined,
                custom_image_url: sm.custom_image_url,
              };
            });
            const serverIds = new Set(serverMeals.map(sm => sm.id));
            // Keep local optimistic entries not yet on server, prepend them
            const localOnly = savedMeals.filter(sm => !serverIds.has(sm.id));
            savedMeals = [...localOnly, ...serverMeals];
          }

          set({ name, profile, dailyLogs: cleanedDailyLogs, savedMeals });
          await pruneDailyLogRows(userId, prunableLogKeys);
        } catch (error) {
          console.error("Error fetching user data", error);
        } finally {
          set({ isLoadingData: false });
        }
      },

      setAppReady: (ready: boolean) => {
        // One-way latch: once ready, only SIGNED_OUT can reset it
        if (ready) {
          set({ isAppReady: true });
        }
      },

      setIsRecoveringPassword: (isRecovering: boolean) => {
        set({ isRecoveringPassword: isRecovering });
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },

      clearUserData: () => {
        set({
          name: null,
          profile: null,
          dailyLogs: {},
          savedMeals: [],
          aiInsights: {},
          userId: null,
          _lastFetchTime: 0,
          isAppReady: false,
          dailyWaterAmount: 0,
          waterDateKey: "",
          dailyWaterTarget: 2500,
          customWaterTarget: null,
        });
        // FIX: Use Zustand persist clearStorage instead of raw localStorage
        useAppStore.persist.clearStorage();
      },

  setUserProfile: async (profileInput) => {
    const { userId } = get();
    if (!userId) return;
    const profile = buildUserProfile(profileInput);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name: profileInput.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        activity_level: profile.activityLevel,
        goals: [{ deficit: profile.goalDeficit }],
        medical_conditions: profile.isSmoker ? ['smoker'] : [],
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      set({ profile, name: profileInput.name });
      toast.success("הפרופיל נשמר בהצלחה");
    } catch (error) {
      console.error("Error saving profile", error);
      toast.error("שגיאה בשמירת הנתונים");
      throw error;
    }
  },

  updateProfileDetails: async (details) => {
    const { profile, setUserProfile } = get();
    if (!profile) return;
    try {
      await setUserProfile({ ...profile, ...details });
    } catch (error) {
      // Error is already handled inside setUserProfile
    }
  },

  addMealLog: async (dayKey, meal) => {
    const { dailyLogs, profile, userId } = get();
    if (!userId) return [];

    // Snapshot for rollback
    const previousLogs = dailyLogs;

    const { dailyLogs: nextLogs, alerts } = appendMealToDailyLogs(dailyLogs, profile, dayKey, meal);
    const prunableLogKeys = getPrunableLogKeys(nextLogs);
    const cleanedLogs = cleanupOldLogs(nextLogs);
    set({ dailyLogs: cleanedLogs });

    // FIX: Check Supabase error and roll back optimistic update on failure
    const logToSave = cleanedLogs[dayKey];
    let error = null;
    if (logToSave) {
      const res = await supabase.from('daily_logs').upsert({
        user_id: userId,
        date: dayKey,
        meals: logToSave.meals,
        aggregations: logToSave.aggregations,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });
      error = res.error;
    }

    if (error) {
      console.error("Error saving meal log", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה בשמירת הארוחה בשרת. השינוי בוטל.");
      throw new Error("שגיאה בשמירת הארוחה");
    }

    await pruneDailyLogRows(userId, prunableLogKeys);

    return alerts;
  },

  removeMealLog: async (dayKey, mealId) => {
    const { dailyLogs, userId } = get();
    if (!userId) return;

    // Snapshot for rollback
    const previousLogs = dailyLogs;

    const nextLogs = removeMealFromDailyLogs(dailyLogs, dayKey, mealId);
    set({ dailyLogs: nextLogs });

    // FIX: Check Supabase error and roll back on failure
    const logToSave = nextLogs[dayKey];
    let error;
    if (logToSave) {
      const res = await supabase.from('daily_logs').upsert({
        user_id: userId,
        date: dayKey,
        meals: logToSave.meals,
        aggregations: logToSave.aggregations,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });
      error = res.error;
    } else {
      const res = await supabase.from('daily_logs').delete().eq('user_id', userId).eq('date', dayKey);
      error = res.error;
    }

    if (error) {
      console.error("Error removing meal log", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה במחיקת הארוחה מהשרת. השינוי בוטל.");
    }
  },

  updateMealLog: async (dayKey, mealId, updatedMeal) => {
    const { dailyLogs, profile, userId } = get();
    if (!userId) return [];

    const currentLog = dailyLogs[dayKey];
    if (!currentLog) return [];

    const previousLogs = dailyLogs;

    // Replace the specific meal
    const nextMeals = currentLog.meals.map(m => m.id === mealId ? normalizeMealItem(updatedMeal) : m);
    const nextAggregations = aggregateMeals(nextMeals);

    const nextLogs = {
      ...dailyLogs,
      [dayKey]: { meals: nextMeals, aggregations: nextAggregations },
    };

    let alerts: NutritionSafetyAlert[] = [];
    if (profile) {
      const previousAlerts = evaluateMicronutrientSafety(
        currentLog.aggregations.micronutrients,
        profile,
        { supplementalMagnesium: getSupplementalMagnesium(currentLog.meals) },
      );
      const nextAlerts = evaluateMicronutrientSafety(
        nextAggregations.micronutrients,
        profile,
        { supplementalMagnesium: getSupplementalMagnesium(nextMeals) },
      );
      alerts = diffSafetyAlerts(previousAlerts, nextAlerts);
    }

    set({ dailyLogs: nextLogs });

    const logToSave = nextLogs[dayKey];
    const { error } = await supabase.from('daily_logs').upsert({
      user_id: userId,
      date: dayKey,
      meals: logToSave.meals,
      aggregations: logToSave.aggregations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

    if (error) {
      console.error("Error updating meal log", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה בעדכון הארוחה בשרת. השינוי בוטל.");
      return [];
    }

    return alerts;
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
      mealText: normalizedMeal.mealText,
    };

    // Snapshot for rollback
    const previousSavedMeals = savedMeals;

    set({ savedMeals: [newSavedMeal, ...savedMeals] });

    // FIX: Check Supabase error and roll back on failure
    const { error } = await supabase.from('saved_meals').insert({
      id: newSavedMeal.id,
      user_id: userId,
      name: normalizedMeal.meal_name,
      ingredients: [normalizedMeal],
      created_at: newSavedMeal.savedAt,
      updated_at: newSavedMeal.savedAt
    });

    if (error) {
      console.error("Error saving favorite meal", error);
      set({ savedMeals: previousSavedMeals });
      toast.error("שגיאה בשמירת הארוחה במועדפים. השינוי בוטל.");
      return false;
    }

    return true;
  },

  removeSavedMeal: async (savedMealId) => {
    const { savedMeals, userId } = get();
    if (!userId) return;

    // Snapshot for rollback
    const previousSavedMeals = savedMeals;

    set({ savedMeals: savedMeals.filter(sm => sm.id !== savedMealId) });

    // FIX: Check Supabase error and roll back on failure
    const { error } = await supabase.from('saved_meals').delete().eq('id', savedMealId).eq('user_id', userId);

    if (error) {
      console.error("Error removing saved meal", error);
      set({ savedMeals: previousSavedMeals });
      toast.error("שגיאה במחיקת הארוחה מהמועדפים. השינוי בוטל.");
    }
  },

  updateSavedMeal: async (savedMealId, updates) => {
    const { savedMeals, userId } = get();
    if (!userId) return false;

    const index = savedMeals.findIndex(sm => sm.id === savedMealId);
    if (index === -1) return false;

    const previousSavedMeals = savedMeals;
    const normalizedMeal = normalizeMealItem(updates.meal);
    const newSignature = createMealSignature(normalizedMeal);

    const updatedSavedMeal: SavedMeal = {
      ...savedMeals[index],
      signature: newSignature,
      meal: { ...normalizedMeal, meal_name: updates.meal_name },
      mealText: normalizedMeal.mealText,
    };

    const nextSavedMeals = [...savedMeals];
    nextSavedMeals[index] = updatedSavedMeal;
    set({ savedMeals: nextSavedMeals });

    const { error } = await supabase.from('saved_meals').update({
      name: updates.meal_name,
      ingredients: [updatedSavedMeal.meal],
      updated_at: new Date().toISOString(),
    }).eq('id', savedMealId).eq('user_id', userId);

    if (error) {
      console.error("Error updating saved meal", error);
      set({ savedMeals: previousSavedMeals });
      toast.error("שגיאה בעדכון הארוחה במועדפים. השינוי בוטל.");
      return false;
    }

    toast.success("הארוחה עודכנה בהצלחה");
    return true;
  },

  createFavoriteTemplate: async (name, mealText) => {
    const { savedMeals, userId } = get();
    if (!userId) return false;

    try {
      // 1. Calculate nutritional values via AI before creating the favorite
      const parsed = await parseMealDescription(mealText);
      const completeMeal = normalizeMealItem({
        ...parsed,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        meal_name: name,
        mealText,
      });

      const newSavedMeal: SavedMeal = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        signature: createMealSignature(completeMeal),
        meal: completeMeal,
        mealText,
      };

      const previousSavedMeals = savedMeals;
      set({ savedMeals: [newSavedMeal, ...savedMeals] });

      const { error } = await supabase.from('saved_meals').insert({
        id: newSavedMeal.id,
        user_id: userId,
        name,
        ingredients: [completeMeal],
        created_at: newSavedMeal.savedAt,
        updated_at: newSavedMeal.savedAt,
      });

      if (error) {
        console.error("Error saving favorite template", error);
        set({ savedMeals: previousSavedMeals });
        toast.error("שגיאה בשמירת התבנית. השינוי בוטל.");
        return false;
      }

      toast.success("תבנית מועדפת נשמרה בהצלחה");
      return true;
    } catch (error: any) {
      console.error("[AI] Failed to parse favorite meal:", error);
      if (error.message === "BYOK_REQUIRED" || error.message === "API_KEY_INVALID" || error.message === "MISSING_API_KEY" || error.message === "INVALID_KEY_FROM_GOOGLE") {
        toast.error("יש להזין מפתח API תקין בהגדרות כדי להשתמש ב-AI");
      } else {
        toast.error(error.message || "שגיאה בניתוח הארוחה, אנא נסו שוב.");
      }
      return false;
    }
  },

  updateFavoriteTemplate: async (id, newName, newMealText) => {
    const { savedMeals, userId } = get();
    if (!userId) return false;

    const index = savedMeals.findIndex(sm => sm.id === id);
    if (index === -1) return false;

    const previousSavedMeals = savedMeals;
    const existing = savedMeals[index];

    try {
      let updatedMealData: MealItem;

      // If the meal text changed, trigger AI re-parsing synchronously
      const textChanged = newMealText !== (existing.mealText || existing.meal.mealText);
      
      if (textChanged) {
        const parsed = await parseMealDescription(newMealText);
        updatedMealData = normalizeMealItem({
          ...parsed,
          id: existing.meal.id,
          timestamp: existing.meal.timestamp,
          meal_name: newName,
          mealText: newMealText,
        });
      } else {
        updatedMealData = normalizeMealItem({
          ...existing.meal,
          meal_name: newName,
        });
      }

      const updatedSavedMeal: SavedMeal = {
        ...existing,
        meal: updatedMealData,
        mealText: newMealText,
        signature: createMealSignature(updatedMealData),
      };

      const nextSavedMeals = [...savedMeals];
      nextSavedMeals[index] = updatedSavedMeal;
      set({ savedMeals: nextSavedMeals });

      const { error } = await supabase.from('saved_meals').update({
        name: newName,
        ingredients: [updatedMealData],
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('user_id', userId);

      if (error) {
        console.error("Error updating favorite template", error);
        set({ savedMeals: previousSavedMeals });
        toast.error("שגיאה בעדכון התבנית. השינוי בוטל.");
        return false;
      }

      toast.success("התבנית עודכנה בהצלחה");
      return true;
    } catch (error: any) {
      console.error("[AI] Failed to update favorite meal:", error);
      if (error.message === "BYOK_REQUIRED" || error.message === "API_KEY_INVALID" || error.message === "MISSING_API_KEY" || error.message === "INVALID_KEY_FROM_GOOGLE") {
        toast.error("יש להזין מפתח API תקין בהגדרות כדי להשתמש ב-AI");
      } else {
        toast.error(error.message || "שגיאה בניתוח הארוחה, אנא נסו שוב.");
      }
      return false;
    }
  },

  incrementMealQuantity: async (dayKey, mealId) => {
    const { dailyLogs, userId } = get();
    if (!userId) return;

    const currentLog = dailyLogs[dayKey];
    if (!currentLog) return;

    const mealIndex = currentLog.meals.findIndex(m => m.id === mealId);
    if (mealIndex === -1) return;

    const meal = currentLog.meals[mealIndex];
    const currentQty = meal.quantity || 1;
    const newQty = currentQty + 1;

    // Scale all nutritional values: newValue = (current / currentQty) * newQty
    const scale = newQty / currentQty;
    const updatedMeal: MealItem = {
      ...meal,
      quantity: newQty,
      calories: meal.calories * scale,
      macronutrients: {
        protein: meal.macronutrients.protein * scale,
        carbs: meal.macronutrients.carbs * scale,
        fat: meal.macronutrients.fat * scale,
      },
      micronutrients: MICRONUTRIENT_KEYS.reduce((acc, key) => {
        acc[key] = meal.micronutrients[key] * scale;
        return acc;
      }, { ...EMPTY_MICRONUTRIENTS }),
    };

    const previousLogs = dailyLogs;
    const nextMeals = [...currentLog.meals];
    nextMeals[mealIndex] = updatedMeal;
    const nextAggregations = aggregateMeals(nextMeals);
    const nextLogs = {
      ...dailyLogs,
      [dayKey]: { meals: nextMeals, aggregations: nextAggregations },
    };

    set({ dailyLogs: nextLogs });

    const logToSave = nextLogs[dayKey];
    const { error } = await supabase.from('daily_logs').upsert({
      user_id: userId,
      date: dayKey,
      meals: logToSave.meals,
      aggregations: logToSave.aggregations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

    if (error) {
      console.error("Error incrementing meal quantity", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה בעדכון הכמות. השינוי בוטל.");
    }
  },

  decrementMealQuantity: async (dayKey, mealId) => {
    const { dailyLogs, userId } = get();
    if (!userId) return;

    const currentLog = dailyLogs[dayKey];
    if (!currentLog) return;

    const mealIndex = currentLog.meals.findIndex(m => m.id === mealId);
    if (mealIndex === -1) return;

    const meal = currentLog.meals[mealIndex];
    const currentQty = meal.quantity || 1;
    if (currentQty <= 1) return;

    const newQty = currentQty - 1;
    const scale = newQty / currentQty;
    const updatedMeal: MealItem = {
      ...meal,
      quantity: newQty === 1 ? undefined : newQty,
      calories: meal.calories * scale,
      macronutrients: {
        protein: meal.macronutrients.protein * scale,
        carbs: meal.macronutrients.carbs * scale,
        fat: meal.macronutrients.fat * scale,
      },
      micronutrients: MICRONUTRIENT_KEYS.reduce((acc, key) => {
        acc[key] = meal.micronutrients[key] * scale;
        return acc;
      }, { ...EMPTY_MICRONUTRIENTS }),
    };

    const previousLogs = dailyLogs;
    const nextMeals = [...currentLog.meals];
    nextMeals[mealIndex] = updatedMeal;
    const nextAggregations = aggregateMeals(nextMeals);
    const nextLogs = {
      ...dailyLogs,
      [dayKey]: { meals: nextMeals, aggregations: nextAggregations },
    };

    set({ dailyLogs: nextLogs });

    const logToSave = nextLogs[dayKey];
    const { error } = await supabase.from('daily_logs').upsert({
      user_id: userId,
      date: dayKey,
      meals: logToSave.meals,
      aggregations: logToSave.aggregations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

    if (error) {
      console.error("Error decrementing meal quantity", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה בעדכון הכמות. השינוי בוטל.");
    }
  },

  addSavedMealToDay: async (dayKey, savedMealId) => {
    const { savedMeals } = get();
    const savedMeal = savedMeals.find((sm) => sm.id === savedMealId);
    if (!savedMeal) {
      throw new Error("הארוחה השמורה לא נמצאה");
    }

    return get().addMealLog(dayKey, {
      ...savedMeal.meal,
      mealText: savedMeal.mealText || savedMeal.meal.mealText,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      isFavorite: true,
    });
  },

  uploadMealImage: async (savedMealId, file) => {
    const { userId, savedMeals } = get();
    if (!userId) return;

    const savedMeal = savedMeals.find((sm) => sm.id === savedMealId);
    if (!savedMeal) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${savedMealId}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('saved_meals')
        .update({ custom_image_url: publicUrl })
        .eq('id', savedMealId);

      if (dbError) throw dbError;

      set((state) => ({
        savedMeals: state.savedMeals.map((sm) =>
          sm.id === savedMealId ? { ...sm, custom_image_url: publicUrl } : sm
        ),
      }));

      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("שגיאה בהעלאת התמונה");
    }
  },

  deleteMealImage: async (savedMealId) => {
    const { userId, savedMeals } = get();
    if (!userId) return;

    const savedMeal = savedMeals.find((sm) => sm.id === savedMealId);
    if (!savedMeal || !savedMeal.custom_image_url) return;

    try {
      const url = new URL(savedMeal.custom_image_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('meal-images') + 1).join('/');

      const { error: deleteError } = await supabase.storage
        .from('meal-images')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: dbError } = await supabase
        .from('saved_meals')
        .update({ custom_image_url: null })
        .eq('id', savedMealId);

      if (dbError) throw dbError;

      set((state) => ({
        savedMeals: state.savedMeals.map((sm) =>
          sm.id === savedMealId ? { ...sm, custom_image_url: null } : sm
        ),
      }));

      toast.success("התמונה נמחקה בהצלחה");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("שגיאה במחיקת התמונה");
    }
  },

  fetchTodayWater: async () => {
    const { userId } = get();
    if (!userId) return;

    const todayKey = getHydrationDayKey();
    const [year, month, day] = todayKey.split('-').map(Number);
    // Create local dates for 03:00 AM today and 03:00 AM tomorrow
    const startOfLogicalDay = new Date(year, month - 1, day, 3, 0, 0);
    const endOfLogicalDay = new Date(year, month - 1, day + 1, 3, 0, 0);
    
    const startOfDay = startOfLogicalDay.toISOString();
    const endOfDay = endOfLogicalDay.toISOString();

    const { data, error } = await supabase
      .from("water_logs")
      .select("amount_ml")
      .eq("user_id", userId)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay);

    if (error) {
      console.error("Error fetching water logs:", error);
      return;
    }

    const total = (data ?? []).reduce((sum, row) => sum + (row.amount_ml ?? 0), 0);
    set({ dailyWaterAmount: total, waterDateKey: todayKey });
  },

  logWater: async (amountMl: number) => {
    const { userId } = get();
    if (!userId) return;

    // Prevent stale data accumulation across rollovers
    if (get().waterDateKey && get().waterDateKey !== getHydrationDayKey()) {
      await get().fetchTodayWater();
    }

    // CRITICAL: Fetch dailyWaterAmount AFTER potential fetchTodayWater execution
    const currentDailyAmount = get().dailyWaterAmount;
    const previousAmount = currentDailyAmount;

    // Optimistic update
    set({ 
      dailyWaterAmount: currentDailyAmount + amountMl,
      waterDateKey: getHydrationDayKey()
    });

    const { error } = await supabase
      .from("water_logs")
      .insert({ user_id: userId, amount_ml: amountMl });

    if (error) {
      console.error("Error logging water:", error);
      set({ dailyWaterAmount: previousAmount });
      toast.error("שגיאה ברישום שתייה");
    }
  },

  setDailyWaterTarget: (target: number) => {
    set({ dailyWaterTarget: target });
  },

  removeLastWaterLog: async () => {
    const { userId } = get();
    if (!userId) return;

    // Prevent stale state deletion attempts
    if (get().waterDateKey && get().waterDateKey !== getHydrationDayKey()) {
      await get().fetchTodayWater();
    }

    // CRITICAL: Fetch dailyWaterAmount AFTER potential fetchTodayWater execution
    const currentDailyAmount = get().dailyWaterAmount;
    if (currentDailyAmount <= 0) return;

    const todayKey = getHydrationDayKey();
    const [year, month, day] = todayKey.split('-').map(Number);
    const startOfLogicalDay = new Date(year, month - 1, day, 3, 0, 0);
    const endOfLogicalDay = new Date(year, month - 1, day + 1, 3, 0, 0);
    
    const startOfDay = startOfLogicalDay.toISOString();
    const endOfDay = endOfLogicalDay.toISOString();

    const { data, error: fetchError } = await supabase
      .from("water_logs")
      .select("id, amount_ml")
      .eq("user_id", userId)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !data?.length) {
      console.error("Error finding water log:", fetchError);
      return;
    }

    const lastLog = data[0];
    const previousAmount = currentDailyAmount;
    set({ dailyWaterAmount: Math.max(0, currentDailyAmount - lastLog.amount_ml) });

    const { error: deleteError } = await supabase
      .from("water_logs")
      .delete()
      .eq("id", lastLog.id);

    if (deleteError) {
      console.error("Error deleting water log:", deleteError);
      set({ dailyWaterAmount: previousAmount });
      toast.error("שגיאה במחיקת רישום שתייה");
    }
  },

  setCustomWaterTarget: (target: number | null) => {
    set({ customWaterTarget: target });
    if (target !== null) {
      set({ dailyWaterTarget: target });
    }
  },
}),
{
  name: "app-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    name: state.name,
    profile: state.profile,
    dailyLogs: state.dailyLogs,
    savedMeals: state.savedMeals,
    aiInsights: state.aiInsights,
    userId: state.userId,
    dailyWaterAmount: state.dailyWaterAmount,
    waterDateKey: state.waterDateKey,
    dailyWaterTarget: state.dailyWaterTarget,
    customWaterTarget: state.customWaterTarget,
  }),
  // FIX: Wrap onRehydrateStorage in try/catch to handle corrupted storage
  onRehydrateStorage: () => (state, error) => {
    if (error || !state) {
      console.error("Zustand hydration failed, clearing corrupted storage:", error);
      try {
        localStorage.removeItem("app-storage");
      } catch {
        // localStorage may be unavailable
      }
      // Still mark as hydrated so the app doesn't get stuck on the loading screen
      useAppStore.getState().setHasHydrated(true);
      return;
    }
    state.setHasHydrated(true);
  },
}
)
);

export function useActiveUser() {
  const userId = useAppStore(state => state.userId);
  const name = useAppStore(state => state.name);
  const profile = useAppStore(state => state.profile);
  const dailyLogs = useAppStore(state => state.dailyLogs);
  const savedMeals = useAppStore(state => state.savedMeals);

  if (!userId) return null;
  return {
    id: userId,
    name: name || "משתמש",
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
