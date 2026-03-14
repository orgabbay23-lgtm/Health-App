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
import { DailyView } from "./DailyView";
import { WeeklyView } from "./WeeklyView";
import { MonthlyView } from "./MonthlyView";

interface PeriodViewProps {
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  userProfile: UserProfile;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  savedSignatures: Set<string>;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
}

export function PeriodView({
  periodMode,
  periodDetails,
  userProfile,
  periodData,
  periodTargets,
  selectedDailyLog,
  safetyAlerts,
  savedSignatures,
  onDeleteMeal,
  onSaveFavorite,
}: PeriodViewProps) {
  if (periodMode === "daily") {
    return (
      <DailyView
        dayKey={periodDetails.startKey}
        userProfile={userProfile}
        current={periodData.aggregations}
        meals={selectedDailyLog?.meals ?? []}
        safetyAlerts={safetyAlerts}
        savedSignatures={savedSignatures}
        onDeleteMeal={onDeleteMeal}
        onSaveFavorite={onSaveFavorite}
      />
    );
  }

  if (periodMode === "weekly") {
    return (
      <WeeklyView
        userProfile={userProfile}
        periodDetails={periodDetails}
        periodData={periodData}
        targets={periodTargets}
        savedSignatures={savedSignatures}
        onSaveFavorite={onSaveFavorite}
        onDeleteMeal={onDeleteMeal}
      />
    );
  }

  return (
    <MonthlyView
      userProfile={userProfile}
      periodDetails={periodDetails}
      periodData={periodData}
      targets={periodTargets}
      savedSignatures={savedSignatures}
      onSaveFavorite={onSaveFavorite}
      onDeleteMeal={onDeleteMeal}
    />
  );
}
