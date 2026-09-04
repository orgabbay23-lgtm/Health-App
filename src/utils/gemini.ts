/// <reference types="vite/client" />
import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type ContentListUnion,
  type GenerateContentConfig,
  type HttpRetryOptions,
  type Schema,
} from "@google/genai";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import type { FastCalorieItem } from "../data/fast-calorie-database";

// ── Model Routing ───────────────────────────────────────────────────
// Keep Flash Lite as the fast/cheap primary. Only the fallback receives an
// explicit thinking level; the primary intentionally uses the model default.
const PRIMARY_GEMINI_MODEL = {
  model: "gemini-3.5-flash-lite",
  timeoutMs: 10_000,
} as const;

const FALLBACK_GEMINI_MODEL = {
  model: "gemini-3.8-flash",
  thinkingLevel: ThinkingLevel.LOW,
  timeoutMs: 12_000,
} as const;

// Prefer the full 3.5 Flash model before dropping to the older compatibility
// model when the two standard routes are simultaneously capacity constrained.
const THIRD_MEAL_MODEL = {
  model: "gemini-3.5-flash",
  timeoutMs: 10_000,
} as const;

const EMERGENCY_MEAL_MODEL = {
  model: "gemini-3.1-flash-lite",
  timeoutMs: 10_000,
} as const;

type GeminiModelRoute =
  | typeof PRIMARY_GEMINI_MODEL
  | typeof FALLBACK_GEMINI_MODEL
  | typeof THIRD_MEAL_MODEL
  | typeof EMERGENCY_MEAL_MODEL;

// Bound Vault access separately from the per-model limits above.
const VAULT_REQUEST_TIMEOUT_MS = 8_000;

// A 503 means that Gemini is temporarily overloaded, not that the user's
// quota or API key is invalid. Give each model one short backoff retry before
// moving on, while keeping the whole UI flow below its hard timeout.
const GEMINI_RETRY_OPTIONS: HttpRetryOptions = {
  attempts: 2,
  initialDelay: 0.8,
  maxDelay: 1.6,
  expBase: 2,
  jitter: 0.2,
  httpStatusCodes: [408, 429, 500, 502, 503, 504],
};

export interface GeminiUserProfile {
  name: string;
  age: number;
  gender: "male" | "female";
  weight: number;
  height: number;
  activityLevel: string;
  goalDeficit: number;
  isSmoker: boolean;
}

// ── Error detection helpers ─────────────────────────────────────────
function checkIsAuthError(err: unknown): boolean {
  const error = err as { status?: unknown; message?: unknown };
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unauthorized")
  );
}

function checkIsInvalidKeyError(err: unknown): boolean {
  const error = err as { message?: unknown };
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";

  // Google can use HTTP 400 for many request problems (including schemas), so
  // never classify every 400 response as an invalid API key.
  return (
    message.includes("api_key_invalid") ||
    message.includes("invalid api key") ||
    message.includes("api key not valid") ||
    message.includes("api key not found")
  );
}

function summarizeGeminiFailure(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      kind: "response-schema-validation",
      paths: error.issues.map((issue) => issue.path.join(".")).filter(Boolean),
    };
  }

  if (error instanceof SyntaxError) {
    return { kind: "invalid-json-response" };
  }

  const candidate = error as { name?: unknown; status?: unknown; message?: unknown };
  const name = typeof candidate?.name === "string" ? candidate.name.toLowerCase() : "";
  const message = typeof candidate?.message === "string" ? candidate.message.toLowerCase() : "";
  let kind = "model-request-failed";
  if (message.includes("timeout") || name.includes("abort")) kind = "model-timeout-or-abort";
  else if (message.includes("429") || message.includes("quota") || message.includes("resource exhausted")) kind = "rate-limit-or-quota";
  else if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("server")) kind = "model-server-error";

  let reason = "unknown";
  if (message.includes("high demand")) reason = "high-demand";
  else if (message.includes("service unavailable") || message.includes("unavailable")) reason = "service-unavailable";
  else if (message.includes("timeout") || message.includes("timed out")) reason = "request-timeout";
  else if (message.includes("permission denied")) reason = "permission-denied";

  return {
    kind,
    reason,
    ...(typeof candidate?.status === "number" ? { status: candidate.status } : {}),
    ...(typeof candidate?.name === "string" ? { name: candidate.name } : {}),
  };
}

function formatGeminiFailure(model: string, error: unknown): string {
  return JSON.stringify({ model, ...summarizeGeminiFailure(error) });
}

function buildGeminiConfig(
  route: GeminiModelRoute,
  config?: GenerateContentConfig,
  signal?: AbortSignal,
): GenerateContentConfig {
  return {
    ...config,
    httpOptions: {
      ...config?.httpOptions,
      timeout: route.timeoutMs,
      retryOptions: GEMINI_RETRY_OPTIONS,
    },
    ...(signal ? { abortSignal: signal } : {}),
    ...("thinkingLevel" in route
      ? {
          thinkingConfig: {
            ...config?.thinkingConfig,
            thinkingLevel: route.thinkingLevel,
          },
        }
      : {}),
  };
}

