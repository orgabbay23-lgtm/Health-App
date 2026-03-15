import {
  MICRONUTRIENT_KEYS,
  type MicronutrientKey,
  type MicronutrientTotals,
} from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { NutrientCard } from "./NutrientCard";

interface NutrientGridProps {
  current: MicronutrientTotals;
  target: MicronutrientTotals;
  userProfile: UserProfile;
}

const PRIORITIZED_MICROS: MicronutrientKey[] = [
  "iron",
  "calcium",
  "vitaminC",
  "vitaminD",
  "magnesium",
];

export function NutrientGrid({
  current,
  target,
  userProfile,
}: NutrientGridProps) {
  // Combine prioritized first, then the rest
  const sortedKeys = [
    ...PRIORITIZED_MICROS,
    ...MICRONUTRIENT_KEYS.filter(key => !PRIORITIZED_MICROS.includes(key))
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {sortedKeys.map((nutrient, index) => (
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
