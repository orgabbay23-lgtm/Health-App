/// <reference types="vite/client" />
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

const mealResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    meal_name: {
      type: SchemaType.STRING,
      description: "Short Hebrew meal name.",
    },
    calories: {
      type: SchemaType.NUMBER,
      description: "Total estimated calories for the meal.",
    },
    macronutrients: {
      type: SchemaType.OBJECT,
      properties: {
        protein: {
          type: SchemaType.NUMBER,
          description: "Protein in grams.",
        },
        carbs: {
          type: SchemaType.NUMBER,
          description: "Carbohydrates in grams.",
        },
        fat: {
          type: SchemaType.NUMBER,
          description: "Fat in grams.",
        },
      },
      required: ["protein", "carbs", "fat"],
    },
    micronutrients: {
      type: SchemaType.OBJECT,
      properties: {
        fiber: { type: SchemaType.NUMBER, description: "Fiber in grams." },
        sodium: { type: SchemaType.NUMBER, description: "Sodium in milligrams." },
        potassium: { type: SchemaType.NUMBER, description: "Potassium in milligrams." },
        magnesium: { type: SchemaType.NUMBER, description: "Magnesium in milligrams." },
        calcium: { type: SchemaType.NUMBER, description: "Calcium in milligrams." },
        iron: { type: SchemaType.NUMBER, description: "Iron in milligrams." },
        vitaminA: { type: SchemaType.NUMBER, description: "Vitamin A in micrograms RAE." },
        vitaminC: { type: SchemaType.NUMBER, description: "Vitamin C in milligrams." },
        vitaminD: { type: SchemaType.NUMBER, description: "Vitamin D in micrograms." },
        vitaminE: { type: SchemaType.NUMBER, description: "Vitamin E in milligrams alpha-tocopherol." },
        vitaminB12: { type: SchemaType.NUMBER, description: "Vitamin B12 in micrograms." },
        iodine: { type: SchemaType.NUMBER, description: "Iodine in micrograms." },
        zinc: { type: SchemaType.NUMBER, description: "Zinc in milligrams." },
        folicAcid: { type: SchemaType.NUMBER, description: "Folate (folic acid) in micrograms DFE." },
        vitaminK: { type: SchemaType.NUMBER, description: "Vitamin K in micrograms." },
        selenium: { type: SchemaType.NUMBER, description: "Selenium in micrograms." },
        vitaminB6: { type: SchemaType.NUMBER, description: "Vitamin B6 (pyridoxine) in milligrams." },
        vitaminB3: { type: SchemaType.NUMBER, description: "Vitamin B3 (niacin) in milligrams NE." },
        vitaminB1: { type: SchemaType.NUMBER, description: "Vitamin B1 (thiamine) in milligrams." },
        vitaminB2: { type: SchemaType.NUMBER, description: "Vitamin B2 (riboflavin) in milligrams." },
        vitaminB5: { type: SchemaType.NUMBER, description: "Vitamin B5 (pantothenic acid) in milligrams." },
        biotin: { type: SchemaType.NUMBER, description: "Biotin (B7) in micrograms." },
        copper: { type: SchemaType.NUMBER, description: "Copper in milligrams." },
        manganese: { type: SchemaType.NUMBER, description: "Manganese in milligrams." },
        chromium: { type: SchemaType.NUMBER, description: "Chromium in micrograms." },
      },
      required: [
        "fiber", "sodium", "potassium", "magnesium", "calcium", "iron",
        "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB12",
        "iodine", "zinc", "folicAcid", "vitaminK", "selenium",
        "vitaminB6", "vitaminB3", "vitaminB1", "vitaminB2", "vitaminB5",
        "biotin", "copper", "manganese", "chromium",
      ],
    },
  },
  required: ["meal_name", "calories", "macronutrients", "micronutrients"],
};

const mealResponseParser = z.object({
  meal_name: z.string().min(1),
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
  }),
});