function generateGeminiContent(
  ai: GoogleGenAI,
  route: GeminiModelRoute,
  contents: ContentListUnion,
  config?: GenerateContentConfig,
  signal?: AbortSignal,
) {
  return ai.models.generateContent({
    model: route.model,
    contents,
    config: buildGeminiConfig(route, config, signal),
  });
}

async function runWithGeminiFallback<T>(
  operation: string,
  request: (route: GeminiModelRoute) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await request(PRIMARY_GEMINI_MODEL);
  } catch (primaryError: unknown) {
    if (
      signal?.aborted ||
      checkIsAuthError(primaryError) ||
      checkIsInvalidKeyError(primaryError)
    ) {
      throw primaryError;
    }

    console.warn(
      `[Gemini] ${operation}: primary model failed; trying fallback. ${formatGeminiFailure(PRIMARY_GEMINI_MODEL.model, primaryError)}`,
    );

    try {
      return await request(FALLBACK_GEMINI_MODEL);
    } catch (fallbackError: unknown) {
      console.error(
        `[Gemini] ${operation}: both model attempts failed. ${formatGeminiFailure(FALLBACK_GEMINI_MODEL.model, fallbackError)}`,
      );
      throw fallbackError;
    }
  }
}

const mealResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meal_name: {
      type: Type.STRING,
      description: "Short Hebrew meal name.",
    },
    ingredients: {
      type: Type.ARRAY,
      description: "List of individual ingredients making up the meal.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the ingredient in Hebrew (e.g. '100 גרם אורז')." },
          calories: { type: Type.NUMBER, description: "Calories in this specific ingredient." },
          protein: { type: Type.NUMBER, description: "Protein in grams in this specific ingredient." },
        },
        required: ["name", "calories", "protein"],
      },
    },
    calories: {
      type: Type.NUMBER,
      description: "Total estimated calories for the meal.",
    },
    macronutrients: {
      type: Type.OBJECT,
      properties: {
        protein: {
          type: Type.NUMBER,
          description: "Protein in grams.",
        },
        carbs: {
          type: Type.NUMBER,
          description: "Carbohydrates in grams.",
        },
        fat: {
          type: Type.NUMBER,
          description: "Fat in grams.",
        },
      },
      required: ["protein", "carbs", "fat"],
    },
    micronutrients: {
      type: Type.OBJECT,
      properties: {
        fiber: { type: Type.NUMBER, description: "Fiber in grams." },
        sodium: { type: Type.NUMBER, description: "Sodium in milligrams." },
        potassium: { type: Type.NUMBER, description: "Potassium in milligrams." },
        magnesium: { type: Type.NUMBER, description: "Magnesium in milligrams." },
        calcium: { type: Type.NUMBER, description: "Calcium in milligrams." },
        iron: { type: Type.NUMBER, description: "Iron in milligrams." },
        vitaminA: { type: Type.NUMBER, description: "Vitamin A in micrograms RAE." },
        vitaminC: { type: Type.NUMBER, description: "Vitamin C in milligrams." },
        vitaminD: { type: Type.NUMBER, description: "Vitamin D in micrograms." },
        vitaminE: { type: Type.NUMBER, description: "Vitamin E in milligrams alpha-tocopherol." },
        vitaminB12: { type: Type.NUMBER, description: "Vitamin B12 in micrograms." },
        iodine: { type: Type.NUMBER, description: "Iodine in micrograms." },
        zinc: { type: Type.NUMBER, description: "Zinc in milligrams." },
        folicAcid: { type: Type.NUMBER, description: "Folate (folic acid) in micrograms DFE." },
        vitaminK: { type: Type.NUMBER, description: "Vitamin K in micrograms." },
        selenium: { type: Type.NUMBER, description: "Selenium in micrograms." },
        vitaminB6: { type: Type.NUMBER, description: "Vitamin B6 (pyridoxine) in milligrams." },
        vitaminB3: { type: Type.NUMBER, description: "Vitamin B3 (niacin) in milligrams NE." },
        vitaminB1: { type: Type.NUMBER, description: "Vitamin B1 (thiamine) in milligrams." },
        vitaminB2: { type: Type.NUMBER, description: "Vitamin B2 (riboflavin) in milligrams." },
        vitaminB5: { type: Type.NUMBER, description: "Vitamin B5 (pantothenic acid) in milligrams." },
        biotin: { type: Type.NUMBER, description: "Biotin (B7) in micrograms." },
        copper: { type: Type.NUMBER, description: "Copper in milligrams." },
        manganese: { type: Type.NUMBER, description: "Manganese in milligrams." },
        chromium: { type: Type.NUMBER, description: "Chromium in micrograms." },
        omega3: { type: Type.NUMBER, description: "Omega-3 EPA+DHA total in milligrams." },
      },
      required: [
        "fiber", "sodium", "potassium", "magnesium", "calcium", "iron",
        "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12",
        "iodine", "zinc", "folicAcid", "vitaminK", "selenium",
        "vitaminB6", "vitaminB3", "vitaminB1", "vitaminB2", "vitaminB5",
        "biotin", "copper", "manganese", "chromium", "omega3",
      ],
    },
  },
  required: ["meal_name", "ingredients", "calories", "macronutrients", "micronutrients"],
};

