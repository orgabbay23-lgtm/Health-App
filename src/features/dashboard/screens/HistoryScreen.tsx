import { motion } from "framer-motion";
import type {
  AggregatedPeriodData,
  DashboardPeriod,
  PeriodDetails,
} from "../../../utils/date-navigation";
import { dayKeyToDate } from "../../../utils/date-navigation";
import type {
  DailyAggregations,
  DailyLog,
  MealItem,
} from "../../../store";
import type { NutritionSafetyAlert } from "../../../utils/nutrition-utils";
import { Card, CardContent } from "../../../components/ui/card";
import { DateNavigator } from "../components/DateNavigator";
import { HistoryArchive } from "../components/HistoryArchive";
import { MealTimeline } from "../components/MealTimeline";
import { PeriodBreakdown } from "../components/PeriodBreakdown";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20 } },
};

interface HistoryScreenProps {
  dailyLogs: Record<string, DailyLog>;
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  selectedDayKey: string;
  savedSignatures: Set<string>;
  onDateChange: (nextDate: Date) => void;
  onSelectDayKey: (dayKey: string) => void;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
  onEditMeal: (dayKey: string, meal: MealItem) => void;
  onIncrementMeal: (dayKey: string, mealId: string) => void;
  onDecrementMeal: (dayKey: string, mealId: string) => void;
  onDeleteIngredient: (dayKey: string, meal: MealItem, ingredientIndex: number) => void;
  onEditIngredients: (dayKey: string, meal: MealItem, edits: { index: number; newText: string }[]) => Promise<void>;
}

export function HistoryScreen({
  dailyLogs,
  periodMode,
  periodDetails,
  periodData,
  periodTargets,
  selectedDailyLog,
  safetyAlerts,
  selectedDayKey,
  savedSignatures,
  onDateChange,
  onSelectDayKey,
  onDeleteMeal,
  onSaveFavorite,
  onEditMeal,
  onIncrementMeal,
  onDecrementMeal,
  onDeleteIngredient,
  onEditIngredients,
}: HistoryScreenProps) {
  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem} className="pt-2">
        <DateNavigator
          periodMode={periodMode}
          periodDetails={periodDetails}
          onDateChange={onDateChange}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="border-none bg-white/40 backdrop-blur-md shadow-soft-lg rounded-[2rem]">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="rounded-full bg-white/50 px-4 py-2 font-bold text-slate-500 uppercase tracking-tighter">
                {periodData.loggedDays} ימים
              </div>
              <div className="rounded-full bg-white/50 px-4 py-2 font-bold text-slate-500 uppercase tracking-tighter">
                {Math.round(periodData.aggregations.calories)} קק"ל
              </div>
              <div className="rounded-full bg-white/50 px-4 py-2 font-bold text-slate-500 uppercase tracking-tighter">
                {Math.round(periodTargets.protein)}ג חלבון
              </div>
              <div className="rounded-full bg-slate-900 px-4 py-2 font-bold text-white uppercase tracking-tighter ms-auto">
                <span dir="ltr">{formatSelectedDate(selectedDayKey)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {periodMode === "daily" && safetyAlerts.length > 0 ? (
        <motion.div variants={staggerItem}>
          <SafetyAlertsCard alerts={safetyAlerts} />
        </motion.div>
      ) : null}

      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <HistoryArchive
          dailyLogs={dailyLogs}
          selectedDayKey={selectedDayKey}
          onSelect={onSelectDayKey}
        />

        <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-xl rounded-[2.5rem]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {periodMode === "daily" ? "ארוחות ביום שנבחר" : "פירוט התקופה"}
            </h3>

            {periodMode === "daily" ? (
              <MealTimeline
                meals={selectedDailyLog?.meals ?? []}
                onDelete={(mealId) => onDeleteMeal(selectedDayKey, mealId)}
                onSaveFavorite={onSaveFavorite}
                onEdit={(meal) => onEditMeal(selectedDayKey, meal)}
                onIncrement={(mealId) => onIncrementMeal(selectedDayKey, mealId)}
                onDecrement={(mealId) => onDecrementMeal(selectedDayKey, mealId)}
                onDeleteIngredient={(meal, idx) => onDeleteIngredient(selectedDayKey, meal, idx)}
                onEditIngredients={(meal, edits) => onEditIngredients(selectedDayKey, meal, edits)}
                savedSignatures={savedSignatures}
                emptyText="אין תיעוד לתאריך זה."
              />
            ) : (
              <PeriodBreakdown
                days={periodData.days}
                savedSignatures={savedSignatures}
                onSaveFavorite={onSaveFavorite}
                onDeleteMeal={onDeleteMeal}
                onEditMeal={onEditMeal}
                onIncrementMeal={onIncrementMeal}
                onDecrementMeal={onDecrementMeal}
                onDeleteIngredient={onDeleteIngredient}
                onEditIngredients={onEditIngredients}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function formatSelectedDate(dayKey: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dayKeyToDate(dayKey));
}
