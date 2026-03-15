import type {
  AggregatedPeriodData,
  DashboardPeriod,
  PeriodDetails,
} from "../../../utils/date-navigation";
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
import { PeriodTabs } from "../components/PeriodTabs";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";

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
  onPeriodChange: (nextMode: DashboardPeriod) => void;
  onDateChange: (nextDate: Date) => void;
  onSelectDayKey: (dayKey: string) => void;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
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
  onPeriodChange,
  onDateChange,
  onSelectDayKey,
  onDeleteMeal,
  onSaveFavorite,
}: HistoryScreenProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        <DateNavigator
          periodMode={periodMode}
          periodDetails={periodDetails}
          onDateChange={onDateChange}
        />
      </div>

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
              <span dir="ltr">{selectedDayKey}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {periodMode === "daily" && safetyAlerts.length > 0 ? (
        <SafetyAlertsCard alerts={safetyAlerts} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <HistoryArchive
          dailyLogs={dailyLogs}
          selectedDayKey={selectedDayKey}
          onSelect={onSelectDayKey}
        />

        <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="space-y-6 p-6 md:p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {periodMode === "daily" ? "ארוחות ביום שנבחר" : "פירוט התקופה"}
            </h3>

            {periodMode === "daily" ? (
              <MealTimeline
                meals={selectedDailyLog?.meals ?? []}
                onDelete={(mealId) => onDeleteMeal(selectedDayKey, mealId)}
                onSaveFavorite={onSaveFavorite}
                savedSignatures={savedSignatures}
                emptyText="אין תיעוד לתאריך זה."
              />
            ) : (
              <PeriodBreakdown
                days={periodData.days}
                savedSignatures={savedSignatures}
                onSaveFavorite={onSaveFavorite}
                onDeleteMeal={onDeleteMeal}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