function toJsonSchema(schema: Schema): Record<string, unknown> {
  const jsonSchema: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === "type" && typeof value === "string") {
      jsonSchema.type = value.toLowerCase();
    } else if (key === "properties" && value && typeof value === "object") {
      jsonSchema.properties = Object.fromEntries(
        Object.entries(value).map(([propertyName, propertySchema]) => [
          propertyName,
          toJsonSchema(propertySchema as Schema),
        ]),
      );
    } else if (key === "items" && value && typeof value === "object") {
      jsonSchema.items = toJsonSchema(value as Schema);
    } else {
      jsonSchema[key] = value;
    }
  }

  return jsonSchema;
}

const mealResponseJsonSchema = toJsonSchema(mealResponseSchema);

const mealResponseParser = z.object({
  meal_name: z.string().min(1),
  ingredients: z.array(
    z.object({
      name: z.string().trim().min(1),
      calories: z.number().finite().nonnegative(),
      protein: z.number().finite().nonnegative(),
    })
  ).min(1),
  calories: z.number().finite().nonnegative(),
  macronutrients: z.object({
    protein: z.number().finite().nonnegative(),
    carbs: z.number().finite().nonnegative(),
    fat: z.number().finite().nonnegative(),
  }),
  micronutrients: z.object({
    fiber: z.number().finite().nonnegative(),
    sodium: z.number().finite().nonnegative(),
    potassium: z.number().finite().nonnegative(),
    magnesium: z.number().finite().nonnegative(),
    calcium: z.number().finite().nonnegative(),
    iron: z.number().finite().nonnegative(),
    vitaminA: z.number().finite().nonnegative(),
    vitaminC: z.number().finite().nonnegative(),
    vitaminD: z.number().finite().nonnegative(),
    vitaminE: z.number().finite().nonnegative(),
    vitaminB12: z.number().finite().nonnegative(),
    iodine: z.number().finite().nonnegative(),
    zinc: z.number().finite().nonnegative(),
    folicAcid: z.number().finite().nonnegative(),
    vitaminK: z.number().finite().nonnegative(),
    selenium: z.number().finite().nonnegative(),
    vitaminB6: z.number().finite().nonnegative(),
    vitaminB3: z.number().finite().nonnegative(),
    vitaminB1: z.number().finite().nonnegative(),
    vitaminB2: z.number().finite().nonnegative(),
    vitaminB5: z.number().finite().nonnegative(),
    biotin: z.number().finite().nonnegative(),
    copper: z.number().finite().nonnegative(),
    manganese: z.number().finite().nonnegative(),
    chromium: z.number().finite().nonnegative(),
    omega3: z.number().finite().nonnegative(),
  }),
});

const SYSTEM_INSTRUCTION = `You are an expert clinical nutritionist and structured data extractor. Analyze Hebrew meal descriptions and return one valid JSON object matching the provided schema. Return no markdown, explanations, comments, or extra keys. All text values, including meal_name and ingredient names, MUST be in Hebrew.

QUANTITY AND INTERPRETATION CONTRACT:
1. Preserve every quantity and unit explicitly supplied by the user. Never silently replace, reduce, or increase a stated amount. You may convert it internally for nutritional calculations, but keep the user's original quantity and unit in the ingredient name.
2. Estimate only information that is missing. When a food has no quantity, choose one reasonable Israeli serving estimate, include that numeric quantity and unit in the ingredient name, and calculate all nutrition from that assumption. Never use a range or a vague quantity such as "מנה", "קצת", or "לפי הטעם".
3. Every ingredient name MUST include a numeric quantity and an explicit unit, for example "150 גרם חזה עוף" or "2 כפות טחינה". The ingredients array must contain at least one item and must include every calorie-relevant food mentioned by the user.
4. Unless the user explicitly says raw, dry, frozen, bone-in, or unpeeled, interpret quantities as the edible, prepared, ready-to-eat portion. Exclude bones, shells, pits, packaging, and other inedible weight.
5. Preserve calorie-relevant preparation details such as fried, baked, grilled, skin-on, full-fat, low-fat, drained, or sweetened.

MIXED DISHES, SAUCES, AND COOKING FAT:
1. Keep the recognizable meal name, but represent separately in ingredients every calorie-significant component that the user states or that the named preparation necessarily contains.
2. Never omit an explicitly mentioned sauce, dressing, spread, cheese, cream, sugar, or oil. If its quantity is missing, estimate a typical amount and show that assumption in its ingredient name.
3. For fried or sautéed food, include a reasonable estimate of absorbed cooking oil unless the user explicitly says no oil or provides the oil amount. Do not add invisible optional toppings or sides that are not stated or implied by the preparation.
4. For a mixed dish such as pasta with salmon and cream sauce, return separate estimated ingredients for the pasta, salmon, and cream sauce so their calories are auditable.

NUTRITION CALCULATION CONTRACT:
1. Use best evidence-based estimates from standard food-composition references and typical Israeli products. Do not imply label-level precision when no product label was provided.
2. If a brand and exact product are supplied and you confidently know its values, use them. Otherwise use a reasonable value for the closest matching product; never invent a supposedly exact branded value.
3. Ingredient calories and protein must correspond to the quantity written in that ingredient's name.
4. Total meal calories MUST equal the sum of ingredient calories after rounding. Total meal protein MUST equal the sum of ingredient protein after rounding.
5. Total carbohydrates and fat must be calculated from the same ingredient assumptions. Perform a silent plausibility check that total calories are consistent with approximately 4 kcal/g protein, 4 kcal/g carbohydrate, and 9 kcal/g fat, allowing reasonable variance for fiber, alcohol, food-label conventions, and rounding.
6. Use non-negative finite numbers. Round calories to practical whole numbers, macronutrients to at most one decimal place, and micronutrients to sensible clinically useful precision.

MICRONUTRIENT CONTRACT — RETURN ALL 26 KEYS:
fiber, sodium, potassium, magnesium, calcium, iron, vitaminA, vitaminC, vitaminD, vitaminE, vitaminB12, iodine, zinc, folicAcid, vitaminK, selenium, vitaminB6, vitaminB3, vitaminB1, vitaminB2, vitaminB5, biotin, copper, manganese, chromium, omega3.

Required units: fiber (g); sodium, potassium, magnesium, calcium (mg); iron (mg); vitaminA (µg RAE); vitaminC (mg); vitaminD (µg); vitaminE (mg α-tocopherol); vitaminB12 (µg); iodine (µg); zinc (mg); folicAcid (µg DFE); vitaminK (µg); selenium (µg); vitaminB6 (mg); vitaminB3 (mg NE); vitaminB1 (mg); vitaminB2 (mg); vitaminB5 (mg); biotin (µg); copper (mg); manganese (mg); chromium (µg); omega3 (mg).

For omega3, estimate only EPA + DHA in milligrams; do not count ALA. Use 0 only when a nutrient is reasonably negligible for the entire meal, never merely because the value is uncertain. Never omit a micronutrient key.

Handle common Israeli food slang, colloquialisms, spelling mistakes, and commercial brand names such as Osem, Tnuva, and Strauss. Before returning the JSON, silently verify schema completeness, explicit ingredient quantities, arithmetic consistency, Hebrew text, and all 26 micronutrient keys.`;

