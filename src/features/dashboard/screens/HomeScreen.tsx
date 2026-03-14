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

interface HomeScreenProps {
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  userProfile: UserProfile;
  savedSignatures: Set<string>;
  onPeriodChange: (nextMode: DashboardPeriod) => void;
  onDateChange: (nextDate: Date) => void;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
}

export function HomeScreen({
  periodMode,
  periodDetails,
  periodData,
  periodTargets,
  selectedDailyLog,
  safetyAlerts,
  userProfile,
  savedSignatures,
  onPeriodChange,
  onDateChange,
  onDeleteMeal,
  onSaveFavorite,
}: HomeScreenProps) {
  return (
    <div className="space-y-6">
      <SnapshotHero
        eyebrow="HOME DASHBOARD"
        title="מעקב יומי בעיצוב נקי, רגוע ומדויק"
        subtitle="כל מה שחשוב להיום, לשבוע או לחודש נמצא במקום אחד, עם פירוט שנפתח רק כשצריך ומבלי לפגוע בלוגיקה הקלינית שמאחורי המספרים."
        stats={[
          { label: "ימים עם רישום", value: String(periodData.loggedDays) },
          { label: "ארוחות בטווח", value: String(periodData.totalMeals) },
          { label: "חלון פעיל", value: periodDetails.caption },
          {
            label: "חלבון יעד",
            value: `${Math.round(periodTargets.protein)} ג'`,
          },
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
  );
}
