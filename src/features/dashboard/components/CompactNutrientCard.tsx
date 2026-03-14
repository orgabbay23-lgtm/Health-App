import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";

interface CompactNutrientCardProps {
  nutrient: Extract<TrackedNutrientKey, "carbs" | "fat">;
  current: number;
  target: number;
  userProfile: UserProfile;
}

export function CompactNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
}: CompactNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];

  return (
    <Card className="border-white/70 bg-white/86 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{meta.label}</p>
          <p className="text-lg font-semibold text-slate-950">
            {formatNutritionValue(current)}
            <span className="ms-2 text-sm font-normal text-slate-400">
              / {formatNutritionValue(target)} {meta.unit}
            </span>
          </p>
        </div>

        <TipPopover
          content={generateNutritionalTip(nutrient, userProfile)}
          label={`טיפ עבור ${meta.label}`}
          className="shrink-0"
        />
      </CardContent>
    </Card>
  );
}
