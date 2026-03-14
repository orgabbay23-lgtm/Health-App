import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  TrackedNutrientKey,
  generateNutritionalTip,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { getProgressAppearance } from "./progress-tone";

interface MetricCardProps {
  nutrient: Extract<
    TrackedNutrientKey,
    "calories" | "protein" | "carbs" | "fat"
  >;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export function MetricCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: MetricCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const appearance = getProgressAppearance(current, target);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
    >
      <Card className="h-full rounded-[28px] border-white/65 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{meta.label}</p>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                {formatNutritionValue(current)}
                <span className="ms-2 text-sm font-medium text-slate-400">
                  / {formatNutritionValue(target)} {meta.unit}
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
              indicatorClassName={appearance.barClass}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">התקדמות מול היעד</span>
              <span
                className={`rounded-full px-3 py-1 font-medium ${appearance.badgeClass}`}
              >
                {appearance.percentage}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
