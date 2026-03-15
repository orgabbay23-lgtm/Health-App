import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Home, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/utils";
import {
  EMPTY_MICRONUTRIENTS,
  MICRONUTRIENT_KEYS,
  type NutritionSafetyAlert,
  evaluateMicronutrientSafety,
} from "../../utils/nutrition-utils";
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
  type DailyAggregations,
  type DailyLog,
  type MealItem,
  type UserProfile,
} from "../../store";
import { EditProfileModal } from "../profile/EditProfileModal";
import { MealLogModal } from "../meal-logging/MealLogModal";
import { BottomNavigation } from "./components/BottomNavigation";
import { DashboardTopBar } from "./components/DashboardTopBar";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import type { DashboardScreen } from "./types";

const navigationItems: Array<{
  key: DashboardScreen;
  label: string;
  icon: typeof Home;
}> = [
  { key: "home", label: "בית", icon: Home },
  { key: "calendar", label: "יומן", icon: CalendarDays },
  { key: "profile", label: "פרופיל", icon: UserRound },
];

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
  const [activeScreen, setActiveScreen] = useState<DashboardScreen>("home");
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<DashboardPeriod>("daily");
  const [referenceDate, setReferenceDate] = useState(() => getLogicalDate());

  const activeUser = useActiveUser();
  const removeMealLog = useAppStore((state) => state.removeMealLog);
  const saveMealAsFavorite = useAppStore((state) => state.saveMealAsFavorite);
  
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
    const targetMultiplier =
      periodMode === "daily" ? 1 : periodDetails.dayKeys.length;

    return createScaledTargets(baseTargets, targetMultiplier);
  }, [periodDetails.dayKeys.length, periodMode, userProfile]);

  const onSaveFavorite = async (meal: MealItem) => {
    const wasAdded = await saveMealAsFavorite(meal);

    if (wasAdded) {
      toast.success("הארוחה נשמרה במועדפים");
      return;
    }

    toast.message("הארוחה כבר קיימת במועדפים");
  };

  const onSelectArchiveDay = (dayKey: string) => {
    setPeriodMode("daily");
    setReferenceDate(dayKeyToDate(dayKey));
  };

  const onSelectScreen = (screen: DashboardScreen) => {
    setActiveScreen(screen);
  };

  if (!activeUser || !userProfile) {
    return null;
  }

  return (
    <div
      className="relative overflow-x-hidden"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative mx-auto max-w-2xl bg-white/20 backdrop-blur-[2px] border-x border-white/10 shadow-2xl"
      >
        <div className="space-y-8 px-4 py-6 pt-safe-top pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-12">
          <DashboardTopBar
            periodMode={periodMode}
            onPeriodChange={setPeriodMode}
          />

          <div className="hidden md:flex md:flex-wrap md:gap-3 justify-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeScreen === item.key;

              return (
                <motion.div
                  key={item.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    variant={active ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-6 transition-all duration-300",
                      active 
                        ? "shadow-lg shadow-slate-200" 
                        : "border-white/70 bg-white/60 backdrop-blur-md hover:bg-white/90"
                    )}
                    onClick={() => onSelectScreen(item.key)}
                  >
                    <Icon size={16} className="ms-2" />
                    <span className="font-bold">{item.label}</span>
                  </Button>
                </motion.div>
              );
            })}
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:ms-2"
            >
              <Button
                type="button"
                className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 border-none"
                onClick={() => setIsMealModalOpen(true)}
              >
                <Plus size={18} className="ms-2" />
                <span className="font-bold">הוספת ארוחה</span>
              </Button>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeScreen}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 25,
                duration: 0.4 
              }}
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
              />
            ) : null}

            {activeScreen === "profile" ? (
              <ProfileScreen
                userProfile={userProfile}
                activeUser={activeUser}
                savedMealsCount={savedMeals.length}
                loggedDaysCount={Object.keys(dailyLogs).length}
                onEditProfile={() => setIsProfileModalOpen(true)}
              />
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>
    </motion.div>

      <BottomNavigation
        activeScreen={activeScreen}
        onNavigate={onSelectScreen}
        onOpenMealModal={() => setIsMealModalOpen(true)}
      />

      <MealLogModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        targetDayKey={selectedDayKey}
      />

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
