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
  type: NutrientType = "micronutrient"
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
  const isOverLimit = percentage > 110; // Clinical warning threshold
  const isNearGoal = percentage >= 90 && percentage <= 110;

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

  if (isOverLimit) {
    return {
      barClass: "bg-rose-600", // Sophisticated Warning Red
      badgeClass: "bg-rose-50 text-rose-700",
      glowClass: "shadow-[0_0_20px_rgba(225,29,72,0.4)]",
      percentage,
      isOverLimit: true,
      isNearGoal: false,
    };
  }

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

  return {
    barClass: base.bar,
    badgeClass: base.badge,
    glowClass: base.glow,
    percentage,
    isOverLimit: false,
    isNearGoal: false,
  };
}
