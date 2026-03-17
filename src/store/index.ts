import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
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
  /** Original text used to generate the meal */
  mealText?: string;
}

export interface SavedMeal {
  id: string;
  savedAt: string;
  signature: string;
  meal: MealItem;
  /** Raw text template for Dynamic AI Templates — the prompt sent to Gemini at log time */
  mealText?: string;
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
  name: string | null;
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  savedMeals: SavedMeal[];
  aiInsights: Record<string, { insight: string; followUpQuestion?: string; followUpAnswer?: string }>;
  isLoadingData: boolean;
  isAppReady: boolean;
  _hasHydrated: boolean;
  userId: string | null;
  _lastFetchTime: number;
  activeScreen: "home" | "calendar" | "profile";

  setActiveScreen: (screen: "home" | "calendar" | "profile") => void;
  saveInsight: (key: string, text: string) => void;
  saveInsightFollowUp: (key: string, question: string, answer: string) => void;
  clearInsight: (key: string) => void;
  fetchUserData: (userId: string, isSilent?: boolean) => Promise<void>;
  setAppReady: (ready: boolean) => void;
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
      _hasHydrated: false,
      userId: null,
      _lastFetchTime: 0,
      activeScreen: "home",

      setActiveScreen: (screen) => set({ activeScreen: screen }),

      saveInsight: (key, text) => {
        set((state) => ({
          aiInsights: { ...state.aiInsights, [key]: { insight: text } },
        }));
      },

      saveInsightFollowUp: (key, question, answer) => {
        set((state) => {
          const existing = state.aiInsights[key];
          if (!existing) return state;
          return {
            aiInsights: {
              ...state.aiInsights,
              [key]: { ...existing, followUpQuestion: question, followUpAnswer: answer },
            },
          };
        });
      },

      clearInsight: (key) => {
        set((state) => {
          const next = { ...state.aiInsights };
          delete next[key];
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
              };
            });
            const serverIds = new Set(serverMeals.map(sm => sm.id));
            // Keep local optimistic entries not yet on server, prepend them
            const localOnly = savedMeals.filter(sm => !serverIds.has(sm.id));
            savedMeals = [...localOnly, ...serverMeals];
          }

          set({ name, profile, dailyLogs, savedMeals });
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

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },

      clearUserData: () => {
        set({ name: null, profile: null, dailyLogs: {}, savedMeals: [], aiInsights: {}, userId: null, _lastFetchTime: 0, isAppReady: false });
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
    set({ dailyLogs: nextLogs });

    // FIX: Check Supabase error and roll back optimistic update on failure
    const logToSave = nextLogs[dayKey];
    const { error } = await supabase.from('daily_logs').upsert({
      user_id: userId,
      date: dayKey,
      meals: logToSave.meals,
      aggregations: logToSave.aggregations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

    if (error) {
      console.error("Error saving meal log", error);
      set({ dailyLogs: previousLogs });
      toast.error("שגיאה בשמירת הארוחה בשרת. השינוי בוטל.");
      return [];
    }

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

    const placeholderMeal = normalizeMealItem({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      meal_name: name,
      calories: 0,
      macronutrients: { protein: 0, carbs: 0, fat: 0 },
      micronutrients: { ...EMPTY_MICRONUTRIENTS },
      sourceType: "food",
    });

    const newSavedMeal: SavedMeal = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      signature: createMealSignature(placeholderMeal),
      meal: placeholderMeal,
      mealText,
    };

    const previousSavedMeals = savedMeals;
    set({ savedMeals: [newSavedMeal, ...savedMeals] });

    const { error } = await supabase.from('saved_meals').insert({
      id: newSavedMeal.id,
      user_id: userId,
      name,
      ingredients: [{ ...placeholderMeal, mealText }],
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
  },

  updateFavoriteTemplate: async (id, newName, newMealText) => {
    const { savedMeals, userId } = get();
    if (!userId) return false;

    const index = savedMeals.findIndex(sm => sm.id === id);
    if (index === -1) return false;

    const previousSavedMeals = savedMeals;
    const existing = savedMeals[index];

    const updatedMeal: SavedMeal = {
      ...existing,
      meal: { ...existing.meal, meal_name: newName },
      mealText: newMealText,
    };

    const nextSavedMeals = [...savedMeals];
    nextSavedMeals[index] = updatedMeal;
    set({ savedMeals: nextSavedMeals });

    const { error } = await supabase.from('saved_meals').update({
      name: newName,
      ingredients: [{ ...updatedMeal.meal, mealText: newMealText }],
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
