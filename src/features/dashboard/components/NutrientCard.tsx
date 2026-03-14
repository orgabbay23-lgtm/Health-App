import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
} from "../../../utils/nutritional-tips";
import type { MicronutrientKey } from "../../../utils/nutrition-utils";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { getProgressAppearance } from "./progress-tone";

interface NutrientCardProps {
  nutrient: MicronutrientKey;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export function NutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: NutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const appearance = getProgressAppearance(current, target);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Card className="rounded-[24px] border-white/65 bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {meta.label}
                </p>
                <TipPopover
                  content={generateNutritionalTip(nutrient, userProfile)}
                  label={`טיפ עבור ${meta.label}`}
                />
              </div>
              <p className="text-sm text-slate-500">
                {formatNutritionValue(current)} / {formatNutritionValue(target)}{" "}
                {meta.unit}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${appearance.badgeClass}`}
            >
              {appearance.percentage}%
            </span>
          </div>

          <Progress
            value={Math.min(appearance.percentage, 100)}
            indicatorClassName={appearance.barClass}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