export type ParsedMealDescription = z.infer<typeof mealResponseParser>;

const VISION_SYSTEM_INSTRUCTION = `You are a clinical nutritionist and visual portion-size estimator. Identify every calorie-relevant food in the image and describe it in natural Hebrew for a calorie tracking diary. Every identified item MUST include one explicit numeric quantity and a logical unit. When exact measurement is impossible, infer one best estimate from visible scale cues and typical Israeli serving sizes. Never omit a quantity because of uncertainty.`;

const VISION_PROMPT = `Analyze this image and list every food item as a simple, comma-separated Hebrew string. 

MANDATORY QUANTITY CONTRACT:
1. EVERY comma-separated food item MUST contain exactly one numeric amount and an explicit unit. Never return a food name by itself.
2. If no reliable scale reference is visible, you MUST still choose one best estimate. Do not output a range, "unknown", or a vague size such as "מנה" or "קצת".
3. Infer portion size from all available visual cues: plate or bowl coverage, container volume, food depth and thickness, utensil size, number of pieces, and the relative proportions between ingredients. If no scale cue exists, assume a standard dinner plate is about 26 cm wide or a standard bowl holds about 500 ml.
4. Before answering, silently verify that every food item in the final string has both a number and a unit.

Use the most logical Israeli unit:
- Countable foods: 'יחידות' or 'פרוסות' (sushi, nuggets, bread, fruit, pastries).
- Pasta, rice, grains, salads and other bulk foods: 'כוסות' or 'כפות'. Decimals such as '1.5 כוסות' are allowed.
- Meat, chicken, fish, fries and other solid proteins or dense foods: 'גרם'.
- Sauces, dressings, cream, oil and spreads: 'כפות', 'כפיות' or 'מ״ל'. These calorie-dense additions MUST be included when visible or clearly part of the named dish.

IDENTIFICATION RULES:
1. Keep the recognizable dish name, but separately quantify visible calorie-significant components when doing so improves calorie accuracy. Do not deconstruct foods into invisible raw ingredients such as flour or water.
2. For a mixed pasta dish, quantify the pasta, visible protein, and sauce separately instead of returning only the dish name.
3. Include only preparation details that affect calories, such as fried, roasted, skin-on, bone-in, or a cream-based sauce.
4. Strictly avoid sensory or decorative descriptions such as fresh, round, tasty, or red.

Output ONLY the Hebrew string. No conversational text or markdown.

Correct output examples:
- Pasta dish: '2 כוסות פסטה רחבה, 100 גרם סלמון, 4 כפות רוטב שמנת'.
- Sushi: '24 יחידות סושי מאקי במילוי סלמון ואבוקדו'.
- Breakfast: '2 יחידות ביצים מטוגנות, 2 פרוסות לחם, 1 כף גבינה לבנה'.

Incorrect output: 'פסטה רחבה עם סלמון ורוטב שמנת' — quantities are missing and this is forbidden.`;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Meal Image Analysis ──────────────────────────────────────────────
export async function analyzeMealImage(
  base64Image: string,
  mimeType: string,
  signal?: AbortSignal,
): Promise<string> {
  const finalKey = await getApiKey(signal);
  const ai = new GoogleGenAI({ apiKey: finalKey });

  const performRequest = async (route: GeminiModelRoute) => {
    const result = await generateGeminiContent(
      ai,
      route,
      [
        { inlineData: { data: base64Image, mimeType } },
        { text: VISION_PROMPT },
      ],
      { systemInstruction: VISION_SYSTEM_INSTRUCTION },
      signal,
    );
    const text = result.text?.trim() ?? "";
    if (!text) throw new Error("Empty response");
    return text;
  };

  try {
    return await runWithGeminiFallback("meal-image-analysis", performRequest, signal);
  } catch (modelError: unknown) {
    if (checkIsAuthError(modelError) || checkIsInvalidKeyError(modelError)) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error("שגיאה בזיהוי התמונה, אנא נסו שוב מאוחר יותר.");
  }
}

