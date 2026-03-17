import { motion, type Variants } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type {
  AggregatedPeriodData,
  DashboardPeriod,
  PeriodDetails,
} from "../../../utils/date-navigation";
import type {
  DailyAggregations,
  DailyLog,
  MealItem,
  UserProfile,
} from "../../../store";
import type { NutritionSafetyAlert } from "../../../utils/nutrition-utils";
import { Card, CardContent } from "../../../components/ui/card";
import { CompactNutrientCard } from "../components/CompactNutrientCard";
import { FullNutritionAccordion } from "../components/FullNutritionAccordion";
import { GuidanceCard } from "../components/GuidanceCard";
import { MealTimeline } from "../components/MealTimeline";
import { PeriodBreakdown } from "../components/PeriodBreakdown";
import { PrimaryNutrientCard } from "../components/PrimaryNutrientCard";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";
import { SmartInsightGenerator } from "../components/SmartInsightGenerator";

interface HomeScreenProps {
  periodMode: DashboardPeriod;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  userProfile: UserProfile;
  savedSignatures: Set<string>;
  periodDetails: PeriodDetails;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
}

export function HomeScreen({
  periodMode,
  periodData,
  periodTargets,
  selectedDailyLog,
  safetyAlerts,
  userProfile,
  savedSignatures,
  periodDetails,
  onDeleteMeal,
  onSaveFavorite,
}: HomeScreenProps) {
  const meals = selectedDailyLog?.meals ?? [];

  const insightKey =
    periodMode === "daily"
      ? `insight_day_${periodDetails.startKey}`
      : periodMode === "weekly"
        ? `insight_week_${periodDetails.startKey}`
        : `insight_month_${periodDetails.startKey.slice(0, 7)}`;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }
    }
  };

  const periodCaption = periodMode === "weekly"
    ? `${format(periodDetails.startDate, "EEEE", { locale: he })} – ${format(periodDetails.endDate, "EEEE", { locale: he })}`
    : periodMode === "monthly"
      ? `${format(periodDetails.startDate, "d בMMMM", { locale: he })} – ${format(periodDetails.endDate, "d בMMMM", { locale: he })}`
      : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      {periodCaption && (
        <motion.div 
          variants={itemVariants} 
          className="flex justify-center -mb-2 px-4"
        >
          <div className="inline-flex items-center gap-2.5 bg-white/50 backdrop-blur-xl shadow-soft-sm border border-white/60 rounded-full px-4 py-2">
            <span className="text-[13px] font-black text-slate-700 tracking-tight">
              {periodCaption}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              לא כולל ימים ריקים
            </span>
          </div>
        </motion.div>
      )}

      {/* Level 1: Hero Section (Calories) */}
      <motion.section variants={itemVariants} className="flex flex-col items-center pt-2">
        <PrimaryNutrientCard
          nutrient="calories"
          current={periodData.aggregations.calories}
          target={periodTargets.calories}
          userProfile={userProfile}
          periodMode={periodMode}
        />
      </motion.section>

      {/* Level 2: Macronutrients */}
      <motion.section variants={itemVariants} className="grid grid-cols-3 gap-4">
        <CompactNutrientCard
          nutrient="protein"
          current={periodData.aggregations.protein}
          target={periodTargets.protein}
          userProfile={userProfile}
          index={0}
        />
        <CompactNutrientCard
          nutrient="carbs"
          current={periodData.aggregations.carbs}
          target={periodTargets.carbs}
          userProfile={userProfile}
          index={1}
        />
        <CompactNutrientCard
          nutrient="fat"
          current={periodData.aggregations.fat}
          target={periodTargets.fat}
          userProfile={userProfile}
          index={2}
        />
      </motion.section>

      {userProfile.targets.guidanceFlags.length > 0 && (
        <motion.div variants={itemVariants}>
          <GuidanceCard flags={userProfile.targets.guidanceFlags} />
        </motion.div>
      )}

      {periodMode === "daily" && safetyAlerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <SafetyAlertsCard alerts={safetyAlerts} />
        </motion.div>
      )}

      {/* Level 3: Micronutrients */}
      <motion.div variants={itemVariants}>
        <FullNutritionAccordion
          current={periodData.aggregations.micronutrients}
          target={periodTargets.micronutrients}
          userProfile={userProfile}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SmartInsightGenerator
          periodMode={periodMode}
          insightKey={insightKey}
          currentAggregations={periodData.aggregations}
          periodTargets={periodTargets}
          userProfile={userProfile}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-white/60 bg-white/30 backdrop-blur-xl shadow-soft-2xl rounded-[3rem]">
          <CardContent className="space-y-8 p-8 md:p-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight text-slate-950">
                {periodMode === "daily" ? "ארוחות" : "פירוט תקופה"}
              </h3>
              {periodMode === "daily" && meals.length > 0 && (
                <div className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  {meals.length} פריטים
                </div>
              )}
            </div>

            {periodMode === "daily" ? (
              <MealTimeline
                meals={meals}
                onDelete={(mealId) => onDeleteMeal(periodDetails.startKey, mealId)}
                onSaveFavorite={onSaveFavorite}
                savedSignatures={savedSignatures}
                emptyText="עוד לא רשמת כלום היום..."
              />
            ) : (
              <PeriodBreakdown
                days={periodData.days}
                savedSignatures={savedSignatures}
                onSaveFavorite={onSaveFavorite}
                onDeleteMeal={onDeleteMeal}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
