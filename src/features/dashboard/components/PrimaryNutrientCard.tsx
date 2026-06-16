import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Flame } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
  type TrackedNutrientKey,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { type DashboardPeriod } from "../../../utils/date-navigation";
import { cn } from "../../../utils/utils";
import { CatPeeker } from "../CatPeeker";

interface PrimaryNutrientCardProps {
  nutrient: Extract<TrackedNutrientKey, "calories">;
  current: number;
  target: number;
  userProfile: UserProfile;
  periodMode: DashboardPeriod;
}

export function PrimaryNutrientCard({
  nutrient,
  current,
  target,
  userProfile,
  periodMode,
}: PrimaryNutrientCardProps) {
  const meta = NUTRIENT_META[nutrient];
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isNearGoal = percentage >= 90 && percentage <= 110;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const remaining = target - current;
  const isOver = remaining < 0;

  // Animated calorie counter — counts up from 0 on mount, springs to new values
  const calorieMotion = useMotionValue(0);
  const calorieSpring = useSpring(calorieMotion, { stiffness: 40, damping: 20 });
  const [displayCalories, setDisplayCalories] = useState("0");

  useEffect(() => {
    calorieMotion.set(current);
  }, [current, calorieMotion]);

  useEffect(() => {
    const unsubscribe = calorieSpring.on("change", (v) => {
      setDisplayCalories(formatNutritionValue(Math.round(v)));
    });
    return unsubscribe;
  }, [calorieSpring]);

  // Animated percentage counter
  const percentMotion = useMotionValue(0);
  const percentSpring = useSpring(percentMotion, { stiffness: 40, damping: 20 });
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    percentMotion.set(Math.round(percentage));
  }, [percentage, percentMotion]);

  useEffect(() => {
    const unsubscribe = percentSpring.on("change", (v) => {
      setDisplayPercent(Math.round(v));
    });
    return unsubscribe;
  }, [percentSpring]);

  const periodLabel =
    periodMode === "daily" ? "יעד יומי" : 
    periodMode === "weekly" ? "יעד שבועי" : 
    "יעד חודשי";

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
      {isNearGoal && (
        <div className="absolute -top-4 -right-4 pointer-events-none">
          <motion.div
            animate={{ scale: [0, 1.2, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="text-yellow-400 w-8 h-8 drop-shadow-lg" />
          </motion.div>
        </div>
      )}

      {/* Vivid colour halo behind the hero card */}
      <div
        className={cn(
          "absolute -inset-3 -z-10 rounded-[3.5rem] blur-2xl opacity-70 transition-colors duration-700",
          isOver
            ? "bg-gradient-to-br from-rose-300/40 via-orange-200/30 to-amber-200/30"
            : "bg-gradient-to-br from-sky-300/40 via-indigo-300/25 to-teal-300/35",
        )}
      />

      <Card className="specular relative border border-white/60 bg-gradient-to-b from-white/70 to-white/45 backdrop-blur-xl shadow-premium-lg rounded-[3rem]">
        <CardContent className="flex flex-col items-center gap-8 p-10">
          <div className="relative isolate">
            <div className="relative flex h-56 w-56 items-center justify-center">
              {periodMode === "daily" && (
                <CatPeeker caloriePercentage={Math.round(percentage)} />
              )}
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="caloriesRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="caloriesRingOver" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <filter id="caloriesRingGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="8.5"
                fill="transparent"
                className="text-slate-200/50"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={isOver ? "url(#caloriesRingOver)" : "url(#caloriesRing)"}
                strokeWidth="8.5"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{
                  type: "spring",
                  stiffness: 40,
                  damping: 20
                }}
                strokeLinecap="round"
                filter="url(#caloriesRingGlow)"
                style={{ transform: "translateZ(0)" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key="calories"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={cn(
                    "text-6xl font-black tracking-tighter bg-gradient-to-br bg-clip-text text-transparent drop-shadow-sm",
                    isOver ? "from-rose-500 to-rose-600" : "from-sky-500 via-indigo-500 to-teal-500",
                  )}
                >
                  {displayCalories}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-1 flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" fill="currentColor" />
                קלוריות
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key="percentage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={cn(
                    "text-sm font-medium mt-1",
                    percentage > 100 ? "text-red-400" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  ({displayPercent}%)
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          </div>

          <div className="flex w-full items-center justify-between bg-gradient-to-br from-sky-50/80 via-white/60 to-indigo-50/60 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-inner-top">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{periodLabel}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900">{formatNutritionValue(target)}</span>
                <span className="text-[11px] font-bold text-slate-500">{meta.unit}</span>
              </div>
            </div>

            <div className="flex flex-col items-center px-4 border-x border-slate-200/50">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {isOver ? "חריגה" : "נותרו"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-xl font-black transition-colors duration-500",
                  isOver ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatNutritionValue(Math.abs(remaining))}
                </span>
                <span className="text-[11px] font-bold text-slate-500">{meta.unit}</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white shadow-soft-xl border border-slate-100 shrink-0"
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