export function clearCachedApiKey() {
  // No-op: Cache killed to guarantee fresh key on every request
}

export const getApiKey = async (signal?: AbortSignal): Promise<string> => {
  const requestController = new AbortController();
  const forwardAbort = () => requestController.abort();
  const timeoutId = window.setTimeout(
    () => requestController.abort(),
    VAULT_REQUEST_TIMEOUT_MS,
  );

  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener("abort", forwardAbort, { once: true });
  }

  let vaultData: unknown;
  let vaultError: unknown;

  try {
    const request = supabase.rpc('get_user_api_key');
    request.abortSignal(requestController.signal);
    const response = await request;
    vaultData = response.data;
    vaultError = response.error;

    if (requestController.signal.aborted) {
      throw new Error(signal?.aborted ? "REQUEST_ABORTED" : "VAULT_TIMEOUT");
    }
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", forwardAbort);
  }

  if (vaultError) {
    console.error("Vault retrieval error:", vaultError);
    throw new Error("VAULT_ERROR");
  }

  let finalKey = "";
  if (typeof vaultData === 'string') {
    finalKey = vaultData.trim();
  }

  // FIX: Removed env variable fallback — all keys must go through Vault per AI_RULES.md Section 4
  if (!finalKey || finalKey === 'undefined' || finalKey === 'null') {
    throw new Error("MISSING_API_KEY");
  }

  return finalKey;
};

// ── Insight Functions (single model, default thinking) ───────────────

const INSIGHT_SYSTEM_INSTRUCTION = `You are a friendly, warm, and highly professional Israeli clinical nutritionist. Analyze the provided nutritional data (calories, macros, fiber, and all 26 micronutrients) for the given timeframe.

CRITICAL — Goal-Aware Evaluation:
You will receive the user's profile including their caloric deficit goal (goalDeficit). A positive goalDeficit means the user is trying to LOSE WEIGHT.
- If the user's goal is Weight Loss (goalDeficit > 0) and they exceeded their calorie target (calories > 100%), you MUST gently flag this as a point for improvement. ABSOLUTELY DO NOT congratulate them for exceeding calories.
- If the user's goal is Weight Loss and calories are at or under target, praise them for caloric discipline.
- Always evaluate macros and micros relative to the user's specific profile (age, gender, activity level, smoker status).

Rules for your response:
- Language: Hebrew.
- Tone: Warm, friendly, encouraging, strictly NO fluff.
- Formatting (STRICT):
  1. Start main sections with a number and a dot (e.g., 1. נקודות לשימור).
  2. Use plain bullet points with a dash (-). 
  3. Wrap ALL labels and important terms in double asterisks (e.g., **המלצה:**, **חלבון:**).
  4. ABSOLUTELY FORBIDDEN: Do not use hashes (#), backticks, or any other markdown headers.
- Structure:
  1. A short, encouraging opening sentence (max 1 sentence).
  2. 1. נקודות לשימור - What went well (2-3 short bullets, max 1-2 sentences each).
  3. 2. נקודות לשיפור - What is missing/over the limit, and suggest 2-3 specific, common Israeli foods to fix it. IMPORTANT: Provide practical, everyday portion sizes (e.g., 'חצי גביע קוטג 5%', 'כף טחינה גולמית') rather than just naming the ingredient (2-3 short bullets, max 1-2 sentences each).
- Use relevant and fun emojis natively within the text (e.g., 💪, 🥑, 🔥, ✨, 🥗, 💧, 🌟) to make the tone vibrant and engaging.
- Keep it extremely concise, punchy, and actionable. No long explanations.`;

