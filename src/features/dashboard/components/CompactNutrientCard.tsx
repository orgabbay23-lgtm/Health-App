import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue, getNutrientProgressColor } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
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
  const percentageRaw = target > 0 ? (current / target) * 100 : 0;
  const isNearGoal = percentageRaw >= 90 && percentageRaw <= 110;
  const percentage = Math.min(Math.max(Math.round(percentageRaw), 0), 100);
  const colors = getNutrientProgressColor(nutrient, current, target);

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
      className="h-full relative"
    >
      {isNearGoal && (
        <div className="absolute -top-2 -right-2 pointer-events-none z-10">
          <motion.div
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          >
            <Sparkles className="text-yellow-400 w-5 h-5 drop-shadow-sm" />
          </motion.div>
        </div>
      )}

      <Card className="h-full flex flex-col border-none bg-white/40 backdrop-blur-md shadow-soft-xl rounded-[2rem] border border-white/60">
        <CardContent className="flex-1 flex flex-col justify-between gap-3 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-1 min-w-0">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-[11px] sm:text-[13px] font-black text-slate-600 uppercase tracking-[0.15em] truncate">{meta.label}</p>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap",
                    percentageRaw > 100
                      ? "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {Math.round(percentageRaw)}%
                </motion.span>
              </div>
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={current}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-lg sm:text-xl font-black text-slate-950"
                  >
                    {formatNutritionValue(current)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">/ {formatNutritionValue(target)}</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-white shadow-sm border border-slate-100/50 shrink-0"
            >
              <TipPopover
                content={generateNutritionalTip(nutrient, userProfile)}
                label={`טיפ עבור ${meta.label}`}
                className="scale-75 sm:scale-90"
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
                colors.bg
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
