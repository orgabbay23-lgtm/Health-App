import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CalendarDays } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import type { PeriodDaySummary } from "../../../utils/date-navigation";
import { MealItem } from "../../../store";
import { MealTimeline } from "./MealTimeline";

interface PeriodBreakdownProps {
  days: PeriodDaySummary[];
  savedSignatures: Set<string>;
  onSaveFavorite: (meal: MealItem) => void;
  onDeleteMeal?: (dayKey: string, mealId: string) => void;
  onEditMeal?: (dayKey: string, meal: MealItem) => void;
  onIncrementMeal?: (dayKey: string, mealId: string) => void;
  onDecrementMeal?: (dayKey: string, mealId: string) => void;
}

export function PeriodBreakdown({
  days,
  savedSignatures,
  onSaveFavorite,
  onDeleteMeal,
  onEditMeal,
  onIncrementMeal,
  onDecrementMeal,
}: PeriodBreakdownProps) {
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <PeriodBreakdownItem
          key={day.dayKey}
          day={day}
          savedSignatures={savedSignatures}
          onSaveFavorite={onSaveFavorite}
          onDeleteMeal={onDeleteMeal}
          onEditMeal={onEditMeal}
          onIncrementMeal={onIncrementMeal}
          onDecrementMeal={onDecrementMeal}
        />
      ))}
    </div>
  );
}

interface PeriodBreakdownItemProps {
  day: PeriodDaySummary;
  savedSignatures: Set<string>;
  onSaveFavorite: (meal: MealItem) => void;
  onDeleteMeal?: (dayKey: string, mealId: string) => void;
  onEditMeal?: (dayKey: string, meal: MealItem) => void;
  onIncrementMeal?: (dayKey: string, mealId: string) => void;
  onDecrementMeal?: (dayKey: string, mealId: string) => void;
}

function PeriodBreakdownItem({
  day,
  savedSignatures,
  onSaveFavorite,
  onDeleteMeal,
  onEditMeal,
  onIncrementMeal,
  onDecrementMeal,
}: PeriodBreakdownItemProps) {
  const [isOpen, setIsOpen] = useState(Boolean(day.log));

  return (
    <Card className="rounded-[24px] border-white/60 bg-white/88 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-50 p-2 text-sky-600">
            <CalendarDays size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">
              {formatDay(day.date)}
            </p>
            <p className="text-sm text-slate-500">
              {day.mealsCount > 0
                ? `${day.mealsCount} ארוחות, ${day.aggregations.calories.toFixed(0)} קק"ל`
                : "אין רישומים ליום זה"}
            </p>
          </div>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            layout
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <MealTimeline
                meals={day.log?.meals ?? []}
                onSaveFavorite={onSaveFavorite}
                onDelete={
                  onDeleteMeal
                    ? (mealId) => onDeleteMeal(day.dayKey, mealId)
                    : undefined
                }
                onEdit={
                  onEditMeal
                    ? (meal) => onEditMeal(day.dayKey, meal)
                    : undefined
                }
                onIncrement={
                  onIncrementMeal
                    ? (mealId) => onIncrementMeal(day.dayKey, mealId)
                    : undefined
                }
                onDecrement={
                  onDecrementMeal
                    ? (mealId) => onDecrementMeal(day.dayKey, mealId)
                    : undefined
                }
                savedSignatures={savedSignatures}
                emptyText="לא נרשמו ארוחות ביום הזה."
              />
            </CardContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
