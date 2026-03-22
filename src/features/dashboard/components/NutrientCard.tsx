import { memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
} from "../../../utils/nutritional-tips";
import type { MicronutrientKey } from "../../../utils/nutrition-utils";
import { formatNutritionValue, getNutrientProgressColor } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { cn } from "../../../utils/utils";

interface NutrientCardProps {
  nutrient: MicronutrientKey;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export const NutrientCard = memo(function NutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: NutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const percentageRaw = target > 0 ? (current / target) * 100 : 0;
  const percentageDisplay = Math.round(percentageRaw);
  const percentage = Math.min(Math.max(percentageDisplay, 0), 100);
  const colors = getNutrientProgressColor(nutrient, current, target);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      transition={{ delay: index * 0.02, type: "spring", stiffness: 260, damping: 20 }}
    >
      <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-sm rounded-[1.5rem] border border-white/40">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-black text-slate-600 uppercase tracking-widest leading-none">
                  {meta.label}
                </p>
                <TipPopover
                  content={generateNutritionalTip(nutrient, userProfile)}
                  label={`טיפ עבור ${meta.label}`}
                  className="scale-75 -ms-1"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-900 leading-none">
                  {formatNutritionValue(current)}
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  / {formatNutritionValue(target)} {meta.unit}
                </span>
              </div>
            </div>

            <span className={cn(
              "text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-50/80",
              colors.text
            )}>
              {percentageDisplay}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-100/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.1 + (index * 0.05) }}
              style={{ transform: "translateZ(0)" }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                colors.bg
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
