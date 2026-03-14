import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Home, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../../components/ui/button";
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
  const users = useAppStore(useShallow((state) => Object.values(state.users)));
  const removeMealLog = useAppStore((state) => state.removeMealLog);
  const saveMealAsFavorite = useAppStore((state) => state.saveMealAsFavorite);
  const selectUser = useAppStore((state) => state.selectUser);
  
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

  const onSaveFavorite = (meal: MealItem) => {
    const wasAdded = saveMealAsFavorite(meal);

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

  const onSelectUser = (userId: string | null) => {
    selectUser(userId);
    setActiveScreen("home");
  };

  if (!activeUser || !userProfile) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,245,235,0.9),_rgba(255,255,255,0.96)_40%,_rgba(237,246,255,0.95)_78%),linear-gradient(180deg,_#f6f2ea_0%,_#f8fafc_50%,_#edf6ff_100%)]"
      dir="rtl"
    >
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 pb-28 md:pb-8">
        <DashboardTopBar
          activeUser={activeUser}
          selectedDayKey={selectedDayKey}
          onOpenMealModal={() => setIsMealModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onSwitchUser={() => onSelectUser(null)}
        />

        <div className="hidden md:flex md:flex-wrap md:gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.key;

            return (
              <Button
                key={item.key}
                type="button"
                variant={active ? "default" : "outline"}
                className={active ? "rounded-full" : "rounded-full border-white/70 bg-white/88"}
                onClick={() => onSelectScreen(item.key)}
              >
                <Icon size={16} className="ms-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeScreen}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
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
                onPeriodChange={setPeriodMode}
                onDateChange={setReferenceDate}
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
                onPeriodChange={setPeriodMode}
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
                users={users}
                savedMealsCount={savedMeals.length}
                loggedDaysCount={Object.keys(dailyLogs).length}
                onEditProfile={() => setIsProfileModalOpen(true)}
                onSelectUser={onSelectUser}
              />
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>

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
