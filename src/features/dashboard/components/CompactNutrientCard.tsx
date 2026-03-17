import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { getProgressAppearance } from "./progress-tone";
import { cn } from "../../../utils/utils";

interface CompactNutrientCardProps {
  nutrient: Extract<TrackedNutrientKey, "protein" | "carbs" | "fat">;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export function CompactNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: CompactNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const appearance = getProgressAppearance(current, target, nutrient, nutrient);
  const percentage = Math.min(Math.max(appearance.percentage, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="flex-1 relative"
    >
      {appearance.isNearGoal && (
        <div className="absolute -top-2 -right-2 pointer-events-none z-10">
          <motion.div
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          >
            <Sparkles className="text-yellow-400 w-5 h-5 drop-shadow-sm" />
          </motion.div>
        </div>
      )}

      <Card className="border-none bg-white/40 backdrop-blur-md shadow-soft-xl rounded-[2rem] border border-white/60">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[13px] font-black text-slate-600 uppercase tracking-[0.15em]">{meta.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-950">{formatNutritionValue(current)}</span>
                <span className="text-[11px] font-bold text-slate-500">/ {formatNutritionValue(target)}</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100/50"
            >
              <TipPopover
                content={generateNutritionalTip(nutrient, userProfile)}
                label={`טיפ עבור ${meta.label}`}
                className="scale-90"
              />
            </motion.div>
          </div>

          <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ 
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.3 + (index * 0.1) 
              }}
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