export async function generateNutritionalInsight(
  timeframe: 'day' | 'week' | 'month',
  nutritionData: Record<string, number>,
  userProfile: GeminiUserProfile,
): Promise<string> {
  const finalKey = await getApiKey();

  let timeContext = "";
  if (timeframe === 'day') {
    const currentTime = new Date().toLocaleTimeString("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" });
    timeContext = `\nהשעה הנוכחית בישראל היא ${currentTime}. קח זאת בחשבון: חוסר קלורי בבוקר הוא הגיוני, אך בערב הוא דורש השלמה.\n`;
  }

  const userPrompt = `תקופה: ${timeframe === 'day' ? 'יום' : timeframe === 'week' ? 'שבוע' : 'חודש'}
${timeContext}
פרופיל המשתמש:
${JSON.stringify(userProfile)}

נתוני התזונה (אחוזים מהיעד היומי/תקופתי — 100% = הגעת ליעד):
${JSON.stringify(nutritionData)}

נתח את הנתונים ותן המלצה קצרה ומותאמת אישית תוך שימוש בפורמט המספור וההדגשה הנדרש.`;

  try {
    const ai = new GoogleGenAI({ apiKey: finalKey });
    return await runWithGeminiFallback("nutritional-insight", async (route) => {
      const result = await generateGeminiContent(
        ai,
        route,
        userPrompt,
        { systemInstruction: INSIGHT_SYSTEM_INSTRUCTION },
      );
      const text = result.text?.trim() ?? "";
      if (!text) throw new Error("Empty response");
      return text;
    });
  } catch (apiError: unknown) {
    if (checkIsAuthError(apiError) || checkIsInvalidKeyError(apiError)) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error("שגיאה ביצירת ההמלצה, אנא נסו שוב מאוחר יותר.");
  }
}

const CUSTOM_ANSWER_SYSTEM_INSTRUCTION = `You are a warm, friendly, and human Israeli clinical nutritionist. 
Your goal is to directly answer the user's specific question using their provided nutritional context and profile.
- Tone: Human, warm, and concise.
- Directness: Answer the specific question immediately.
- Context: Use the provided data (calories, macros, micros vs targets) only if relevant to the question. Don't overwhelm with numbers.
- Language: Hebrew.
- Formatting (STRICT): 
  1. Start main list items with a number and a dot (e.g., 1. כותרת).
  2. Use dashes (-) for sub-lists.
  3. Wrap ALL labels and important terms in double asterisks (e.g., **הסבר:**, **סימפטומים:**). 
  4. If there is a medical or toxicity warning, you MUST write exactly **אזהרת רעילות:** or **אזהרה רפואית:**.
  5. ABSOLUTELY FORBIDDEN: Do not use hashes (#), backticks, or any other markdown headers.
- Emojis: Use 1-2 relevant emojis to keep it friendly.`;

export async function generateCustomAnswer(
  userData: GeminiUserProfile,
  period: string,
  nutritionData: Record<string, number>,
  question: string,
): Promise<string> {
  const finalKey = await getApiKey();

  const userPrompt = `
תקופה: ${period}
פרופיל משתמש: ${JSON.stringify(userData)}
נתוני תזונה: ${JSON.stringify(nutritionData)}
שאלת המשתמש: ${question}

ענה למשתמש בצורה אנושית וחמה בהתבסס על הנתונים תוך שימוש בפורמט המספור וההדגשה הנדרש.
`;

  try {
    const ai = new GoogleGenAI({ apiKey: finalKey });
    return await runWithGeminiFallback("custom-nutrition-answer", async (route) => {
      const result = await generateGeminiContent(
        ai,
        route,
        userPrompt,
        { systemInstruction: CUSTOM_ANSWER_SYSTEM_INSTRUCTION },
      );
      const text = result.text?.trim() ?? "";
      if (!text) throw new Error("Empty response");
      return text;
    });
  } catch (apiError: unknown) {
    if (checkIsAuthError(apiError) || checkIsInvalidKeyError(apiError)) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error("שגיאה במתן התשובה, אנא נסו שוב מאוחר יותר.");
  }
}

const SUPPLEMENT_SYSTEM_INSTRUCTION = `You are an expert Israeli clinical nutritionist specializing in supplementation.
Your goal is to recommend the Top 5 dietary supplements based on the user's likely deficiencies from their monthly data.

Rules:
1. EXCLUDE: Do not recommend vitamins primarily synthesized outside the diet, like Vitamin D (from sun).
2. GROUP: Recommend grouped supplements like "B-Complex" rather than individual B vitamins if multiple are low.
3. TOXICITY WARNING: For fat-soluble vitamins (A, E, K) or minerals with toxicity risk (Iron, Zinc, etc.), explicitly state that a blood test is MANDATORY before starting.
4. RANKING RULE: You MUST sort the Top 5 recommendations by SAFETY first, then by deficiency severity. Safe, water-soluble vitamins and minerals (e.g., B-Complex, Vitamin C, Magnesium, Calcium) MUST appear at the top of the list (ranks 1-3). Fat-soluble vitamins with toxicity risks (e.g., Vitamin A, K, E) or minerals with high toxicity risk (e.g., Iron) MUST be pushed to the bottom of the list (ranks 4-5), even if their mathematical deficiency gap is much larger. Never recommend highly toxic elements first.
5. Formatting (STRICT): 
   - Start main list items with a number and a dot (e.g., 1. Vitamin B12).
   - Use dashes (-) for sub-lists.
   - Wrap ALL labels and important terms in double asterisks (e.g., **הסבר:**, **סימפטומים:**). 
   - If there is a medical or toxicity warning, you MUST write exactly **אזהרת רעילות:** or **אזהרה רפואית:**. 
   - Each supplement entry should include:
     1. Name of supplement (as a numbered header, e.g., 1. ויטמין B12).
     2. **הסבר:** Brief explanation of why it's recommended based on their data.
     3. **סימפטומים:** Common deficiency symptoms.
     4. **מקורות מהמזון:** Top 3-4 food sources in Israel to fix it naturally.
   - ABSOLUTELY FORBIDDEN: Do not use hashes (#), backticks, or any other markdown headers.
6. DISCLAIMER: End with a strict medical disclaimer: "המידע המוצג הוא בגדר המלצה תזונתית בלבד ואינו מהווה ייעוץ רפואי. יש להיוועץ ברופא/ה ולבצע בדיקות דם לפני נטילת תוספי תזונה."
7. LANGUAGE: Hebrew.
8. TONE: Professional yet accessible.`;

