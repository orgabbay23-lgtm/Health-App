import { Card, CardContent } from "../../../components/ui/card";
import { ExpandablePanel } from "../components/ExpandablePanel";
import { GuidanceCard } from "../components/GuidanceCard";
import { MetricsGrid } from "../components/MetricsGrid";
import { NutrientGrid } from "../components/NutrientGrid";
import { PeriodBreakdown } from "../components/PeriodBreakdown";
import type {
  AggregatedPeriodData,
  PeriodDetails,
} from "../../../utils/date-navigation";
import type { DailyAggregations, MealItem, UserProfile } from "../../../store";

interface MonthlyViewProps {
  userProfile: UserProfile;
  periodDetails: PeriodDetails;
  periodData: AggregatedPeriodData;
  targets: DailyAggregations;
  savedSignatures: Set<string>;
  onSaveFavorite: (meal: MealItem) => void;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
}

export function MonthlyView({
  userProfile,
  periodDetails,
  periodData,
  targets,
  savedSignatures,
  onSaveFavorite,
  onDeleteMeal,
}: MonthlyViewProps) {
  return (
    <div className="space-y-6">
      <GuidanceCard flags={userProfile.targets.guidanceFlags} />

      <MetricsGrid
        current={periodData.aggregations}
        targets={targets}
        userProfile={userProfile}
      />

      <ExpandablePanel
        title="מאזן מיקרונוטריינטים חודשי"
        description="המערכת מרכזת מה נאכל לאורך החודש במקום להעמיס הכל על המסך הראשי"
      >
        <NutrientGrid
          current={periodData.aggregations.micronutrients}
          target={targets.micronutrients}
          userProfile={userProfile}
        />
      </ExpandablePanel>

      <Card className="rounded-[30px] border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900">
              פירוט הימים של החודש
            </h3>
            <p className="text-sm text-slate-500">{periodDetails.label}</p>
          </div>

          <PeriodBreakdown
            days={periodData.days}
            savedSignatures={savedSignatures}
            onSaveFavorite={onSaveFavorite}
            onDeleteMeal={onDeleteMeal}
          />
        </CardContent>
      </Card>
    </div>
  );
}
