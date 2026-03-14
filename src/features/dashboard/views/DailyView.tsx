import { Card, CardContent } from "../../../components/ui/card";
import { ExpandablePanel } from "../components/ExpandablePanel";
import { GuidanceCard } from "../components/GuidanceCard";
import { MealTimeline } from "../components/MealTimeline";
import { MetricsGrid } from "../components/MetricsGrid";
import { NutrientGrid } from "../components/NutrientGrid";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";
import type { DailyAggregations, MealItem, UserProfile } from "../../../store";
import type { NutritionSafetyAlert } from "../../../utils/nutrition-utils";

interface DailyViewProps {
  dayKey: string;
  userProfile: UserProfile;
  current: DailyAggregations;
  meals: MealItem[];
  safetyAlerts: NutritionSafetyAlert[];
  savedSignatures: Set<string>;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
}

export function DailyView({
  dayKey,
  userProfile,
  current,
  meals,
  safetyAlerts,
  savedSignatures,
  onDeleteMeal,
  onSaveFavorite,
}: DailyViewProps) {
  return (
    <div className="space-y-6">
      <GuidanceCard flags={userProfile.targets.guidanceFlags} />
      <SafetyAlertsCard alerts={safetyAlerts} />

      <MetricsGrid
        current={current}
        targets={userProfile.targets}
        userProfile={userProfile}
      />

      <ExpandablePanel
        title="ויטמינים ומינרלים"
        description="התצוגה המורחבת נפתחת רק כשצריך, כדי לשמור על dashboard נקי"
        defaultOpen
      >
        <NutrientGrid
          current={current.micronutrients}
          target={userProfile.targets.micronutrients}
          userProfile={userProfile}
        />
      </ExpandablePanel>

      <Card className="rounded-[30px] border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900">
              ארוחות ליום הנבחר
            </h3>
            <p className="text-sm text-slate-500">{dayKey}</p>
          </div>

          <MealTimeline
            meals={meals}
            onDelete={(mealId) => onDeleteMeal(dayKey, mealId)}
            onSaveFavorite={onSaveFavorite}
            savedSignatures={savedSignatures}
            emptyText="עדיין לא נרשמו ארוחות ביום הזה."
          />
        </CardContent>
      </Card>
    </div>
  );
}
