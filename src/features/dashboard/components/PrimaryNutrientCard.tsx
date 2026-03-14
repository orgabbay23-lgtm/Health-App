import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { getProgressAppearance } from "./progress-tone";

interface PrimaryNutrientCardProps {
  nutrient: Extract<TrackedNutrientKey, "calories" | "protein">;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export function PrimaryNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: PrimaryNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const appearance = getProgressAppearance(current, target);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
    >
      <Card className="border-white/70 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.07)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{meta.label}</p>
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-3xl font-semibold tracking-tight text-slate-950">
                  {formatNutritionValue(current)}
                </span>
                <span className="pb-1 text-sm text-slate-400">
                  מתוך {formatNutritionValue(target)} {meta.unit}
                </span>
              </div>
            </div>

            <TipPopover
              content={generateNutritionalTip(nutrient, userProfile)}
              label={`טיפ עבור ${meta.label}`}
            />
          </div>

          <div className="space-y-3">
            <Progress
              value={Math.min(appearance.percentage, 100)}
              className="h-2.5 bg-slate-100"
              indicatorClassName={appearance.barClass}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">התקדמות מול היעד</span>
              <span className={`rounded-full px-3 py-1 font-medium ${appearance.badgeClass}`}>
                {appearance.percentage}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
