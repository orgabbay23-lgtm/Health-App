import {
  MICRONUTRIENT_KEYS,
  MicronutrientTotals,
} from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { NutrientCard } from "./NutrientCard";

interface NutrientGridProps {
  current: MicronutrientTotals;
  target: MicronutrientTotals;
  userProfile: UserProfile;
}

export function NutrientGrid({
  current,
  target,
  userProfile,
}: NutrientGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {MICRONUTRIENT_KEYS.map((nutrient, index) => (
        <NutrientCard
          key={nutrient}
          nutrient={nutrient}
          current={current[nutrient]}
          target={target[nutrient]}
          userProfile={userProfile}
          index={index}
        />
      ))}
    </div>
  );
}