const SYSTEM_INSTRUCTION = `You are an expert clinical nutritionist and structured data extractor. Analyze Hebrew meal descriptions, estimate reasonable Israeli portion sizes when omitted, and return only valid JSON matching the requested schema. Do not return markdown, explanations, or extra keys.

CRITICAL — You MUST return accurate values for ALL 23 micronutrients in the "micronutrients" object:
fiber, sodium, potassium, magnesium, calcium, iron, vitaminA, vitaminC, vitaminD, vitaminE, vitaminB12, iodine, zinc, folicAcid, vitaminK, selenium, vitaminB6, vitaminB3, vitaminB1, vitaminB2, vitaminB5, biotin, copper, manganese, chromium.

Units: fiber (g), sodium/potassium/magnesium/calcium (mg), iron (mg), vitaminA (µg RAE), vitaminC (mg), vitaminD (µg), vitaminE (mg α-tocopherol), vitaminB12 (µg), iodine (µg), zinc (mg), folicAcid (µg DFE), vitaminK (µg), selenium (µg), vitaminB6 (mg), vitaminB3 (mg NE), vitaminB1 (mg), vitaminB2 (mg), vitaminB5 (mg), biotin (µg), copper (mg), manganese (mg), chromium (µg).

Use USDA/clinical-grade reference data. If a micronutrient is truly absent from the meal, return 0. Never omit a key.`;

export type ParsedMealDescription = z.infer<typeof mealResponseParser>;

export function clearCachedApiKey() {
  // No-op: Cache killed to guarantee fresh key on every request
}

