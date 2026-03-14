import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ChevronDown, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { NUTRIENT_META } from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import { MealItem, createMealSignature } from "../../../store";

interface MealTimelineProps {
  meals: MealItem[];
  onDelete?: (mealId: string) => void;
  onSaveFavorite?: (meal: MealItem) => void;
  savedSignatures: Set<string>;
  emptyText: string;
}

const highlightedMicros = ["fiber", "calcium", "iron", "vitaminC"] as const;

export function MealTimeline({
  meals,
  onDelete,
  onSaveFavorite,
  savedSignatures,
  emptyText,
}: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <Card className="rounded-[28px] border-dashed border-slate-300 bg-white/70">
        <CardContent className="p-8 text-center text-sm text-slate-500">
          {emptyText}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.04, duration: 0.24 }}
    >
      <Card className="overflow-hidden rounded-[26px] border-white/65 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-semibold text-slate-900">
                  {meal.meal_name}
                </h4>
                {meal.sourceType === "supplement" ? (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    תוסף
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-500">
                {formatMealTime(meal.timestamp)}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {formatNutritionValue(meal.calories)} קק"ל
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  חלבון {formatNutritionValue(meal.macronutrients.protein)} ג'
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  פחמימות {formatNutritionValue(meal.macronutrients.carbs)} ג'
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  שומן {formatNutritionValue(meal.macronutrients.fat)} ג'
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSaveFavorite ? (
                <Button
                  type="button"
                  variant={isSaved ? "secondary" : "outline"}
                  className="rounded-full"
                  onClick={() => onSaveFavorite(meal)}
                  disabled={isSaved}
                >
                  <Heart size={16} className="ms-2" />
                  {isSaved ? "נשמר במועדפים" : "שמור כמועדף"}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-slate-500"
                onClick={() => setIsExpanded((current) => !current)}
              >
                <ChevronDown
                  size={16}
                  className={`ms-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
                פרטים
              </Button>

              {canDelete && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => onDelete(meal.id)}
                  aria-label={`מחק את ${meal.meal_name}`}
                >
                  <Trash2 size={18} />
                </Button>
              ) : null}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-3 rounded-[22px] bg-slate-50/90 p-4 md:grid-cols-2 xl:grid-cols-4">
                  {highlightedMicros.map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-xs font-semibold text-slate-400">
                        {NUTRIENT_META[key].label}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Sparkles size={14} className="text-sky-500" />
                        {formatNutritionValue(meal.micronutrients[key])}{" "}
                        {NUTRIENT_META[key].unit}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
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
