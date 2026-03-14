import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  Home,
  type LucideIcon,
  Plus,
  Settings2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  DashboardPeriod,
  aggregatePeriodLogs,
  dayKeyToDate,
  formatDayKey,
  getLogicalDate,
  getPeriodDetails,
} from "../../utils/date-navigation";
import {
  EMPTY_MICRONUTRIENTS,
  MICRONUTRIENT_KEYS,
  NutritionSafetyAlert,
  evaluateMicronutrientSafety,
} from "../../utils/nutrition-utils";
import {
  DailyAggregations,
  DailyLog,
  MealItem,
  UserProfile,
  useAppStore,
} from "../../store";
import { MealLogModal } from "../meal-logging/MealLogModal";
import { EditProfileModal } from "../profile/EditProfileModal";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

type ScreenKey = "home" | "history" | "profile";

const navigationItems: Array<{
  key: ScreenKey;
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    key: "home",
    label: "בית",
    icon: Home,
    description: "התמונה היומית והתקופתית",
  },
  {
    key: "history",
    label: "היסטוריה",
    icon: CalendarDays,
    description: "מעבר מהיר בין רישומים קודמים",
  },
  {
    key: "profile",
    label: "פרופיל",
    icon: UserRound,
    description: "יעדים, ביומטריה והגדרות",
  },
];

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

function buildBaseTargets(targets: UserProfile["targets"]): DailyAggregations {
  return {
    calories: targets.calories,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
    micronutrients: targets.micronutrients,
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
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [periodMode, setPeriodMode] = useState<DashboardPeriod>("daily");
  const [referenceDate, setReferenceDate] = useState(() => getLogicalDate());

  const userProfile = useAppStore((state) => state.userProfile);
  const dailyLogs = useAppStore((state) => state.dailyLogs);
  const savedMeals = useAppStore((state) => state.savedMeals);
  const removeMealLog = useAppStore((state) => state.removeMealLog);
  const saveMealAsFavorite = useAppStore((state) => state.saveMealAsFavorite);

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

  if (!userProfile) {
    return null;
  }

  const baseTargets = buildBaseTargets(userProfile.targets);
  const targetMultiplier =
    periodMode === "daily" ? 1 : periodDetails.dayKeys.length;
  const periodTargets = createScaledTargets(baseTargets, targetMultiplier);

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

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_25%),linear-gradient(180deg,_#f8fbff_0%,_#edf4fb_52%,_#f8fafc_100%)]"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <Card className="rounded-[34px] border-white/60 bg-slate-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
              <CardContent className="space-y-6 p-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-[0.22em] text-sky-300">
                    HEALTH OS
                  </p>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold leading-tight">
                      Nutrition Command Center
                    </h1>
                    <p className="text-sm leading-6 text-slate-300">
                      מעקב תזונתי אישי עם עיצוב SaaS נקי, היסטוריה לוגית
                      ומועדפים בלחיצה אחת.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeScreen === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`w-full rounded-[24px] border px-4 py-4 text-right transition ${
                          active
                            ? "border-white/20 bg-white/10 shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
                            : "border-transparent bg-white/5 hover:bg-white/8"
                        }`}
                        onClick={() => setActiveScreen(item.key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-white/10 p-3">
                            <Icon size={18} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold">{item.label}</p>
                            <p className="text-xs text-slate-300">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                        FAVORITES
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {savedMeals.length} ארוחות שמורות
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-rose-200">
                      <Heart size={18} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {savedMeals.slice(0, 3).map((savedMeal) => (
                      <div
                        key={savedMeal.id}
                        className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-100"
                      >
                        {savedMeal.meal.meal_name}
                      </div>
                    ))}
                    {savedMeals.length === 0 ? (
                      <p className="text-sm text-slate-300">
                        שמור ארוחות מהיומן כדי לבנות ספריית מועדפים.
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-6 pb-24 xl:pb-6">
            <Card className="rounded-[34px] border-white/60 bg-white/92 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
              <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                    ACTIVE DAY
                  </p>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-slate-950">
                      {periodDetails.label}
                    </h2>
                    <p className="text-sm text-slate-500">
                      הוספת ארוחה תירשם ליום {selectedDayKey} ותכבד את כל כללי
                      ה-3AM rollover.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-5"
                    onClick={() => setIsProfileModalOpen(true)}
                  >
                    <Settings2 size={16} className="ms-2" />
                    עריכת פרופיל
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
                    onClick={() => setIsMealModalOpen(true)}
                  >
                    <Plus size={16} className="ms-2" />
                    הוסף ארוחה
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              <motion.section
                key={activeScreen}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="space-y-6"
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

                {activeScreen === "history" ? (
                  <HistoryScreen
                    dailyLogs={dailyLogs}
                    periodMode={periodMode}
                    periodDetails={periodDetails}
                    periodData={periodData}
                    periodTargets={periodTargets}
                    selectedDailyLog={selectedDailyLog}
                    safetyAlerts={safetyAlerts}
                    selectedDayKey={selectedDayKey}
                    userProfile={userProfile}
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
                    savedMealsCount={savedMeals.length}
                    loggedDaysCount={Object.keys(dailyLogs).length}
                    onEditProfile={() => setIsProfileModalOpen(true)}
                  />
                ) : null}
              </motion.section>
            </AnimatePresence>
          </main>
        </div>

        <div className="fixed inset-x-4 bottom-4 z-40 xl:hidden">
          <Card className="rounded-[28px] border-white/70 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.14)] backdrop-blur">
            <CardContent className="grid grid-cols-3 gap-2 p-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = activeScreen === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`rounded-[20px] px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.16)]"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                    onClick={() => setActiveScreen(item.key)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

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
