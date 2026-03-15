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
  const appearance = getProgressAppearance(current, target, "calories");
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(appearance.percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

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
      className="w-full relative"
    >
      {appearance.isNearGoal && (
        <div className="absolute -top-4 -right-4 pointer-events-none">
          <motion.div
            animate={{ scale: [0, 1.2, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="text-yellow-400 w-8 h-8 drop-shadow-lg" />
          </motion.div>
        </div>
      )}

      <Card className="border border-white/60 bg-white/40 backdrop-blur-xl shadow-soft-2xl rounded-[3rem]">
        <CardContent className="flex flex-col items-center gap-8 p-10">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="caloriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                {appearance.isOverLimit && (
                  <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                )}
              </defs>
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
                stroke={appearance.isOverLimit ? "url(#warningGradient)" : "url(#caloriesGradient)"}
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
                className={appearance.glowClass}
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
              <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-1">יעד יומי</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{formatNutritionValue(target)}</span>
                <span className="text-[13px] font-bold text-slate-500">{meta.unit}</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-soft-xl border border-slate-100"
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
