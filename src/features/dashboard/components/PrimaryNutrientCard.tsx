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
  nutrient: Extract<TrackedNutrientKey, "calories">;
  current: number;
  target: number;
  userProfile: UserProfile;
}

export function PrimaryNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
}: PrimaryNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const appearance = getProgressAppearance(current, target);
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(appearance.percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const ringColorClass = appearance.barClass.replace('bg-', 'text-');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1 
      }}
      whileHover={{ scale: 1.01 }}
      className="w-full"
    >
      <Card className="border-none bg-white/40 backdrop-blur-xl shadow-soft-2xl rounded-[3rem] overflow-hidden border border-white/60">
        <CardContent className="flex flex-col items-center gap-8 p-10">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-slate-200/40"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ 
                  type: "spring", 
                  stiffness: 50, 
                  damping: 15,
                  duration: 1.5 
                }}
                strokeLinecap="round"
                className={`${ringColorClass} drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black tracking-tighter text-slate-950"
              >
                {formatNutritionValue(current)}
              </motion.span>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                קלוריות
              </span>
            </div>
          </div>

          <div className="flex w-full items-center justify-between bg-slate-50/50 backdrop-blur-sm rounded-3xl p-5 border border-white/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">יעד יומי</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{formatNutritionValue(target)}</span>
                <span className="text-xs font-bold text-slate-400">{meta.unit}</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-soft-lg border border-slate-100"
            >
                <TipPopover
                  content={generateNutritionalTip(nutrient, userProfile)}
                  label={`טיפ עבור ${meta.label}`}
                />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
