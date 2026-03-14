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
    <div className="space-y-5">
      <div className="space-y-4">
        <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        <DateNavigator
          periodMode={periodMode}
          periodDetails={periodDetails}
          onDateChange={onDateChange}
        />
      </div>

      <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
              HISTORY
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              ניווט חופשי אחורה עד חודשיים
            </h2>
            <p className="text-sm text-slate-500">
              בחר תקופה למעלה, קפוץ לתאריך הרצוי, ואז פתח יום מסוים מתוך הארכיון
              המהיר.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              {periodData.loggedDays} ימים מתועדים
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              {Math.round(periodData.aggregations.calories)} קק"ל בתקופה
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              יעד חלבון: {Math.round(periodTargets.protein)} גרם
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              <span dir="ltr">{selectedDayKey}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {periodMode === "daily" && safetyAlerts.length > 0 ? (
        <SafetyAlertsCard alerts={safetyAlerts} />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <HistoryArchive
          dailyLogs={dailyLogs}
          selectedDayKey={selectedDayKey}
          onSelect={onSelectDayKey}
        />

        <Card className="border-white/70 bg-white/90 shadow-[0_22px_56px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-950">
                {periodMode === "daily" ? "היום שנבחר" : "פירוט ימים בתקופה"}
              </h3>
              <p className="text-sm text-slate-500">
                {periodMode === "daily"
                  ? "כאן תראה את כל הארוחות של התאריך המסומן."
                  : "פתח יום כלשהו כדי לראות מה נרשם בו ולשמור ארוחות למועדפים."}
              </p>
            </div>

            {periodMode === "daily" ? (
              <MealTimeline
                meals={selectedDailyLog?.meals ?? []}
                onDelete={(mealId) => onDeleteMeal(selectedDayKey, mealId)}
                onSaveFavorite={onSaveFavorite}
                savedSignatures={savedSignatures}
                emptyText="אין רישומים לתאריך שנבחר."
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
