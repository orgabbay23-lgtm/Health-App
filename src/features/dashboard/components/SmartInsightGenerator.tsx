import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../../store";
import type { DailyAggregations, UserProfile } from "../../../store";
import type { DashboardPeriod } from "../../../utils/date-navigation";
import { MICRONUTRIENT_KEYS } from "../../../utils/nutrition-utils";
import { generateNutritionalInsight } from "../../../utils/gemini";
import { InsightModal } from "./InsightModal";

interface SmartInsightGeneratorProps {
  periodMode: DashboardPeriod;
  insightKey: string;
  currentAggregations: DailyAggregations;
  periodTargets: DailyAggregations;
  userProfile: UserProfile;
}

function buildNutritionPercentages(
  current: DailyAggregations,
  targets: DailyAggregations,
): Record<string, number> {
  const pct = (val: number, target: number) =>
    target > 0 ? Math.round((val / target) * 100) : 0;

  const data: Record<string, number> = {
    calories: pct(current.calories, targets.calories),
    protein: pct(current.protein, targets.protein),
    carbs: pct(current.carbs, targets.carbs),
    fat: pct(current.fat, targets.fat),
  };

  for (const key of MICRONUTRIENT_KEYS) {
    data[key] = pct(current.micronutrients[key], targets.micronutrients[key]);
  }

  return data;
}

export function SmartInsightGenerator({
  periodMode,
  insightKey,
  currentAggregations,
  periodTargets,
  userProfile,
}: SmartInsightGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const existingRecord = useAppStore((s) => s.aiInsights[insightKey]);
  const saveInsight = useAppStore((s) => s.saveInsight);

  const timeframe: 'day' | 'week' | 'month' =
    periodMode === "daily" ? "day" : periodMode === "weekly" ? "week" : "month";

  const profileData = {
    name: userProfile.name,
    age: userProfile.age,
    gender: userProfile.gender,
    weight: userProfile.weight,
    height: userProfile.height,
    activityLevel: userProfile.activityLevel,
    goalDeficit: userProfile.goalDeficit,
    isSmoker: userProfile.isSmoker,
  };

  const generate = useCallback(async () => {
    if (!window.confirm('האם אתה בטוח?')) return;
    setIsLoading(true);
    try {
      const nutritionData = buildNutritionPercentages(currentAggregations, periodTargets);

      const text = await generateNutritionalInsight(timeframe, nutritionData, profileData);
      saveInsight(insightKey, text);
      setIsModalOpen(true);
    } catch (error: any) {
      if (error.message === "API_KEY_INVALID" || error.message === "MISSING_API_KEY") {
        toast.error("מפתח API חסר או לא תקין. עדכנו בהגדרות.");
      } else {
        toast.error(error.message || "שגיאה ביצירת ההמלצה");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentAggregations, periodTargets, userProfile, timeframe, insightKey, saveInsight]);

  const handlePrimaryClick = () => {
    if (existingRecord) {
      setIsModalOpen(true);
    } else {
      generate();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2" dir="rtl">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          disabled={isLoading}
          onClick={handlePrimaryClick}
          className="relative flex-1 flex items-center justify-center gap-2 rounded-2xl border border-violet-200/60 bg-gradient-to-l from-violet-50 to-white/80 backdrop-blur-md px-5 py-3.5 text-sm font-bold text-violet-700 shadow-soft-xl transition-colors hover:border-violet-300 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-violet-100/60 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </div>
              <RefreshCw size={16} className="animate-spin" />
              <span>מייצר המלצה...</span>
            </>
          ) : existingRecord ? (
            <>
              <Sparkles size={16} />
              <span>הצג המלצה אחרונה</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>המלצה אישית עם AI ✨</span>
            </>
          )}
        </motion.button>

        {existingRecord && !isLoading ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={generate}
            className="flex items-center justify-center rounded-xl border border-violet-200/60 bg-white/60 backdrop-blur-md p-2.5 text-violet-500 shadow-soft-sm hover:bg-violet-50 transition-colors"
            aria-label="רענן המלצה"
          >
            <RefreshCw size={16} />
          </motion.button>
        ) : null}
      </div>

      <InsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insightKey={insightKey}
        userProfile={profileData}
      />
    </>
  );
}
