import { motion, type Variants } from "framer-motion";
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
import { DateNavigator } from "../components/DateNavigator";
import { FullNutritionAccordion } from "../components/FullNutritionAccordion";
import { GuidanceCard } from "../components/GuidanceCard";
import { MealTimeline } from "../components/MealTimeline";
import { PeriodBreakdown } from "../components/PeriodBreakdown";
import { PeriodTabs } from "../components/PeriodTabs";
import { PrimaryNutrientCard } from "../components/PrimaryNutrientCard";
import { SafetyAlertsCard } from "../components/SafetyAlertsCard";

interface HomeScreenProps {
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  periodData: AggregatedPeriodData;
  periodTargets: DailyAggregations;
  selectedDailyLog: DailyLog | null;
  safetyAlerts: NutritionSafetyAlert[];
  userProfile: UserProfile;
  savedSignatures: Set<string>;
  onPeriodChange: (nextMode: DashboardPeriod) => void;
  onDateChange: (nextDate: Date) => void;
  onDeleteMeal: (dayKey: string, mealId: string) => void;
  onSaveFavorite: (meal: MealItem) => void;
}

export function HomeScreen({
  periodMode,
  periodDetails,
  periodData,
  periodTargets,
  selectedDailyLog,
  safetyAlerts,
  userProfile,
  savedSignatures,
  onPeriodChange,
  onDateChange,
  onDeleteMeal,
  onSaveFavorite,
}: HomeScreenProps) {
  const meals = selectedDailyLog?.meals ?? [];

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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      <motion.div variants={itemVariants} className="space-y-6">
        <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        <DateNavigator
          periodMode={periodMode}
          periodDetails={periodDetails}
          onDateChange={onDateChange}
        />
      </motion.div>

      {/* Level 1: Hero Section (Calories) */}
      <motion.section variants={itemVariants} className="flex flex-col items-center">
        <PrimaryNutrientCard
          nutrient="calories"
          current={periodData.aggregations.calories}
          target={periodTargets.calories}
          userProfile={userProfile}
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
        <Card className="border border-white/60 bg-white/30 backdrop-blur-xl shadow-soft-2xl rounded-[3rem] overflow-hidden">
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
