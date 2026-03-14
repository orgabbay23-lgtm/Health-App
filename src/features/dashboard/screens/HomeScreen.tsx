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
import { Card, CardContent } from "../../../components/ui/card";
import { CompactNutrientCard } from "../components/CompactNutrientCard";
import { DateNavigator } from "../components/DateNavigator";
import { FullNutritionAccordion } from "../components/FullNutritionAccordion";
import { GuidanceCard } from "../components/GuidanceCard";
import { MealTimeline } from "../components/MealTimeline";
import { PeriodBreakdown } from "../components/PeriodBreakdown";
import { PeriodTabs } from "../components/PeriodTabs";
import { PrimaryNutrientCard } from "../components/PrimaryNutrientCard";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";

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
  const meals = selectedDailyLog?.meals ?? [];

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

      <Card className="border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(249,250,251,0.92))] shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
              OVERVIEW
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              תמונת מצב נקייה ל{periodMode === "daily" ? "יום" : periodMode === "weekly" ? "שבוע" : "חודש"} הנבחר
            </h2>
            <p className="text-sm text-slate-500">{periodDetails.caption}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              {periodData.loggedDays} ימים עם רישום
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              {periodData.totalMeals} ארוחות בתקופה
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5">
              <span dir="ltr">{periodDetails.startKey}</span>
              <span className="mx-1">-</span>
              <span dir="ltr">{periodDetails.endKey}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {userProfile.targets.guidanceFlags.length > 0 ? (
        <GuidanceCard flags={userProfile.targets.guidanceFlags} />
      ) : null}

      {periodMode === "daily" && safetyAlerts.length > 0 ? (
        <SafetyAlertsCard alerts={safetyAlerts} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PrimaryNutrientCard
          nutrient="calories"
          current={periodData.aggregations.calories}
          target={periodTargets.calories}
          userProfile={userProfile}
        />
        <PrimaryNutrientCard
          nutrient="protein"
          current={periodData.aggregations.protein}
          target={periodTargets.protein}
          userProfile={userProfile}
          index={1}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CompactNutrientCard
          nutrient="carbs"
          current={periodData.aggregations.carbs}
          target={periodTargets.carbs}
          userProfile={userProfile}
        />
        <CompactNutrientCard
          nutrient="fat"
          current={periodData.aggregations.fat}
          target={periodTargets.fat}
          userProfile={userProfile}
        />
      </div>

      <FullNutritionAccordion
        current={periodData.aggregations.micronutrients}
        target={periodTargets.micronutrients}
        userProfile={userProfile}
      />

      <Card className="border-white/70 bg-white/90 shadow-[0_22px_56px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-5 p-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-950">
              {periodMode === "daily" ? "רישומים אחרונים" : "פירוט התקופה"}
            </h3>
            <p className="text-sm text-slate-500">
              {periodMode === "daily"
                ? "כל ארוחה ניתנת למחיקה, לפתיחה מהירה ולשמירה כמועדפת."
                : "פותחים יום כדי לראות ארוחות, למחוק פריטים או לשמור מועדפים."}
            </p>
          </div>

          {periodMode === "daily" ? (
            <MealTimeline
              meals={meals}
              onDelete={(mealId) => onDeleteMeal(periodDetails.startKey, mealId)}
              onSaveFavorite={onSaveFavorite}
              savedSignatures={savedSignatures}
              emptyText="עדיין לא נרשמו ארוחות ביום הזה."
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
  );
}
