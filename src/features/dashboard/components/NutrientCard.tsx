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

/* Map the clinical status colour → vivid gradient + tinted card/badge,
   so the micronutrient grid reads colourful & alive while keeping the
   semantic meaning of the colour (blue=low, teal/green=on-track, etc.). */
const VIVID_BY_STATUS: Record<
  string,
  { bar: string; badge: string; value: string; card: string }
> = {
  "bg-blue-500": {
    bar: "from-blue-400 to-indigo-500",
    badge: "bg-blue-100 text-blue-600",
    value: "text-blue-600",
    card: "from-blue-50/80 border-blue-100/70",
  },
  "bg-orange-500": {
    bar: "from-orange-400 to-amber-500",
    badge: "bg-orange-100 text-orange-600",
    value: "text-orange-600",
    card: "from-orange-50/80 border-orange-100/70",
  },
  "bg-rose-500": {
    bar: "from-rose-400 to-red-500",
    badge: "bg-rose-100 text-rose-600",
    value: "text-rose-600",
    card: "from-rose-50/80 border-rose-100/70",
  },
  "bg-teal-400": {
    bar: "from-teal-400 to-cyan-500",
    badge: "bg-teal-100 text-teal-600",
    value: "text-teal-600",
    card: "from-teal-50/80 border-teal-100/70",
  },
  "bg-emerald-500": {
    bar: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-600",
    card: "from-emerald-50/80 border-emerald-100/70",
  },
};

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
  const v = VIVID_BY_STATUS[colors.bg] ?? VIVID_BY_STATUS["bg-teal-400"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      transition={{ delay: index * 0.02, type: "spring", stiffness: 260, damping: 20 }}
    >
      <Card className={cn(
        "specular bg-gradient-to-b to-white/70 backdrop-blur-sm shadow-premium rounded-[1.5rem] border",
        v.card,
      )}>
        <CardContent className="flex flex-col gap-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <p className="text-[12px] font-black text-slate-700 tracking-tight leading-tight break-words">
                {meta.label}
              </p>
              <TipPopover
                content={generateNutritionalTip(nutrient, userProfile)}
                label={`טיפ עבור ${meta.label}`}
                className="scale-75 -ms-1 shrink-0"
              />
            </div>

            <span className={cn(
              "shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full",
              v.badge,
            )}>
              {percentageDisplay}%
            </span>
          </div>

          <div className="flex items-baseline gap-1 flex-wrap">
            <span className={cn("text-base font-black leading-none", v.value)}>
              {formatNutritionValue(current)}
            </span>
            <span className="text-[11px] font-bold text-slate-400 tracking-tighter">
              / {formatNutritionValue(target)} {meta.unit}
            </span>
          </div>

          <div className="h-2.5 w-full bg-white/70 border border-white/70 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.1 + (index * 0.05) }}
              style={{ transform: "translateZ(0)" }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r shadow-sm",
                v.bar,
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
