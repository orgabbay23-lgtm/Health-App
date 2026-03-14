import { HistoryArchive } from "../components/HistoryArchive";
import { SnapshotHero } from "../components/SnapshotHero";
import { DateNavigator } from "../components/DateNavigator";
import { PeriodTabs } from "../components/PeriodTabs";
import { PeriodView } from "../views/PeriodView";
import type {
  AggregatedPeriodData,
  DashboardPeriod,
  PeriodDetails,
} from "../../../utils/date-navigation";
import type {
  DailyAggregations,
  DailyLog,
  MealItem,
  UserProfile,
} from "../../../store";
import type { NutritionSafetyAlert } from "../../../utils/nutrition-utils";

interface HistoryScreenProps {
  dailyLogs: Record<string, DailyLog>;
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  selectedDayKey: string;
  userProfile: UserProfile;
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
  userProfile,
  savedSignatures,
  onPeriodChange,
  onDateChange,
  onSelectDayKey,
  onDeleteMeal,
  onSaveFavorite,
}: HistoryScreenProps) {
  return (
    <div className="space-y-6">
      <SnapshotHero
        eyebrow="HISTORY"
        title="מעבר מהיר בין ימים, שבועות וחודשים"
        subtitle="כל הרישומים נשמרים לפי מפתח `YYYY-MM-DD`, ולכן אפשר לנווט אחורה עד חודשיים, להציג אגרגציות נקיות ולפתוח כל יום לעומק רק בלחיצה."
        stats={[
          { label: "טווח נבחר", value: periodDetails.label },
          { label: "ימים מתועדים", value: String(periodData.loggedDays) },
          {
            label: "קלוריות בטווח",
            value: `${Math.round(periodData.aggregations.calories)}`,
          },
          { label: "חודש אחורה", value: "עד 2 חודשים" },
        ]}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        <DateNavigator
          periodMode={periodMode}
          periodDetails={periodDetails}
          onDateChange={onDateChange}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <HistoryArchive
          dailyLogs={dailyLogs}
          selectedDayKey={selectedDayKey}
          onSelect={onSelectDayKey}
        />

        <PeriodView
          periodMode={periodMode}
          periodDetails={periodDetails}
          userProfile={userProfile}
          periodData={periodData}
          periodTargets={periodTargets}
          selectedDailyLog={selectedDailyLog}
          safetyAlerts={safetyAlerts}
          savedSignatures={savedSignatures}
          onDeleteMeal={onDeleteMeal}
          onSaveFavorite={onSaveFavorite}
        />
      </div>
    </div>
  );
}
