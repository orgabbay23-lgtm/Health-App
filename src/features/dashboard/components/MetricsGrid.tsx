import type { UserProfile } from "../../../store";
import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  current: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  userProfile: UserProfile;
}

export function MetricsGrid({
  current,
  targets,
  userProfile,
}: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        nutrient="calories"
        current={current.calories}
        target={targets.calories}
        userProfile={userProfile}
      />
      <MetricCard
        nutrient="protein"
        current={current.protein}
        target={targets.protein}
        userProfile={userProfile}
        index={1}
      />
      <MetricCard
        nutrient="carbs"
        current={current.carbs}
        target={targets.carbs}
        userProfile={userProfile}
        index={2}
      />
      <MetricCard
        nutrient="fat"
        current={current.fat}
        target={targets.fat}
        userProfile={userProfile}
        index={3}
      />
    </div>
  );
}