export async function generateSupplementRecommendations(
  userData: GeminiUserProfile,
  nutritionData: Record<string, number>,
): Promise<string> {
  const finalKey = await getApiKey();

  const userPrompt = `
נתוני תזונה חודשיים (אחוזים מהיעד): ${JSON.stringify(nutritionData)}
פרופיל משתמש: ${JSON.stringify(userData)}

בהתבסס על החסרים בתזונה החודשית, המלץ על 5 תוספי התזונה המתאימים ביותר תוך שימוש בפורמט המספור וההדגשה הנדרש.
`;

  try {
    const ai = new GoogleGenAI({ apiKey: finalKey });
    return await runWithGeminiFallback("supplement-recommendations", async (route) => {
      const result = await generateGeminiContent(
        ai,
        route,
        userPrompt,
        { systemInstruction: SUPPLEMENT_SYSTEM_INSTRUCTION },
      );
      const text = result.text?.trim() ?? "";
      if (!text) throw new Error("Empty response");
      return text;
    });
  } catch (apiError: unknown) {
    if (checkIsAuthError(apiError) || checkIsInvalidKeyError(apiError)) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error("שגיאה ביצירת המלצות לתוספים, אנא נסו שוב מאוחר יותר.");
  }
}

const FOLLOWUP_SYSTEM_INSTRUCTION = `You are the same friendly Israeli clinical nutritionist. The user is asking a follow-up question regarding your previous recommendation.
Rules:
- Language: Hebrew.
- Answer directly, concisely (max 2-3 sentences), in a warm and friendly tone.
- Use relevant emojis to keep the tone vibrant.
- Formatting (STRICT):
  1. Wrap important terms in double asterisks (e.g., **חשוב לדעת:**). 
  2. ABSOLUTELY FORBIDDEN: Do not use hashes (#), backticks, or any other markdown headers.
- If the user asks for medical advice, medication instructions, or diagnostic information beyond basic nutrition, gently remind them to consult a doctor.`;


export async function answerInsightFollowUp(
  originalInsight: string,
  userQuestion: string,
  userProfile: GeminiUserProfile,
): Promise<string> {
  const finalKey = await getApiKey();

  const userPrompt = `ההמלצה הקודמת שלך:
${originalInsight}

פרופיל המשתמש:
${JSON.stringify(userProfile)}

שאלת המשתמש:
${userQuestion}`;

  try {
    const ai = new GoogleGenAI({ apiKey: finalKey });
    return await runWithGeminiFallback("insight-follow-up", async (route) => {
      const result = await generateGeminiContent(
        ai,
        route,
        userPrompt,
        { systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION },
      );
      const text = result.text?.trim() ?? "";
      if (!text) throw new Error("Empty response");
      return text;
    });
  } catch (apiError: unknown) {
    if (checkIsAuthError(apiError) || checkIsInvalidKeyError(apiError)) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error("שגיאה בתשובה לשאלה, אנא נסו שוב מאוחר יותר.");
  }
}

