import { motion } from "framer-motion";
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
  
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(appearance.percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  // appearance.barClass usually returns something like "bg-sky-500", "bg-emerald-500", etc.
  // We map it to text color for the SVG stroke.
  const ringColorClass = appearance.barClass.replace('bg-', 'text-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
    >
      <Card className="border-white/70 bg-white/92 shadow-soft-sm rounded-card overflow-hidden">
        <CardContent className="flex items-center gap-5 p-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${ringColorClass}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold text-slate-950">
                {appearance.percentage}%
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center space-y-1 leading-relaxed">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{meta.label}</p>
              <TipPopover
                content={generateNutritionalTip(nutrient, userProfile)}
                label={`טיפ עבור ${meta.label}`}
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight text-slate-950">
                {formatNutritionValue(current)}
              </span>
              <span className="text-xs text-slate-400">
                / {formatNutritionValue(target)} {meta.unit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
