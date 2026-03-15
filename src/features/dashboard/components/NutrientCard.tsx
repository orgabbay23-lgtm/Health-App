import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
} from "../../../utils/nutritional-tips";
import type { MicronutrientKey } from "../../../utils/nutrition-utils";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { getProgressAppearance } from "./progress-tone";
import { cn } from "../../../utils/utils";

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
  const appearance = getProgressAppearance(current, target, "micronutrient");
  const percentage = Math.min(Math.max(appearance.percentage, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
    >
      <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-sm rounded-[1.5rem] border border-white/40">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
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
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  / {formatNutritionValue(target)} {meta.unit}
                </span>
              </div>
            </div>

            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full",
              appearance.badgeClass
            )}>
              {appearance.percentage}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-100/80 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 + (index * 0.05) }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                appearance.barClass,
                appearance.glowClass
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