// ── Meal Text Parsing ────────────────────────────────────────────────
export async function parseMealDescription(
  description: string,
  signal?: AbortSignal,
): Promise<ParsedMealDescription> {
  try {
    const finalKey = await getApiKey(signal);

    if (!finalKey) {
      throw new Error("MISSING_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey: finalKey });
    const performRequest = async (route: GeminiModelRoute) => {
      const interaction = await ai.interactions.create(
        {
          model: route.model,
          input: description.trim(),
          system_instruction: SYSTEM_INSTRUCTION,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: mealResponseJsonSchema,
          },
          store: false,
          ...("thinkingLevel" in route
            ? { generation_config: { thinking_level: "low" } }
            : {}),
        },
        {
          timeout: route.timeoutMs,
          maxRetries: 0,
          ...(signal ? { fetchOptions: { signal } } : {}),
        },
      );
      const responseText = interaction.output_text?.trim() ?? "";

      if (!responseText) {
        throw new Error("Gemini returned an empty response body.");
      }

      return mealResponseParser.parse(JSON.parse(responseText));
    };

    try {
      return await runWithGeminiFallback("meal-description-parsing", performRequest, signal);
    } catch (modelError: unknown) {
      if (checkIsAuthError(modelError)) throw new Error("API_KEY_INVALID");
      if (checkIsInvalidKeyError(modelError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
      if (signal?.aborted) throw modelError;

      console.warn(
        `[Gemini] meal-description-parsing: trying third model. ${formatGeminiFailure(FALLBACK_GEMINI_MODEL.model, modelError)}`,
      );

      try {
        return await performRequest(THIRD_MEAL_MODEL);
      } catch (thirdModelError: unknown) {
        if (checkIsAuthError(thirdModelError)) throw new Error("API_KEY_INVALID");
        if (checkIsInvalidKeyError(thirdModelError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
        if (signal?.aborted) throw thirdModelError;

        console.warn(
          `[Gemini] meal-description-parsing: trying emergency compatibility model. ${formatGeminiFailure(THIRD_MEAL_MODEL.model, thirdModelError)}`,
        );

        try {
          return await performRequest(EMERGENCY_MEAL_MODEL);
        } catch (emergencyError: unknown) {
          console.error(
            `[Gemini] meal-description-parsing: all model routes failed. ${formatGeminiFailure(EMERGENCY_MEAL_MODEL.model, emergencyError)}`,
          );
          if (checkIsAuthError(emergencyError)) throw new Error("API_KEY_INVALID");
          if (checkIsInvalidKeyError(emergencyError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
          throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MISSING_API_KEY" || message === "API_KEY_INVALID" || message === "INVALID_KEY_FROM_GOOGLE") {
      throw error;
    }
    throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
  }
}

export async function fetchFastCalorieFromAI(query: string): Promise<FastCalorieItem> {
  try {
    const key = await getApiKey();
    const ai = new GoogleGenAI({ apiKey: key });

    const prompt = `
      Act as an Israeli clinical dietitian. The user is asking for the caloric value of: "${query}".
      Identify the core food item, its calories per 100g, and a logical serving unit (like "כף", "כוס", "יחידה", "פרוסה").
      If the user mentioned a specific unit in their query (e.g., "כף"), make sure to use that as the commonUnit.
      
      Return ONLY a valid JSON object matching this TypeScript interface exactly:
      {
        "name": string, // Clean Hebrew name of the food
        "caloriesPer100g": number,
        "commonUnit": {
          "name": string, // Hebrew name of the unit
          "weightInGrams": number // Weight of this unit in grams
        }
      }
    `;

    return await runWithGeminiFallback("fast-calorie-lookup", async (route) => {
      const result = await generateGeminiContent(
        ai,
        route,
        prompt,
        { responseMimeType: "application/json" },
      );
      const text = result.text?.trim() ?? "";
      if (!text) throw new Error("Empty response");
      return JSON.parse(text) as FastCalorieItem;
    });
  } catch (error) {
    console.error("[Gemini] Fast Calorie fetch failed:", summarizeGeminiFailure(error));
    throw new Error("Failed to fetch calorie data from AI.");
  }
}

const editedIngredientsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      description: "List of edited ingredients.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the ingredient in Hebrew (e.g. '100 גרם עגבניה')." },
          calories: { type: Type.NUMBER, description: "Calories in this specific ingredient." },
          protein: { type: Type.NUMBER, description: "Protein in grams in this specific ingredient." },
        },
        required: ["name", "calories", "protein"],
      },
    },
  },
  required: ["ingredients"],
};

const editedIngredientsParser = z.object({
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      calories: z.number().finite().nonnegative(),
      protein: z.number().finite().nonnegative(),
    })
  ).min(1),
});

export type ParsedEditedIngredients = z.infer<typeof editedIngredientsParser>;

export interface IngredientEditRequest {
  oldName: string;
  oldCalories: number;
  oldProtein: number;
  newText: string;
}

const EDIT_SYSTEM_INSTRUCTION = `You are an expert clinical nutritionist. The user edited specific ingredients. For each item, you are given the original name, original calories, original protein, and the NEW requested text. Use the original values as a strict baseline to accurately and proportionally calculate the new values based on the requested change (e.g. if weight doubled, double the calories and protein). Return their standard Hebrew name, calories, and protein in grams. DO NOT return markdown. ONLY valid JSON. All returned text fields MUST be in Hebrew.`;

export async function parseEditedIngredients(
  edits: IngredientEditRequest[],
  signal?: AbortSignal,
): Promise<ParsedEditedIngredients> {
  try {
    const finalKey = await getApiKey(signal);
    if (!finalKey) throw new Error("MISSING_API_KEY");

    const prompt = `Please analyze these specific edited ingredients:\n\n${edits.map(e => `Original: "${e.oldName}" (${e.oldCalories} kcal, ${e.oldProtein}g protein)\nNew Request: "${e.newText}"`).join("\n\n")}`;

    const ai = new GoogleGenAI({ apiKey: finalKey });
    const performRequest = async (route: GeminiModelRoute) => {
      const result = await generateGeminiContent(
        ai,
        route,
        prompt,
        {
          systemInstruction: EDIT_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: editedIngredientsSchema,
        },
        signal,
      );
      const responseText = result.text?.trim() ?? "";
      if (!responseText) throw new Error("Gemini returned an empty response body.");
      return editedIngredientsParser.parse(JSON.parse(responseText));
    };

    return await runWithGeminiFallback("edited-ingredient-parsing", performRequest, signal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MISSING_API_KEY" || message === "API_KEY_INVALID" || message === "INVALID_KEY_FROM_GOOGLE") {
      throw error;
    }
    if (checkIsAuthError(error)) throw new Error("API_KEY_INVALID");
    if (checkIsInvalidKeyError(error)) throw new Error("INVALID_KEY_FROM_GOOGLE");
    throw new Error("שגיאה בניתוח המרכיבים, אנא נסו שוב מאוחר יותר.");
  }
}
