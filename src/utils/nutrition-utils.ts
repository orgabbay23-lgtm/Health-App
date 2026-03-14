import { format, subDays, subHours } from "date-fns";

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type MicronutrientKey =
  | "fiber"
  | "sodium"
  | "potassium"
  | "magnesium"
  | "calcium"
  | "iron"
  | "vitaminA"
  | "vitaminC"
  | "vitaminD"
  | "vitaminE"
  | "vitaminB12";

export interface MicronutrientTotals {
  fiber: number;
  sodium: number;
  potassium: number;
  magnesium: number;
  calcium: number;
  iron: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminB12: number;
}

export interface NutritionProfileInput {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  goalDeficit: number;
  isSmoker: boolean;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients: MicronutrientTotals;
  safetyThresholds: {
    sodiumCdr: number;
    upperLimits: Partial<Record<MicronutrientKey, number>>;
  };
  guidanceFlags: string[];
  calculations: {
    bmi: number;
    bmr: number;
    tdee: number;
    clinicalCalorieFloor: number;
    absoluteCalorieFloor: number;
    referenceWeight: number;
    referenceWeightStrategy: "actual" | "ideal";
    calorieFloorApplied: boolean;
    macroMinimumsRaisedCalories: boolean;
  };
}

export interface NutritionSafetyAlert {
  id: string;
  nutrient:
    | "magnesium"
    | "calcium"
    | "iron"
    | "sodium"
    | "vitaminA"
    | "vitaminC"
    | "vitaminD"
    | "vitaminE";
  type: "upper_limit" | "cdrr";
  currentValue: number;
  limit: number;
  unit: string;
  title: string;
  message: string;
}

export interface SafetyEvaluationOptions {
  supplementalMagnesium?: number;
  retinolVitaminA?: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const MICRONUTRIENT_KEYS: MicronutrientKey[] = [
  "fiber",
  "sodium",
  "potassium",
  "magnesium",
  "calcium",
  "iron",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminB12",
];

export const EMPTY_MICRONUTRIENTS: MicronutrientTotals = {
  fiber: 0,
  sodium: 0,
  potassium: 0,
  magnesium: 0,
  calcium: 0,
  iron: 0,
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminB12: 0,
};

const SODIUM_CDRR_MG = 2300;

function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizeMicronutrients(
  micronutrients?: Partial<MicronutrientTotals> | null,
): MicronutrientTotals {
  return MICRONUTRIENT_KEYS.reduce<MicronutrientTotals>(
    (acc, key) => {
      acc[key] = clampNonNegative(micronutrients?.[key] ?? 0);
      return acc;
    },
    { ...EMPTY_MICRONUTRIENTS },
  );
}

export function addMicronutrients(
  base: Partial<MicronutrientTotals> | null | undefined,
  delta: Partial<MicronutrientTotals> | null | undefined,
): MicronutrientTotals {
  const normalizedBase = normalizeMicronutrients(base);
  const normalizedDelta = normalizeMicronutrients(delta);

  return MICRONUTRIENT_KEYS.reduce<MicronutrientTotals>(
    (acc, key) => {
      acc[key] = normalizedBase[key] + normalizedDelta[key];
      return acc;
    },
    { ...EMPTY_MICRONUTRIENTS },
  );
}

export function subtractMicronutrients(
  base: Partial<MicronutrientTotals> | null | undefined,
  delta: Partial<MicronutrientTotals> | null | undefined,
): MicronutrientTotals {
  const normalizedBase = normalizeMicronutrients(base);
  const normalizedDelta = normalizeMicronutrients(delta);

  return MICRONUTRIENT_KEYS.reduce<MicronutrientTotals>(
    (acc, key) => {
      acc[key] = clampNonNegative(normalizedBase[key] - normalizedDelta[key]);
      return acc;
    },
    { ...EMPTY_MICRONUTRIENTS },
  );
}

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  if (heightInMeters <= 0) {
    return 0;
  }

