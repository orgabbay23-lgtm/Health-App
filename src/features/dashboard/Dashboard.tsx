import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  EMPTY_MICRONUTRIENTS,
  MICRONUTRIENT_KEYS,
  type MicronutrientTotals,
  type NutritionSafetyAlert,
  evaluateMicronutrientSafety,
} from "../../utils/nutrition-utils";
import { parseEditedIngredients } from "../../utils/gemini";
import {
  aggregatePeriodLogs,
  createEmptyAggregations,
  dayKeyToDate,
  formatDayKey,
  getLogicalDate,
  getPeriodDetails,
  type DashboardPeriod,
} from "../../utils/date-navigation";
import {
  useActiveUser,
  useAppStore,
  createMealSignature,
  type DailyAggregations,
  type DailyLog,
  type MealItem,
  type UserProfile,
} from "../../store";
import { EditProfileModal } from "../profile/EditProfileModal";
import { MealLogModal } from "../meal-logging/MealLogModal";
import { EditLoggedMealModal } from "../meal-logging/EditLoggedMealModal";
import { BottomNavigation } from "./components/BottomNavigation";
import { DashboardTopBar } from "./components/DashboardTopBar";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { WeightGraphScreen } from "./screens/WeightGraphScreen";
import { MorePopover } from "./components/MorePopover";
import { WeightReminderModal } from "./components/WeightReminderModal";
import { WeightFeaturePromoModal } from "./components/WeightFeaturePromoModal";

const EMPTY_DAILY_LOGS: Record<string, DailyLog> = {};
const EMPTY_SAVED_MEALS: ReadonlyArray<{
  id: string;
  savedAt: string;
  signature: string;
  meal: MealItem;
}> = [];

function buildBaseTargets(targets: UserProfile["targets"]): DailyAggregations {
  return {
    calories: targets.calories,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
    micronutrients: targets.micronutrients,
  };
}

function createScaledTargets(
  dailyTargets: ReturnType<typeof buildBaseTargets>,
  multiplier: number,
): DailyAggregations {
  return {
    calories: dailyTargets.calories * multiplier,
    protein: dailyTargets.protein * multiplier,
    carbs: dailyTargets.carbs * multiplier,
    fat: dailyTargets.fat * multiplier,
    micronutrients: MICRONUTRIENT_KEYS.reduce(
      (acc, key) => {
        acc[key] = dailyTargets.micronutrients[key] * multiplier;
        return acc;
      },
      { ...EMPTY_MICRONUTRIENTS },
    ),
  };
}

function getDailySafetyAlerts(
  userProfile: UserProfile,
  selectedDailyLog: DailyLog | null,
) {
  if (!selectedDailyLog) {
    return [] as NutritionSafetyAlert[];
  }

  const supplementalMagnesium = selectedDailyLog.meals.reduce((total, meal) => {
    if (meal.sourceType !== "supplement") {
      return total;
    }

    return total + meal.micronutrients.magnesium;
  }, 0);

  return evaluateMicronutrientSafety(
    selectedDailyLog.aggregations.micronutrients,
    userProfile,
    {
      supplementalMagnesium,
    },
  );
}

