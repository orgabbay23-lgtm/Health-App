import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Beef, Wheat, Droplet, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { cn } from "../../../utils/utils";

type MacroKey = Extract<TrackedNutrientKey, "protein" | "carbs" | "fat">;

/* Per-macro vivid identity. Each card wears its own brand colour so the
   home screen reads as energetic and joyful while staying light & airy. */
const VIVID: Record<
  MacroKey,
  {
    icon: LucideIcon;
    grad: string; // icon chip + progress gradient
    card: string; // card tint (from-*)
    border: string;
    text: string; // brand label colour
    badge: string; // percentage chip
    glow: string; // icon chip glow
    track: string; // progress track
  }
> = {
  protein: {
    icon: Beef,
    grad: "from-orange-400 to-rose-500",
    card: "from-orange-50/90",
    border: "border-orange-100/80",
    text: "text-orange-600",
    badge: "bg-orange-100/70 text-orange-600",
    glow: "shadow-orange-300/50",
    track: "bg-orange-100/70",
  },
  carbs: {
    icon: Wheat,
    grad: "from-emerald-400 to-teal-500",
    card: "from-emerald-50/90",
    border: "border-emerald-100/80",
    text: "text-emerald-600",
    badge: "bg-emerald-100/70 text-emerald-600",
    glow: "shadow-emerald-300/50",
    track: "bg-emerald-100/70",
  },
  fat: {
    icon: Droplet,
    grad: "from-amber-400 to-yellow-500",
    card: "from-amber-50/90",
    border: "border-amber-100/80",
    text: "text-amber-600",
    badge: "bg-amber-100/70 text-amber-700",
    glow: "shadow-amber-300/50",
    track: "bg-amber-100/70",
  },
};

interface CompactNutrientCardProps {
  nutrient: MacroKey;
  current: number;
  target: number;
  userProfile: UserProfile;
  index?: number;
}

export const CompactNutrientCard = memo(function CompactNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  index = 0,
}: CompactNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const v = VIVID[nutrient];
  const Icon = v.icon;
  const percentageRaw = target > 0 ? (current / target) * 100 : 0;
  const isNearGoal = percentageRaw >= 90 && percentageRaw <= 110;
  const isOver = percentageRaw > 100;
  const percentage = Math.min(Math.max(Math.round(percentageRaw), 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="h-full relative"
    >
      {isNearGoal && (
        <div className="absolute -top-2 -right-2 pointer-events-none z-10">
          <motion.div
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          >
            <Sparkles className="text-amber-400 w-5 h-5 drop-shadow-sm" fill="currentColor" />
          </motion.div>
        </div>
      )}

      <Card
        className={cn(
          "specular h-full flex flex-col bg-gradient-to-b to-white/80 backdrop-blur-md shadow-premium rounded-[1.75rem] border",
          v.card,
          v.border,
        )}
      >
        <CardContent className="flex-1 flex flex-col justify-between gap-2.5 p-3 sm:p-4">
          {/* Icon chip + tip */}
          <div className="flex items-start justify-between gap-1">
            <div
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0",
                v.grad,
                v.glow,
              )}
            >
              <Icon size={18} strokeWidth={2.5} />
            </div>
            <div className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/70 shadow-sm border border-white/80 shrink-0">
              <TipPopover
                content={generateNutritionalTip(nutrient, userProfile)}
                label={`טיפ עבור ${meta.label}`}
                className="scale-90"
              />
            </div>
          </div>

          {/* Label + value */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p
                className={cn(
                  "min-w-0 flex-1 text-[12px] sm:text-[13px] font-black tracking-tight truncate",
                  v.text,
                )}
              >
                {meta.label}
              </p>
              <span
                className={cn(
                  "shrink-0 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap",
                  isOver ? "bg-rose-100 text-rose-600" : v.badge,
                )}
              >
                {Math.round(percentageRaw)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-xl sm:text-2xl font-black text-slate-950"
                >
                  {formatNutritionValue(current)}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 whitespace-nowrap">
                / {formatNutritionValue(target)} ג'
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className={cn(
              "h-2.5 w-full rounded-full overflow-hidden border border-white/70",
              v.track,
            )}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.3 + index * 0.1,
              }}
              style={{ transform: "translateZ(0)" }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r shadow-sm",
                isOver ? "from-rose-400 to-rose-500" : v.grad,
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