const getApiKey = async (): Promise<string> => {
  const { data: vaultData, error: vaultError } = await supabase.rpc('get_user_api_key');

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

const INSIGHT_SYSTEM_INSTRUCTION = `You are a friendly, warm, and highly professional Israeli clinical nutritionist. Analyze the provided nutritional data (calories, macros, fiber, and all 23 micronutrients) for the given timeframe.

CRITICAL — Goal-Aware Evaluation:
You will receive the user's profile including their caloric deficit goal (goalDeficit). A positive goalDeficit means the user is trying to LOSE WEIGHT.
- If the user's goal is Weight Loss (goalDeficit > 0) and they exceeded their calorie target (calories > 100%), you MUST gently flag this as a point for improvement. ABSOLUTELY DO NOT congratulate them for exceeding calories.
- If the user's goal is Weight Loss and calories are at or under target, praise them for caloric discipline.
- Always evaluate macros and micros relative to the user's specific profile (age, gender, activity level, smoker status).

Rules for your response:
- Language: Hebrew.
- Tone: Warm, friendly, encouraging, strictly NO fluff.
- Format: Use plain bullet points with a dash (-). DO NOT use markdown asterisks (**) for bolding. DO NOT use any markdown formatting. Use standard plain text only.
- Structure:
  1. A short, encouraging opening sentence (max 1 sentence).
  2. נקודות לשימור - What went well (2-3 short bullets, max 1-2 sentences each).
  3. נקודות לשיפור - What is missing/over the limit, and suggest 2-3 specific, common Israeli foods to fix it (2-3 short bullets, max 1-2 sentences each).
- Use relevant and fun emojis natively within the text (e.g., 💪, 🥑, 🔥, ✨, 🥗, 💧, 🌟) to make the tone vibrant and engaging.
- Keep it extremely concise, punchy, and actionable. No long explanations.`;

export async function generateNutritionalInsight(
  timeframe: 'day' | 'week' | 'month',
  nutritionData: Record<string, unknown>,
  userProfile: Record<string, unknown>,
): Promise<string> {
  const finalKey = await getApiKey();

  const userPrompt = `תקופה: ${timeframe === 'day' ? 'יום' : timeframe === 'week' ? 'שבוע' : 'חודש'}

פרופיל המשתמש:
${JSON.stringify(userProfile)}

נתוני התזונה (אחוזים מהיעד היומי/תקופתי — 100% = הגעת ליעד):
${JSON.stringify(nutritionData)}

נתח את הנתונים ותן המלצה קצרה ומותאמת אישית.`;

  const performRequest = async (modelName: string) => {
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: INSIGHT_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  };

  try {
    return await performRequest(PRIMARY_MODEL);
  } catch (apiError: any) {
    const isAuthError =
      apiError?.status === 401 ||
      apiError?.status === 403 ||
      apiError?.message?.includes("401") ||
      apiError?.message?.includes("403") ||
      apiError?.message?.toLowerCase?.()?.includes("unauthorized") ||
      apiError?.message?.toLowerCase?.()?.includes("invalid api key");

    if (isAuthError) throw new Error("API_KEY_INVALID");

    const isQuotaError =
      apiError?.status === 429 ||
      apiError?.message?.includes("429") ||
      apiError?.message?.toLowerCase?.()?.includes("quota");

    if (isQuotaError) {
      try {
        return await performRequest(FALLBACK_MODEL);
      } catch {
        throw new Error("שגיאה ביצירת ההמלצה, אנא נסו שוב מאוחר יותר.");
      }
    }

    throw new Error("שגיאה ביצירת ההמלצה, אנא נסו שוב מאוחר יותר.");
  }
}

const FOLLOWUP_SYSTEM_INSTRUCTION = `You are the same friendly Israeli clinical nutritionist. The user is asking a follow-up question regarding your previous recommendation.
Rules:
- Language: Hebrew.
- Answer directly, concisely (max 2-3 sentences), in a warm and friendly tone.
- Use relevant emojis to keep the tone vibrant.
- DO NOT use markdown asterisks (**) for bolding. Use standard plain text only.`;

export async function answerInsightFollowUp(
  originalInsight: string,
  userQuestion: string,
  userProfile: Record<string, unknown>,
): Promise<string> {
  const finalKey = await getApiKey();

  const userPrompt = `ההמלצה הקודמת שלך:
${originalInsight}

פרופיל המשתמש:
${JSON.stringify(userProfile)}

שאלת המשתמש:
${userQuestion}`;

  const performRequest = async (modelName: string) => {
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  };

  try {
    return await performRequest(PRIMARY_MODEL);
  } catch (apiError: any) {
    const isAuthError =
      apiError?.status === 401 ||
      apiError?.status === 403 ||
      apiError?.message?.includes("401") ||
      apiError?.message?.includes("403") ||
      apiError?.message?.toLowerCase?.()?.includes("unauthorized") ||
      apiError?.message?.toLowerCase?.()?.includes("invalid api key");

    if (isAuthError) throw new Error("API_KEY_INVALID");

    const isQuotaError =
      apiError?.status === 429 ||
      apiError?.message?.includes("429") ||
      apiError?.message?.toLowerCase?.()?.includes("quota");

    if (isQuotaError) {
      try {
        return await performRequest(FALLBACK_MODEL);
      } catch {
        throw new Error("שגיאה בתשובה לשאלה, אנא נסו שוב מאוחר יותר.");
      }
    }

    throw new Error("שגיאה בתשובה לשאלה, אנא נסו שוב מאוחר יותר.");
  }
}

export async function parseMealDescription(
  description: string,
): Promise<ParsedMealDescription> {
  try {
    const finalKey = await getApiKey();

    if (!finalKey) {
      throw new Error("MISSING_API_KEY");
    }

    const performRequest = async (modelName: string) => {
      // FIX: Removed console.log that leaked API key content
      const genAI = new GoogleGenerativeAI(finalKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: mealResponseSchema,
        },
      });
      const result = await model.generateContent(description.trim());
      const responseText = result.response.text().trim();

      if (!responseText) {
        throw new Error("Gemini returned an empty response body.");
      }

      return mealResponseParser.parse(JSON.parse(responseText));
    };

    try {
      return await performRequest(PRIMARY_MODEL);
    } catch (apiError: any) {
      const isAuthError =
        apiError?.status === 401 ||
        apiError?.status === 403 ||
        apiError?.message?.includes("401") ||
        apiError?.message?.includes("403") ||
        apiError?.message?.toLowerCase().includes("unauthorized") ||
        apiError?.message?.toLowerCase().includes("invalid api key") ||
        apiError?.message?.toLowerCase().includes("api key not found");

      if (isAuthError) {
        throw new Error("API_KEY_INVALID");
      }

      const isInvalidKeyError =
        apiError?.status === 400 ||
        apiError?.message?.includes("400") ||
        apiError?.message?.includes("API_KEY_INVALID");

      if (isInvalidKeyError) {
        throw new Error("INVALID_KEY_FROM_GOOGLE");
      }

      const isQuotaError =
        apiError?.status === 429 ||
        apiError?.message?.includes("429") ||
        apiError?.message?.toLowerCase().includes("quota") ||
        apiError?.message?.toLowerCase().includes("too many requests");

      if (isQuotaError) {
        try {
          return await performRequest(FALLBACK_MODEL);
        } catch {
          throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
        }
      }

      throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
    }
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY" || error.message === "API_KEY_INVALID" || error.message === "INVALID_KEY_FROM_GOOGLE") {
      throw error;
    }
    throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
  }
}
