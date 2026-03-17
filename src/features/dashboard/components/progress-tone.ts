import { getNutrientProgressColor } from "../../../utils/nutrition-utils";

export type NutrientType = "calories" | "protein" | "carbs" | "fat" | "micronutrient";

export interface ProgressAppearance {
  barClass: string;
  badgeClass: string;
  glowClass: string;
  percentage: number;
  isOverLimit: boolean;
  isNearGoal: boolean;
}

export function getProgressAppearance(
  currentValue: number,
  targetValue: number,
  type: NutrientType = "micronutrient",
  nutrientKey?: string
): ProgressAppearance {
  if (targetValue <= 0) {
    return {
      barClass: "bg-slate-200",
      badgeClass: "bg-slate-50 text-slate-500",
      glowClass: "",
      percentage: 0,
      isOverLimit: false,
      isNearGoal: false,
    };
  }

  const percentage = Math.max(0, Math.round((currentValue / targetValue) * 100));
  const isNearGoal = percentage >= 90 && percentage <= 110;

  // Use the clinical 3-tier color logic to determine over-limit state
  const resolvedKey = nutrientKey ?? type;
  const colorTier = getNutrientProgressColor(resolvedKey, currentValue, targetValue);
  const isOverLimit = colorTier === "red";
  const isSafeExcess = colorTier === "green"; // >100% but clinically safe

  // Base colors based on nutrient type
  const typeColors: Record<NutrientType, { bar: string; badge: string; glow: string }> = {
    calories: {
      bar: "gradient-calories",
      badge: "bg-sky-50 text-sky-600",
      glow: "glow-calories",
    },
    protein: {
      bar: "gradient-protein",
      badge: "bg-orange-50 text-orange-600",
      glow: "glow-protein",
    },
    carbs: {
      bar: "gradient-carbs",
      badge: "bg-emerald-50 text-emerald-600",
      glow: "glow-carbs",
    },
    fat: {
      bar: "gradient-fats",
      badge: "bg-amber-50 text-amber-600",
      glow: "glow-fats",
    },
    micronutrient: {
      bar: "bg-sky-400",
      badge: "bg-sky-50 text-sky-700",
      glow: "shadow-[0_0_10px_rgba(56,189,248,0.2)]",
    },
  };

  const base = typeColors[type];

  // Red: clinical over-limit (strict nutrients or UL exceeded)
  if (isOverLimit) {
    return {
      barClass: "bg-rose-600",
      badgeClass: "bg-rose-50 text-rose-700",
      glowClass: "shadow-[0_0_20px_rgba(225,29,72,0.4)]",
      percentage,
      isOverLimit: true,
      isNearGoal: false,
    };
  }

  // Green: safe excess (>100% but within clinical UL or goal nutrient)
  if (isSafeExcess) {
    return {
      barClass: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700",
      glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      percentage,
      isOverLimit: false,
      isNearGoal: false,
    };
  }

  // Near-goal celebration (90-110%)
  if (isNearGoal) {
    return {
      barClass: base.bar,
      badgeClass: base.badge,
      glowClass: "glow-celebration",
      percentage,
      isOverLimit: false,
      isNearGoal: true,
    };
  }

  // Default: blue / in-progress
  return {
    barClass: base.bar,
    badgeClass: base.badge,
    glowClass: base.glow,
    percentage,
    isOverLimit: false,
    isNearGoal: false,
  };
}
