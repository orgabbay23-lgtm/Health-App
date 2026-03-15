import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ChevronDown, Sparkles, Trash2, Coffee, Utensils, Sandwich, Apple, Moon, Pill } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { NUTRIENT_META } from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import { MealItem, createMealSignature } from "../../../store";
import { cn } from "../../../utils/utils";

interface MealTimelineProps {
  meals: MealItem[];
  onDelete?: (mealId: string) => void;
  onSaveFavorite?: (meal: MealItem) => void;
  savedSignatures: Set<string>;
  emptyText: string;
}

const highlightedMicros = ["fiber", "calcium", "iron", "vitaminC"] as const;

function getMealIcon(mealName: string, sourceType?: string) {
  if (sourceType === "supplement") return Pill;
  
  const name = mealName.toLowerCase();
  if (name.includes("בוקר") || name.includes("breakfast")) return Coffee;
  if (name.includes("צהריים") || name.includes("lunch")) return Utensils;
  if (name.includes("ערב") || name.includes("dinner")) return Moon;
  if (name.includes("ביניים") || name.includes("snack") || name.includes("נשנוש")) return Apple;
  return Sandwich;
}

export function MealTimeline({
  meals,
  onDelete,
  onSaveFavorite,
  savedSignatures,
  emptyText,
}: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-inner border border-white">
          <Sparkles className="text-slate-200 w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">היום שלך מתחיל כאן...</h3>
        <p className="text-sm text-slate-400 font-medium max-w-[200px] leading-relaxed">
          {emptyText}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <AnimatePresence initial={false}>
        {meals.map((meal, index) => (
          <MealTimelineItem
            key={meal.id}
            meal={meal}
            index={index}
            canDelete={Boolean(onDelete)}
            onDelete={onDelete}
            onSaveFavorite={onSaveFavorite}
            isSaved={savedSignatures.has(createMealSignature(meal))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MealTimelineItemProps {
  meal: MealItem;
  index: number;
  canDelete: boolean;
  onDelete?: (mealId: string) => void;
  onSaveFavorite?: (meal: MealItem) => void;
  isSaved: boolean;
}

function MealTimelineItem({
  meal,
  index,
  canDelete,
  onDelete,
  onSaveFavorite,
  isSaved,
}: MealTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getMealIcon(meal.meal_name, meal.sourceType);

  const getIconStyles = () => {
    const name = meal.meal_name.toLowerCase();
    if (meal.sourceType === "supplement") return "bg-violet-50 text-violet-500 shadow-violet-100";
    if (name.includes("בוקר") || name.includes("breakfast")) return "bg-orange-50 text-orange-500 shadow-orange-100";
    if (name.includes("צהריים") || name.includes("lunch")) return "bg-emerald-50 text-emerald-500 shadow-emerald-100";
    if (name.includes("ערב") || name.includes("dinner")) return "bg-indigo-50 text-indigo-500 shadow-indigo-100";
    if (name.includes("ביניים") || name.includes("snack")) return "bg-rose-50 text-rose-500 shadow-rose-100";
    return "bg-slate-50 text-slate-500 shadow-slate-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.4,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      whileHover={{ x: 4 }}
    >
      <Card className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/50 backdrop-blur-md shadow-soft-xl transition-all duration-300">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white shrink-0 relative overflow-hidden",
                  getIconStyles()
                )}>
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
                  <Icon size={22} className="relative z-10" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-950 leading-tight">
                      {meal.meal_name}
                    </h4>
                    {meal.sourceType === "supplement" && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-100/50 px-2 py-0.5 rounded-full">
                        תוסף
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      {formatMealTime(meal.timestamp)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-xs font-black text-slate-950">
                      {formatNutritionValue(meal.calories)} קק"ל
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onSaveFavorite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-xl h-10 w-10 transition-all",
                      isSaved ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-rose-400 hover:bg-rose-50/50"
                    )}
                    onClick={() => onSaveFavorite(meal)}
                    disabled={isSaved}
                  >
                    <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-10 w-10 text-slate-300 hover:text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsExpanded((current) => !current)}
                >
                  <ChevronDown
                    size={18}
                    className={cn("transition-transform duration-300", isExpanded && "rotate-180")}
                  />
                </Button>

                {canDelete && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-10 w-10 text-slate-200 hover:text-rose-500 hover:bg-rose-50"
                    onClick={() => onDelete(meal.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "חלבון", value: meal.macronutrients.protein, color: "gradient-protein text-white", shadow: "shadow-orange-200/50" },
                { label: "פחמימות", value: meal.macronutrients.carbs, color: "gradient-carbs text-white", shadow: "shadow-emerald-200/50" },
                { label: "שומן", value: meal.macronutrients.fat, color: "gradient-fats text-white", shadow: "shadow-amber-200/50" }
              ].map((macro) => (
                <div key={macro.label} className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-md", 
                  macro.color,
                  macro.shadow
                )}>
                  {macro.label}: {formatNutritionValue(macro.value)} ג'
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                className="overflow-hidden bg-slate-50/50 border-t border-white/50"
              >
                <div className="p-6 grid grid-cols-2 gap-3">
                  {highlightedMicros.map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl bg-white/80 p-3 border border-white shadow-sm flex flex-col gap-1"
                    >
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {NUTRIENT_META[key].label}
                      </p>
                      <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                        <Sparkles size={12} className="text-sky-400" />
                        {formatNutritionValue(meal.micronutrients[key])}
                        <span className="text-[10px] text-slate-400">{NUTRIENT_META[key].unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatMealTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "לא זמין";
  }

  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