  return weight / heightInMeters ** 2;
}

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor Equation.
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/**
 * Calculates Total Daily Energy Expenditure.
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateIdealBodyWeight(height: number): number {
  const heightInMeters = height / 100;
  return 25 * heightInMeters ** 2;
}

function getCalciumTarget(age: number, gender: Gender): number {
  if (age <= 3) return 700;
  if (age <= 8) return 1000;
  if (age <= 18) return 1300;
  if (age <= 50) return 1000;
  if (age <= 70) return gender === "female" ? 1200 : 1000;
  return 1200;
}

function getMagnesiumTarget(age: number, gender: Gender): number {
  if (age <= 13) return 240;
  if (age <= 18) return gender === "male" ? 410 : 360;
  if (age <= 30) return gender === "male" ? 400 : 310;
  return gender === "male" ? 420 : 320;
}

function getIronTarget(age: number, gender: Gender): number {
  if (age <= 13) return 8;
  if (age <= 18) return gender === "male" ? 11 : 15;
  if (age <= 50) return gender === "female" ? 18 : 8;
  return 8;
}

function getSodiumAiTarget(age: number): number {
  if (age <= 3) return 800;
  if (age <= 8) return 1000;
  if (age <= 13) return 1200;
  return 1500;
}

function getPotassiumTarget(age: number, gender: Gender): number {
  if (age <= 13) return gender === "male" ? 2500 : 2300;
  if (age <= 18) return gender === "male" ? 3000 : 2300;
  return gender === "male" ? 3400 : 2600;
}

function getVitaminATarget(age: number, gender: Gender): number {
  if (age <= 13) return 600;
  return gender === "male" ? 900 : 700;
}

function getVitaminCTarget(
  age: number,
  gender: Gender,
  isSmoker: boolean,
): number {
  let target =
    age <= 18 ? (gender === "male" ? 75 : 65) : gender === "male" ? 90 : 75;

  if (isSmoker) {
    target += 35;
  }

  return target;
}

function getVitaminDTarget(age: number): number {
  return age >= 71 ? 20 : 15;
}

function getVitaminETarget(): number {
  return 15;
}

function getVitaminB12Target(): number {
  return 2.4;
}

function getFiberFloor(age: number, gender: Gender): number {
  if (gender === "male") {
    return age >= 51 ? 30 : 38;
  }

  return age >= 51 ? 21 : 25;
}

function calculateFiberTarget(
  targetCalories: number,
  age: number,
  gender: Gender,
): number {
  const dynamicFiber = (targetCalories / 1000) * 14;
  return Math.max(dynamicFiber, getFiberFloor(age, gender));
}

function calculateClinicalCalorieFloor(gender: Gender): number {
  return gender === "female" ? 1200 : 1500;
}

function calculateProteinTarget(
  profile: NutritionProfileInput,
  referenceWeight: number,
): number {
  const multiplier = profile.age >= 65 ? 1.5 : 1.8;
  return referenceWeight * multiplier;
}

function calculateFatTarget(weight: number, targetCalories: number): number {
  const weightBasedFloor = weight * 0.8;
  const percentageFloor = (targetCalories * 0.2) / 9;
  return Math.max(weightBasedFloor, percentageFloor);
}

export function calculateMicros(
  gender: Gender,
  age: number,
  targetCalories: number,
  isSmoker = false,
): MicronutrientTotals {
  return {
    fiber: round(calculateFiberTarget(targetCalories, age, gender), 1),
    sodium: getSodiumAiTarget(age),
    potassium: getPotassiumTarget(age, gender),
    magnesium: getMagnesiumTarget(age, gender),
    calcium: getCalciumTarget(age, gender),
    iron: getIronTarget(age, gender),
    vitaminA: getVitaminATarget(age, gender),
    vitaminC: getVitaminCTarget(age, gender, isSmoker),
    vitaminD: getVitaminDTarget(age),
    vitaminE: getVitaminETarget(),
    vitaminB12: getVitaminB12Target(),
  };
}

export function calculateNutritionTargets(
  profile: NutritionProfileInput,
): NutritionTargets {
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmr = calculateBMR(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
  );
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const clinicalCalorieFloor = calculateClinicalCalorieFloor(profile.gender);
  const absoluteCalorieFloor = Math.max(clinicalCalorieFloor, bmr);
  const deficitAdjustedCalories = tdee - profile.goalDeficit;
  const referenceWeightStrategy = bmi >= 30 ? "ideal" : "actual";
  const referenceWeight =
    referenceWeightStrategy === "ideal"
      ? calculateIdealBodyWeight(profile.height)
      : profile.weight;

  const proteinRaw = calculateProteinTarget(profile, referenceWeight);
  let targetCalories = Math.max(deficitAdjustedCalories, absoluteCalorieFloor);
  let fatRaw = calculateFatTarget(profile.weight, targetCalories);

  for (let i = 0; i < 4; i += 1) {
    const minimumCaloriesRequired = proteinRaw * 4 + fatRaw * 9;
    if (minimumCaloriesRequired <= targetCalories) {
      break;
    }

    targetCalories = minimumCaloriesRequired;
    fatRaw = calculateFatTarget(profile.weight, targetCalories);
  }

  const protein = round(proteinRaw);
  const fat = round(fatRaw);
  const carbs = round(
    Math.max(0, (targetCalories - protein * 4 - fat * 9) / 4),
  );
  const calories = round(protein * 4 + fat * 9 + carbs * 4);
  const micronutrients = calculateMicros(
    profile.gender,
    profile.age,
    calories,
    profile.isSmoker,
  );

  const guidanceFlags: string[] = [];
  if (profile.age >= 60) {
    guidanceFlags.push("מומלץ להעדיף B12 ממזונות מועשרים או מתוסף.");
  }
  if (referenceWeightStrategy === "ideal") {
    guidanceFlags.push("חלבון חושב לפי משקל יעד משוער בגלל BMI מעל 30.");
  }
  if (calories > round(deficitAdjustedCalories)) {
    guidanceFlags.push(
      "יעד הקלוריות הועלה כדי לשמור על רצפת בטיחות קלינית ומינימום מאקרו.",
    );
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    micronutrients,
    safetyThresholds: {
      sodiumCdr: SODIUM_CDRR_MG,
      upperLimits: {
        magnesium: 350,
        calcium: profile.age >= 51 ? 2000 : 2500,
        iron: 45,
        vitaminA: 3000,
        vitaminC: 2000,
        vitaminD: 100,
        vitaminE: 1000,
      },
    },
    guidanceFlags,
    calculations: {
      bmi: round(bmi, 1),
      bmr: round(bmr),
      tdee: round(tdee),
      clinicalCalorieFloor,
      absoluteCalorieFloor: round(absoluteCalorieFloor),
      referenceWeight: round(referenceWeight, 1),
      referenceWeightStrategy,
      calorieFloorApplied: deficitAdjustedCalories < absoluteCalorieFloor,
      macroMinimumsRaisedCalories:
        calories >
        round(Math.max(deficitAdjustedCalories, absoluteCalorieFloor)),
    },
  };
}

export function evaluateMicronutrientSafety(
  micronutrients: Partial<MicronutrientTotals> | null | undefined,
  profile: Pick<NutritionProfileInput, "age">,
  options: SafetyEvaluationOptions = {},
): NutritionSafetyAlert[] {
  const totals = normalizeMicronutrients(micronutrients);
  const calciumLimit = profile.age >= 51 ? 2000 : 2500;
  const alerts: NutritionSafetyAlert[] = [];

  if ((options.supplementalMagnesium ?? 0) > 350) {
    alerts.push({
      id: "magnesium-upper-limit",
      nutrient: "magnesium",
      type: "upper_limit",
      currentValue: round(options.supplementalMagnesium ?? 0, 1),
      limit: 350,
      unit: "מ״ג",
      title: "חריגה ממגנזיום מתוספים",
      message:
        "נרשמה חריגה של מגנזיום מתוספים מעל 350 מ״ג ליום. זה עלול לגרום לשלשול ותסמיני עיכול.",
    });
  }

  if (totals.calcium > calciumLimit) {
    alerts.push({
      id: "calcium-upper-limit",
      nutrient: "calcium",
      type: "upper_limit",
      currentValue: round(totals.calcium),
      limit: calciumLimit,
      unit: "מ״ג",
      title: "חריגה מהגבול העליון של סידן",
      message: `נרשמו יותר מ-${calciumLimit} מ״ג סידן היום. עודף כזה עלול להעלות סיכון להיפרקלצמיה ולאבני כליה.`,
    });
  }

  if (totals.iron > 45) {
    alerts.push({
      id: "iron-upper-limit",
      nutrient: "iron",
      type: "upper_limit",
      currentValue: round(totals.iron, 1),
      limit: 45,
      unit: "מ״ג",
      title: "חריגה מהגבול העליון של ברזל",
      message:
        "נרשמה חריגה של ברזל מעל 45 מ״ג ליום. עודף כזה עלול לגרום למצוקת עיכול ולעומס ברזל.",
    });
  }

  if (totals.sodium > SODIUM_CDRR_MG) {
    alerts.push({
      id: "sodium-cdrr",
      nutrient: "sodium",
      type: "cdrr",
      currentValue: round(totals.sodium),
      limit: SODIUM_CDRR_MG,
      unit: "מ״ג",
      title: "הנתרן עבר את סף ה-CDRR",
      message:
        "נרשמה חריגה של נתרן מעל 2300 מ״ג ליום. זו חריגה שמעלה סיכון כרוני ללחץ דם גבוה.",
    });
  }

  if ((options.retinolVitaminA ?? 0) > 3000) {
    alerts.push({
      id: "vitamin-a-upper-limit",
      nutrient: "vitaminA",
      type: "upper_limit",
      currentValue: round(options.retinolVitaminA ?? 0),
      limit: 3000,
      unit: "מק״ג RAE",
      title: "חריגה מהגבול העליון של ויטמין A",
      message:
        "נרשם רטינול מעל 3000 מק״ג RAE ליום. עודף כזה עלול לגרום לרעילות כבדית.",
    });
  }

  if (totals.vitaminC > 2000) {
    alerts.push({
      id: "vitamin-c-upper-limit",
      nutrient: "vitaminC",
      type: "upper_limit",
      currentValue: round(totals.vitaminC),
      limit: 2000,
      unit: "מ״ג",
      title: "חריגה מהגבול העליון של ויטמין C",
      message:
        "נרשמה חריגה של ויטמין C מעל 2000 מ״ג ליום. עודף כזה עלול לגרום למצוקת עיכול ולהעלות סיכון לאבני כליה.",
    });
  }

  if (totals.vitaminD > 100) {
    alerts.push({
      id: "vitamin-d-upper-limit",
      nutrient: "vitaminD",
      type: "upper_limit",
      currentValue: round(totals.vitaminD, 1),
      limit: 100,
      unit: "מק״ג",
      title: "חריגה מהגבול העליון של ויטמין D",
      message:
        "נרשמה חריגה של ויטמין D מעל 100 מק״ג ליום. עודף כזה עלול לגרום להיפרקלצמיה ולהפרעות קצב.",
    });
  }

  if (totals.vitaminE > 1000) {
    alerts.push({
      id: "vitamin-e-upper-limit",
      nutrient: "vitaminE",
      type: "upper_limit",
      currentValue: round(totals.vitaminE),
      limit: 1000,
      unit: "מ״ג",
      title: "חריגה מהגבול העליון של ויטמין E",
      message:
        "נרשמה חריגה של ויטמין E מעל 1000 מ״ג ליום. עודף כזה עלול להעלות סיכון לדימום.",
    });
  }

  return alerts;
}

export function diffSafetyAlerts(
  previousAlerts: NutritionSafetyAlert[],
  nextAlerts: NutritionSafetyAlert[],
): NutritionSafetyAlert[] {
  const previousIds = new Set(previousAlerts.map((alert) => alert.id));
  return nextAlerts.filter((alert) => !previousIds.has(alert.id));
}

export function formatNutritionValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value % 1 === 0
    ? String(Math.round(value))
    : round(value, 1).toFixed(1);
}

/**
 * Gets the current logical day key ('YYYY-MM-DD') based on a 3 AM rollover.
 * If local time is before 3 AM, it's considered the previous day.
 */
export function getLogicalDayKey(date: Date = new Date()): string {
  const adjustedDate = subHours(date, 3);
  return format(adjustedDate, "yyyy-MM-dd");
}

/**
 * Gets an array of the last 7 logical day keys (including today).
 */
export function getPast7LogicalDays(): string[] {
  const days: string[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i += 1) {
    const date = subDays(now, i);
    days.push(getLogicalDayKey(date));
  }

  return days;
}
