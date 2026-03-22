import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  MessageCircle, 
  Send, 
  RefreshCw, 
  Pill, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../../store";
import type { DailyAggregations, UserProfile } from "../../../store";
import type { DashboardPeriod } from "../../../utils/date-navigation";
import { MICRONUTRIENT_KEYS } from "../../../utils/nutrition-utils";
import { 
  generateNutritionalInsight, 
  generateCustomAnswer, 
  generateSupplementRecommendations,
  type GeminiUserProfile
} from "../../../utils/gemini";

interface SmartInsightGeneratorProps {
  periodMode: DashboardPeriod;
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

export function FormattedAIResponse({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-slate-700 leading-relaxed text-[15px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // 1. Numbered Header Check (Resilient to space variations)
        const headerMatch = trimmed.match(/^(\d+)\.?\s*(.*)/);
        if (headerMatch && !trimmed.startsWith("-")) {
          const num = headerMatch[1];
          const text = headerMatch[2];
          if (text) {
            return (
              <h4 key={idx} className="text-[17px] font-black text-sky-700 mt-5 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-[12px] font-black shrink-0">
                  {num}
                </span>
                {renderBoldText(text)}
              </h4>
            );
          }
        }

        // 2. Bullet Point Check (Resilient to space variations)
        if (trimmed.startsWith("-")) {
          const bulletText = trimmed.replace(/^-+\s*/, "");
          return (
            <div key={idx} className="flex gap-2 mb-1.5 pr-1">
              <span className="text-sky-500 mt-1 flex-shrink-0">•</span>
              <p className="flex-grow">{renderBoldText(bulletText)}</p>
            </div>
          );
        }

        // 3. Normal Paragraph
        return (
          <p key={idx} className="mb-2">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderBoldText(text: string) {
  if (!text.includes("**")) return text;

  const parts = text.split("**");
  return parts.map((part, i) => {
    // Even indices are normal text, odd indices are bold
    if (i % 2 === 0) return part;
    
    const isWarning = part.includes("אזהר") || part.includes("רעיל");
    if (isWarning) {
      return (
        <strong key={i} className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 font-black mx-0.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {part}
        </strong>
      );
    }
    
    return (
      <strong key={i} className="font-black text-slate-900 mx-0.5">
        {part}
      </strong>
    );
  });
}

export function SmartInsightGenerator({
  periodMode,
  currentAggregations,
  periodTargets,
  userProfile,
}: SmartInsightGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Zustand store bindings
  const aiInsights = useAppStore((state) => state.aiInsights);
  const setAiInsight = useAppStore((state) => state.setAiInsight);

  // Key calculation
  const keys = {
    classic: `insight_${periodMode}_classic`,
    customQ: `insight_${periodMode}_custom_q`,
    customA: `insight_${periodMode}_custom_a`,
    supplements: `insight_monthly_supplements`
  };

  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(false);

  const timeframe: 'day' | 'week' | 'month' =
    periodMode === "daily" ? "day" : periodMode === "weekly" ? "week" : "month";

  const profileData: GeminiUserProfile = {
    name: userProfile.name,
    age: userProfile.age,
    gender: userProfile.gender,
    weight: userProfile.weight,
    height: userProfile.height,
    activityLevel: userProfile.activityLevel,
    goalDeficit: userProfile.goalDeficit,
    isSmoker: userProfile.isSmoker,
  };

  const nutritionData = buildNutritionPercentages(currentAggregations, periodTargets);

  // Zone 1: Custom Chat
  const handleAskCustom = async () => {
    const question = aiInsights[keys.customQ] || "";
    if (!question.trim() || isLoadingCustom) return;
    if (!window.confirm('האם אתה בטוח?')) return;
    
    setIsLoadingCustom(true);
    try {
      const answer = await generateCustomAnswer(profileData, timeframe, nutritionData, question);
      setAiInsight(keys.customA, answer);
    } catch (error: any) {
      toast.error(error.message || "שגיאה במתן התשובה");
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Zone 2: Classic Insight
  const handleGenerateInsight = async () => {
    if (isLoadingInsight) return;
    if (!window.confirm('האם אתה בטוח?')) return;
    
    setIsLoadingInsight(true);
    try {
      const text = await generateNutritionalInsight(timeframe, nutritionData, profileData);
      setAiInsight(keys.classic, text);
    } catch (error: any) {
      toast.error(error.message || "שגיאה ביצירת ההמלצה");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Zone 3: Supplements
  const handleGenerateSupplements = async () => {
    if (isLoadingSupplements) return;
    if (!window.confirm('האם אתה בטוח?')) return;
    
    setIsLoadingSupplements(true);
    try {
      const text = await generateSupplementRecommendations(profileData, nutritionData);
      setAiInsight(keys.supplements, text);
    } catch (error: any) {
      toast.error(error.message || "שגיאה ביצירת המלצות לתוספים");
    } finally {
      setIsLoadingSupplements(false);
    }
  };

  return (
    <div className="w-full" dir="rtl">
      <motion.div
        layout
        className="w-full rounded-[2rem] border border-white/40 bg-white/30 backdrop-blur-xl shadow-soft-xl overflow-visible"
        style={{ height: "auto" }}
      >
        {/* Header / Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-6 py-5 focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100/50 p-2 text-violet-600">
              <Sparkles size={20} />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">שאלה ל-AI</span>
          </div>
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="px-6 pb-8 space-y-8"
            >
              {/* Zone 1: Custom Chat */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                  <MessageCircle size={18} className="text-violet-500" />
                  <span>שאלה חופשית</span>
                </div>
                
                <AnimatePresence mode="wait">
                  {!aiInsights[keys.customA] ? (
                    <motion.div 
                      key="input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      <textarea
                        value={aiInsights[keys.customQ] || ""}
                        onChange={(e) => setAiInsight(keys.customQ, e.target.value)}
                        placeholder="למשל: איך אני יכול לשפר את צריכת החלבון שלי היום?"
                        className="w-full rounded-2xl border border-slate-200/50 bg-white/40 p-4 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 min-h-[100px] resize-none"
                        disabled={isLoadingCustom}
                      />
                      <button
                        onClick={handleAskCustom}
                        disabled={!(aiInsights[keys.customQ] || "").trim() || isLoadingCustom}
                        className="absolute bottom-3 left-3 flex items-center justify-center rounded-xl bg-violet-600 p-2 text-white shadow-soft-md hover:bg-violet-700 disabled:opacity-40 transition-all"
                      >
                        {isLoadingCustom ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rotate-180" />}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl border border-violet-100 bg-violet-50/50 p-5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-violet-500 bg-violet-100/50 px-2 py-1 rounded-lg">תשובת המומחה</span>
                        <button 
                          onClick={() => { setAiInsight(keys.customA, null); setAiInsight(keys.customQ, null); }}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                      <FormattedAIResponse content={aiInsights[keys.customA] || ""} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Zone 2: Classic Insight */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>ניתוח תזונתי כללי</span>
                </div>
                
                <AnimatePresence mode="wait">
                  {!aiInsights[keys.classic] ? (
                    <motion.button
                      key="btn"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateInsight}
                      disabled={isLoadingInsight}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-50/40 py-4 font-bold text-amber-700 shadow-soft-sm hover:bg-amber-100/50 transition-colors"
                    >
                      {isLoadingInsight ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      <span>המלצה אישית כללית</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="insight"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl border border-amber-100 bg-amber-50/30 p-5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-amber-600 bg-amber-100/50 px-2 py-1 rounded-lg">ניתוח תקופתי</span>
                        <button 
                          onClick={handleGenerateInsight}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          disabled={isLoadingInsight}
                        >
                          <RotateCcw size={16} className={isLoadingInsight ? "animate-spin" : ""} />
                        </button>
                      </div>
                      <FormattedAIResponse content={aiInsights[keys.classic] || ""} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Zone 3: Supplements (Monthly Only) */}
              {timeframe === 'month' && (
                <div className="space-y-4 pt-4 border-t border-slate-200/30">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                    <Pill size={18} className="text-emerald-500" />
                    <span>תוספי תזונה מומלצים</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {!aiInsights[keys.supplements] ? (
                      <motion.button
                        key="btn-supp"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateSupplements}
                        disabled={isLoadingSupplements}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-200/50 bg-emerald-50/40 py-4 font-bold text-emerald-700 shadow-soft-sm hover:bg-emerald-100/50 transition-colors"
                      >
                        {isLoadingSupplements ? <Loader2 size={18} className="animate-spin" /> : <Pill size={18} />}
                        <span>המלצה עם AI לתוספי תזונה</span>
                      </motion.button>
                    ) : (
                      <motion.div
                        key="supplements"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-lg">המלצות תוספים</span>
                          <button 
                            onClick={handleGenerateSupplements}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            disabled={isLoadingSupplements}
                          >
                            <RotateCcw size={16} className={isLoadingSupplements ? "animate-spin" : ""} />
                          </button>
                        </div>
                        <FormattedAIResponse content={aiInsights[keys.supplements] || ""} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
