import type { ActivityLevel, Gender } from "./nutrition-utils";

/**
 * Scientific Hydration Calculator
 *
 * Formula: Vtotal = (Wkg × Cage × Cgender) + (Tact × Cact) + Vgoal
 *
 * Based on NASEM, WHO, Mayo Clinic, and ACSM guidelines.
 * See: Deep_Researches/React Hydration Feature- Formula & Animation.md
 */

export type WeightGoal = "maintenance" | "slow_loss" | "moderate_loss" | "fast_loss";

interface HydrationInput {
  weight: number;       // kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: WeightGoal;
  activeMinutes?: number; // minutes of exercise today
}

/** ml/kg baseline by age bracket - Adjusted for more realistic daily targets */
function getAgeCoefficient(age: number): number {
  if (age < 30) return 35;
  if (age <= 55) return 33;
  return 30;
}

/** Gender scaling: male 1.0, female 0.9 */
function getGenderCoefficient(gender: Gender): number {
  return gender === "female" ? 0.9 : 1.0;
}

/** ml per minute of exercise by activity level - Reduced for better calibration */
function getActivityCoefficient(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case "sedentary":   return 0;
    case "light":       return 6;
    case "moderate":    return 10;
    case "active":      return 14;
    case "very_active": return 18;
    default:            return 0;
  }
}

/** Default exercise minutes estimate when no explicit log exists */
function getDefaultActiveMinutes(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case "sedentary":   return 0;
    case "light":       return 20;
    case "moderate":    return 30;
    case "active":      return 45;
    case "very_active": return 60;
    default:            return 0;
  }
}

/** Additional ml/day for weight-loss support - Capped at reasonable levels */
function getGoalVolume(goal: WeightGoal): number {
  switch (goal) {
    case "maintenance":    return 0;
    case "slow_loss":      return 150;
    case "moderate_loss":  return 250;
    case "fast_loss":      return 400;
    default:               return 0;
  }
}

/** Safety caps to prevent hyponatremia */
const SEDENTARY_CAP_ML = 3500;
const ABSOLUTE_CAP_ML  = 5000;
const MINIMUM_ML       = 1500;

/**
 * Calculates Total Recommended Daily Water Volume (ml).
 *
 * Vtotal = (Wkg × Cage × Cgender) + (Tact × Cact) + Vgoal
 *
 * Capped at 3500ml (sedentary) / 5000ml (active) for safety.
 * Floor of 1500ml to ensure minimum physiological needs.
 */
export function calculateDailyWaterTarget(input: HydrationInput): number {
  const { weight, age, gender, activityLevel, goal } = input;
  const activeMinutes = input.activeMinutes ?? getDefaultActiveMinutes(activityLevel);

  const Cage = getAgeCoefficient(age);
  const Cgender = getGenderCoefficient(gender);
  const Cact = getActivityCoefficient(activityLevel);
  const Vgoal = getGoalVolume(goal);

  const baseline = weight * Cage * Cgender;
  const activityAddition = activeMinutes * Cact;
  let total = baseline + activityAddition + Vgoal;

  // Safety caps
  const cap = activityLevel === "sedentary" ? SEDENTARY_CAP_ML : ABSOLUTE_CAP_ML;
  total = Math.min(total, cap);
  total = Math.max(total, MINIMUM_ML);

  // Round to nearest 50ml for clean display
  return Math.round(total / 50) * 50;
}

/**
 * Derives a WeightGoal from the user's goalDeficit (kcal/day).
 * Maps the existing NutritionProfileInput.goalDeficit to hydration goal tiers.
 */
export function goalDeficitToWaterGoal(goalDeficit: number): WeightGoal {
  if (goalDeficit <= 0)   return "maintenance";
  if (goalDeficit <= 300) return "slow_loss";
  if (goalDeficit <= 600) return "moderate_loss";
  return "fast_loss";
}