export function Dashboard() {
  const activeScreen = useAppStore((state) => state.activeScreen);
  const setActiveScreen = useAppStore((state) => state.setActiveScreen);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<DashboardPeriod>("daily");
  const [referenceDate, setReferenceDate] = useState(() => getLogicalDate());
  const [editingLog, setEditingLog] = useState<{ dayKey: string; meal: MealItem } | null>(null);

  const activeUser = useActiveUser();
  const removeMealLog = useAppStore((state) => state.removeMealLog);
  const updateMealLog = useAppStore((state) => state.updateMealLog);
  const saveMealAsFavorite = useAppStore((state) => state.saveMealAsFavorite);
  const removeSavedMeal = useAppStore((state) => state.removeSavedMeal);
  const incrementMealQuantity = useAppStore((state) => state.incrementMealQuantity);
  const decrementMealQuantity = useAppStore((state) => state.decrementMealQuantity);
  
  // Guard against missing profile/user during state transitions
  const userProfile = activeUser?.profile ?? null;
  const dailyLogs = activeUser?.dailyLogs ?? EMPTY_DAILY_LOGS;
  const savedMeals = activeUser?.savedMeals ?? EMPTY_SAVED_MEALS;

  const periodDetails = useMemo(
    () => getPeriodDetails(periodMode, referenceDate),
    [periodMode, referenceDate],
  );

  const periodData = useMemo(
    () => aggregatePeriodLogs(dailyLogs, periodDetails),
    [dailyLogs, periodDetails],
  );

  const selectedDayKey = formatDayKey(periodDetails.referenceDate);
  const selectedDailyLog = dailyLogs[selectedDayKey] ?? null;

  const savedSignatures = useMemo(
    () => new Set(savedMeals.map((savedMeal) => savedMeal.signature)),
    [savedMeals],
  );

  const safetyAlerts = useMemo(
    () =>
      periodMode === "daily" && userProfile
        ? getDailySafetyAlerts(userProfile, selectedDailyLog)
        : [],
    [periodMode, selectedDailyLog, userProfile],
  );

  const periodTargets = useMemo(() => {
    if (!userProfile) {
      return createEmptyAggregations();
    }

    const baseTargets = buildBaseTargets(userProfile.targets);

    if (periodMode === "daily") {
      return createScaledTargets(baseTargets, 1);
    }

    // Active Days algorithm: only count days that have logged meals OR are today.
    // This prevents empty past days from inflating the period target budget.
    const todayKey = formatDayKey(getLogicalDate());
    const activeDaysCount = periodDetails.dayKeys.filter((dayKey) => {
      if (dayKey === todayKey) return true;
      const log = dailyLogs[dayKey];
      return log != null && log.meals.length > 0;
    }).length;

    return createScaledTargets(baseTargets, Math.max(activeDaysCount, 1));
  }, [periodDetails.dayKeys, periodMode, userProfile, dailyLogs]);

  const onSaveFavorite = useCallback(async (meal: MealItem) => {
    const signature = createMealSignature(meal);
    const existing = savedMeals.find((sm) => sm.signature === signature);

    if (existing) {
      await removeSavedMeal(existing.id);
      toast.success("הארוחה הוסרה מהמועדפים");
      return;
    }

    const wasAdded = await saveMealAsFavorite(meal);

    if (wasAdded) {
      toast.success("הארוחה נשמרה במועדפים");
      return;
    }

    toast.message("הארוחה כבר קיימת במועדפים");
  }, [savedMeals, removeSavedMeal, saveMealAsFavorite]);

  const scrollToTop = useCallback(() => {
    const scrollCanvas = document.querySelector('.ios-scroll-canvas');
    if (scrollCanvas) {
      scrollCanvas.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const onHistoryIncrement = useCallback((dayKey: string, mealId: string) => {
    incrementMealQuantity(dayKey, mealId);
    setActiveScreen("home");
    requestAnimationFrame(scrollToTop);
  }, [incrementMealQuantity, setActiveScreen, scrollToTop]);

  const onHistoryDecrement = useCallback((dayKey: string, mealId: string) => {
    decrementMealQuantity(dayKey, mealId);
    setActiveScreen("home");
    requestAnimationFrame(scrollToTop);
  }, [decrementMealQuantity, setActiveScreen, scrollToTop]);

  const onSelectArchiveDay = useCallback((dayKey: string) => {
    setPeriodMode("daily");
    setReferenceDate(dayKeyToDate(dayKey));
  }, []);

  const onEditMeal = useCallback((dayKey: string, meal: MealItem) => {
    setEditingLog({ dayKey, meal });
  }, []);

  const onDeleteIngredient = useCallback(async (dayKey: string, meal: MealItem, ingredientIndex: number) => {
    if (!meal.ingredients) return;
    const ingredient = meal.ingredients[ingredientIndex];

    // If it's the last ingredient, remove the entire meal
    if (meal.ingredients.length <= 1) {
      removeMealLog(dayKey, meal.id);
      toast.success("הארוחה נמחקה");
      return;
    }

    const calorieFraction = meal.calories > 0 ? ingredient.calories / meal.calories : 0;
    const keepFraction = Math.max(0, 1 - calorieFraction);
    const remainingIngredients = meal.ingredients.filter((_, i) => i !== ingredientIndex);

    const updatedMicros = MICRONUTRIENT_KEYS.reduce((acc, key) => {
      acc[key] = Math.max(0, meal.micronutrients[key] * keepFraction);
      return acc;
    }, { ...EMPTY_MICRONUTRIENTS } as MicronutrientTotals);

    const updatedMeal: MealItem = {
      ...meal,
      ingredients: remainingIngredients,
      calories: Math.max(0, meal.calories - ingredient.calories),
      macronutrients: {
        protein: Math.max(0, meal.macronutrients.protein - ingredient.protein),
        carbs: Math.max(0, meal.macronutrients.carbs * keepFraction),
        fat: Math.max(0, meal.macronutrients.fat * keepFraction),
      },
      micronutrients: updatedMicros,
    };

    const alerts = await updateMealLog(dayKey, meal.id, updatedMeal);
    toast.success(`"${ingredient.name}" הוסר מהארוחה`);
    alerts.forEach((alert) => {
      toast.warning(alert.title, {
        id: `${dayKey}-${alert.id}-del-ing`,
        description: alert.message,
        duration: 7000,
      });
    });
  }, [removeMealLog, updateMealLog]);

  const onEditIngredients = useCallback(async (dayKey: string, meal: MealItem, edits: { index: number; newText: string }[]) => {
    if (!meal.ingredients) return;

    const editRequests = edits.map(edit => {
      const oldIng = meal.ingredients![edit.index];
      return {
        oldName: oldIng.name,
        oldCalories: oldIng.calories,
        oldProtein: oldIng.protein,
        newText: edit.newText
      };
    });

    const parsedData = await parseEditedIngredients(editRequests);

    let deltaCalories = 0;
    let deltaProtein = 0;
    const updatedIngredients = [...meal.ingredients];

    edits.forEach((edit, i) => {
      const oldIng = updatedIngredients[edit.index];
      const newIng = parsedData.ingredients[i];
      if (!newIng) return;

      deltaCalories += (newIng.calories - oldIng.calories);
      deltaProtein += (newIng.protein - oldIng.protein);

      updatedIngredients[edit.index] = newIng;
    });

    const description = updatedIngredients.map(ing => ing.name).join(", ");

    const updatedMeal: MealItem = {
      ...meal,
      ingredients: updatedIngredients,
      calories: Math.max(0, meal.calories + deltaCalories),
      macronutrients: {
        ...meal.macronutrients,
        protein: Math.max(0, meal.macronutrients.protein + deltaProtein),
      },
      mealText: description,
    };

    const alerts = await updateMealLog(dayKey, meal.id, updatedMeal);
    toast.success("המרכיבים עודכנו בהצלחה");
    alerts.forEach((alert) => {
      toast.warning(alert.title, {
        id: `${dayKey}-${alert.id}-edit-ing`,
        description: alert.message,
        duration: 7000,
      });
    });
  }, [updateMealLog]);

  const onOpenMealModal = useCallback(() => setIsMealModalOpen(true), []);
  const onCloseMealModal = useCallback(() => setIsMealModalOpen(false), []);
  const onOpenProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const onCloseProfileModal = useCallback(() => setIsProfileModalOpen(false), []);
  const onCloseEditLog = useCallback(() => setEditingLog(null), []);

  if (!activeUser || !userProfile) {
    return null;
  }

  return (
    <div
      className="relative overflow-x-clip"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative mx-auto max-w-2xl bg-white/20 backdrop-blur-[2px] border-x border-white/10 shadow-2xl"
      >
        <div className="space-y-8 px-4 py-6 pt-safe-top" style={{ paddingBottom: 'calc(16rem + env(safe-area-inset-bottom, 0px))' }}>
          <DashboardTopBar
            periodMode={periodMode}
            onPeriodChange={setPeriodMode}
          />

          <AnimatePresence mode="wait">
            <motion.section
              key={activeScreen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
            {activeScreen === "home" ? (
              <HomeScreen
                periodMode={periodMode}
                periodDetails={periodDetails}
                periodData={periodData}
                periodTargets={periodTargets}
                selectedDailyLog={selectedDailyLog}
                safetyAlerts={safetyAlerts}
                userProfile={userProfile}
                savedSignatures={savedSignatures}
                onDeleteMeal={removeMealLog}
                onSaveFavorite={onSaveFavorite}
                onEditMeal={onEditMeal}
                onIncrementMeal={incrementMealQuantity}
                onDecrementMeal={decrementMealQuantity}
                onDeleteIngredient={onDeleteIngredient}
                onEditIngredients={onEditIngredients}
              />
            ) : null}

            {activeScreen === "calendar" ? (
              <HistoryScreen
                dailyLogs={dailyLogs}
                periodMode={periodMode}
                periodDetails={periodDetails}
                periodData={periodData}
                periodTargets={periodTargets}
                selectedDailyLog={selectedDailyLog}
                safetyAlerts={safetyAlerts}
                selectedDayKey={selectedDayKey}
                savedSignatures={savedSignatures}
                onDateChange={setReferenceDate}
                onSelectDayKey={onSelectArchiveDay}
                onDeleteMeal={removeMealLog}
                onSaveFavorite={onSaveFavorite}
                onEditMeal={onEditMeal}
                onIncrementMeal={onHistoryIncrement}
                onDecrementMeal={onHistoryDecrement}
                onDeleteIngredient={onDeleteIngredient}
                onEditIngredients={onEditIngredients}
              />
            ) : null}

            {activeScreen === "profile" ? (
              <ProfileScreen
                userProfile={userProfile}
                activeUser={activeUser}
                savedMealsCount={savedMeals.length}
                loggedDaysCount={Object.keys(dailyLogs).length}
                onEditProfile={onOpenProfileModal}
              />
            ) : null}

            {activeScreen === "weight" ? (
              <WeightGraphScreen />
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>
    </motion.div>

      <BottomNavigation
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenMealModal={onOpenMealModal}
        onOpenMoreSheet={() => setIsMoreSheetOpen(true)}
      />

      <MorePopover 
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        onNavigate={setActiveScreen}
      />

      <MealLogModal
        isOpen={isMealModalOpen}
        onClose={onCloseMealModal}
        targetDayKey={selectedDayKey}
      />

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={onCloseProfileModal}
      />

      <EditLoggedMealModal
        isOpen={editingLog !== null}
        onClose={onCloseEditLog}
        meal={editingLog?.meal ?? null}
        dayKey={editingLog?.dayKey ?? ""}
      />

      <WeightReminderModal />
      <WeightFeaturePromoModal />
    </div>
  );
}
