/// <reference types="vite/client" />
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import type { FastCalorieItem } from "../data/fast-calorie-database";

// ── Model Routing ───────────────────────────────────────────────────
// PRIMARY: Optimistic first attempt for meal parsing & vision
const PRIMARY_MODEL = "gemini-3-flash-preview";
// FALLBACK: Lite — used on any PRIMARY error, and exclusively for Insights
const FALLBACK_MODEL = "gemini-3.1-flash-lite-preview";
// SECONDARY_FALLBACK: Used if both PRIMARY and FALLBACK fail
const SECONDARY_FALLBACK_MODEL = "gemini-2.5-flash";

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
  const error = err as any;
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    error?.message?.includes("401") ||
    error?.message?.includes("403") ||
    error?.message?.toLowerCase?.()?.includes("unauthorized") ||
    error?.message?.toLowerCase?.()?.includes("invalid api key") ||
    error?.message?.toLowerCase?.()?.includes("api key not found")
  );
}

function checkIsInvalidKeyError(err: unknown): boolean {
  const error = err as any;
  return (
    error?.status === 400 ||
    error?.message?.includes("400") ||
    error?.message?.includes("API_KEY_INVALID")
  );
}

const mealResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    meal_name: {
      type: SchemaType.STRING,
      description: "Short Hebrew meal name.",
    },
    ingredients: {
      type: SchemaType.ARRAY,
      description: "List of individual ingredients making up the meal.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Name of the ingredient in Hebrew (e.g. '100 גרם אורז')." },
          calories: { type: SchemaType.NUMBER, description: "Calories in this specific ingredient." },
          protein: { type: SchemaType.NUMBER, description: "Protein in grams in this specific ingredient." },
        },
        required: ["name", "calories", "protein"],
      },
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
        omega3: { type: SchemaType.NUMBER, description: "Omega-3 EPA+DHA total in milligrams." },
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
  required: ["meal_name", "calories", "macronutrients", "micronutrients"],
};

const mealResponseParser = z.object({
  meal_name: z.string().min(1),
  ingredients: z.array(
    z.object({
      name: z.string(),
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

const SYSTEM_INSTRUCTION = `You are an expert clinical nutritionist and structured data extractor. Analyze Hebrew meal descriptions, estimate reasonable Israeli portion sizes when omitted, and return only valid JSON matching the requested schema. Do not return markdown, explanations, or extra keys. All returned text fields (meal_name, ingredient names) MUST be in Hebrew.

CRITICAL — You MUST return accurate values for ALL 24 micronutrients in the "micronutrients" object:
fiber, sodium, potassium, magnesium, calcium, iron, vitaminA, vitaminC, vitaminD, vitaminE, vitaminB12, iodine, zinc, folicAcid, vitaminK, selenium, vitaminB6, vitaminB3, vitaminB1, vitaminB2, vitaminB5, biotin, copper, manganese, chromium, omega3.

Units: fiber (g), sodium/potassium/magnesium/calcium (mg), iron (mg), vitaminA (µg RAE), vitaminC (mg), vitaminD (µg), vitaminE (mg α-tocopherol), vitaminB12 (µg), iodine (µg), zinc (mg), folicAcid (µg DFE), vitaminK (µg), selenium (µg), vitaminB6 (mg), vitaminB3 (mg NE), vitaminB1 (mg), vitaminB2 (mg), vitaminB5 (mg), biotin (µg), copper (mg), manganese (mg), chromium (µg), omega3 (mg).

For omega3, calculate the estimated total of EPA + DHA in milligrams (mg). Only count EPA and DHA forms (not ALA). Rich sources include fatty fish (salmon, sardines, mackerel), fish oil, and algae-based supplements.

Use USDA/clinical-grade reference data. If a micronutrient is truly absent from the meal, return 0. Never omit a key.

Handle common Israeli food slang, colloquialisms, typos, and commercial brand names (e.g., Osem, Tnuva, Strauss) intelligently to accurately fetch their specific nutritional values.`;

export type ParsedMealDescription = z.infer<typeof mealResponseParser>;

const VISION_SYSTEM_INSTRUCTION = `You are a clinical nutritionist. Your goal is to identify food items in images and describe them in natural Hebrew, optimized for a calorie tracking diary. Think like a person logging their food: be concise, accurate, and use logical units.`;

const VISION_PROMPT = `Analyze this image and list every food item as a simple, comma-separated Hebrew string. 

Apply these universal principles:
1. IDENTIFICATION: Identify the dish as a whole if it's a known composite meal (e.g., Sushi, Burger, Pizza, Shakshuka). Do not deconstruct complex meals into their raw base ingredients (like rice, flour, or water) unless they are distinct side dishes.
2. QUANTIFICATION: Use the most logical Israeli unit for each item:
   - Discrete pieces: Use 'יחידות' or 'פרוסות' (e.g., for sushi, nuggets, bread, fruit, pastries).
   - Bulk/Grain-based sides: Use 'כפות' or 'כוסות' (e.g., for rice, pasta, salads, spreads).
   - Solid Protein & Fried sides: Use 'גרם' (e.g., for meat, chicken, fish, fries) as weight is the only accurate way to measure these.
3. NUTRITIONAL STATE: Only include details that affect calories (e.g., 'fried', 'roasted', 'with/without shell', 'with/without bone').
4. NO FLUFF: Strictly avoid visual or sensory descriptions (e.g., 'fresh', 'round', 'tasty', 'red').

Output ONLY the Hebrew string. No conversational text or markdown.

Example logic: If you see 24 pieces of sushi, identify it as '24 יחידות סושי מאקי' with its main filling, not as piles of rice and fish.`;

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

// ── Meal Image Analysis (Optimistic Primary → Fallback) ─────────────
export async function analyzeMealImage(
  base64Image: string,
  mimeType: string,
): Promise<string> {
  const finalKey = await getApiKey();

  const performRequest = async (modelName: string) => {
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: VISION_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent([      { inlineData: { data: base64Image, mimeType } },
      VISION_PROMPT,
    ]);
    // Extract only the final text answer, ignoring any "thoughts" parts
    const candidates = result.response.candidates;
    let text = "";
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if ("text" in part && !(part as any).thought) {
          text = (part as any).text;
        }
      }
    }
    text = text?.trim() || result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  };

  // Optimistic: try PRIMARY first
  try {
    return await performRequest(PRIMARY_MODEL);
  } catch (primaryError: any) {
    if (checkIsAuthError(primaryError)) throw new Error("API_KEY_INVALID");

    // Any error → fallback to Lite
    console.warn('[Gemini] Primary model failed on analyzeMealImage, falling back to Lite...', primaryError);
    try {
      return await performRequest(FALLBACK_MODEL);
    } catch (fallbackError: any) {
      if (checkIsAuthError(fallbackError)) throw new Error("API_KEY_INVALID");
      
      console.warn('[Gemini] Lite model failed on analyzeMealImage, falling back to Secondary Lite...', fallbackError);
      try {
        return await performRequest(SECONDARY_FALLBACK_MODEL);
      } catch (secondFallbackError: any) {
        if (checkIsAuthError(secondFallbackError)) throw new Error("API_KEY_INVALID");
        throw new Error("שגיאה בזיהוי התמונה, אנא נסו שוב מאוחר יותר.");
      }
    }
  }
}

export function clearCachedApiKey() {
  // No-op: Cache killed to guarantee fresh key on every request
}

export const getApiKey = async (): Promise<string> => {
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

// ── Insight Functions (Exclusive FALLBACK_MODEL — no primary/fallback routing) ──

const INSIGHT_SYSTEM_INSTRUCTION = `You are a friendly, warm, and highly professional Israeli clinical nutritionist. Analyze the provided nutritional data (calories, macros, fiber, and all 24 micronutrients) for the given timeframe.

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
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      systemInstruction: INSIGHT_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  } catch (apiError: any) {
    if (checkIsAuthError(apiError)) throw new Error("API_KEY_INVALID");
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
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      systemInstruction: CUSTOM_ANSWER_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  } catch (apiError: any) {
    if (checkIsAuthError(apiError)) throw new Error("API_KEY_INVALID");
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
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      systemInstruction: SUPPLEMENT_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  } catch (apiError: any) {
    if (checkIsAuthError(apiError)) throw new Error("API_KEY_INVALID");
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
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty response");
    return text;
  } catch (apiError: any) {
    if (checkIsAuthError(apiError)) throw new Error("API_KEY_INVALID");
    throw new Error("שגיאה בתשובה לשאלה, אנא נסו שוב מאוחר יותר.");
  }
}

// ── Meal Text Parsing (Optimistic Primary → Fallback) ───────────────
export async function parseMealDescription(
  description: string,
): Promise<ParsedMealDescription> {
  try {
    const finalKey = await getApiKey();

    if (!finalKey) {
      throw new Error("MISSING_API_KEY");
    }

    const performRequest = async (modelName: string) => {
      const genAI = new GoogleGenerativeAI(finalKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: mealResponseSchema,
        } as any,
      });
      const result = await model.generateContent(description.trim());
      const responseText = result.response.text().trim();

      if (!responseText) {
        throw new Error("Gemini returned an empty response body.");
      }

      return mealResponseParser.parse(JSON.parse(responseText));
    };

    // Optimistic: try PRIMARY first
    try {
      return await performRequest(PRIMARY_MODEL);
    } catch (primaryError: any) {
      if (checkIsAuthError(primaryError)) throw new Error("API_KEY_INVALID");
      if (checkIsInvalidKeyError(primaryError)) throw new Error("INVALID_KEY_FROM_GOOGLE");

      // Any error → fallback to Lite
      console.warn('[Gemini] Primary model failed on parseMealDescription, falling back to Lite...', primaryError);
      try {
        return await performRequest(FALLBACK_MODEL);
      } catch (fallbackError: any) {
        if (checkIsAuthError(fallbackError)) throw new Error("API_KEY_INVALID");
        if (checkIsInvalidKeyError(fallbackError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
        
        console.warn('[Gemini] Lite model failed on parseMealDescription, falling back to Secondary Lite...', fallbackError);
        try {
          return await performRequest(SECONDARY_FALLBACK_MODEL);
        } catch (secondFallbackError: any) {
          if (checkIsAuthError(secondFallbackError)) throw new Error("API_KEY_INVALID");
          if (checkIsInvalidKeyError(secondFallbackError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
          throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
        }
      }
    }
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY" || error.message === "API_KEY_INVALID" || error.message === "INVALID_KEY_FROM_GOOGLE") {
      throw error;
    }
    throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
  }
}

export async function fetchFastCalorieFromAI(query: string): Promise<FastCalorieItem> {
  try {
    const key = await getApiKey();
    const genAI = new GoogleGenerativeAI(key);
    // Using flash-lite for instantaneous response
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      generationConfig: { responseMimeType: "application/json" }
    });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as FastCalorieItem;
  } catch (error) {
    console.error("[Gemini] Fast Calorie fetch failed:", error);
    throw new Error("Failed to fetch calorie data from AI.");
  }
}

const editedIngredientsSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    ingredients: {
      type: SchemaType.ARRAY,
      description: "List of edited ingredients.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Name of the ingredient in Hebrew (e.g. '100 גרם עגבניה')." },
          calories: { type: SchemaType.NUMBER, description: "Calories in this specific ingredient." },
          protein: { type: SchemaType.NUMBER, description: "Protein in grams in this specific ingredient." },
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
): Promise<ParsedEditedIngredients> {
  try {
    const finalKey = await getApiKey();
    if (!finalKey) throw new Error("MISSING_API_KEY");

    const prompt = `Please analyze these specific edited ingredients:\n\n${edits.map(e => `Original: "${e.oldName}" (${e.oldCalories} kcal, ${e.oldProtein}g protein)\nNew Request: "${e.newText}"`).join("\n\n")}`;

    const performRequest = async (modelName: string) => {
      const genAI = new GoogleGenerativeAI(finalKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: EDIT_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: editedIngredientsSchema,
        } as any,
      });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      if (!responseText) throw new Error("Gemini returned an empty response body.");
      return editedIngredientsParser.parse(JSON.parse(responseText));
    };

    try {
      return await performRequest(FALLBACK_MODEL);
    } catch (fallbackError: any) {
      if (checkIsAuthError(fallbackError)) throw new Error("API_KEY_INVALID");
      if (checkIsInvalidKeyError(fallbackError)) throw new Error("INVALID_KEY_FROM_GOOGLE");

      console.warn('[Gemini] Lite model failed on parseEditedIngredients, falling back to Secondary Lite...', fallbackError);
      try {
        return await performRequest(SECONDARY_FALLBACK_MODEL);
      } catch (secondFallbackError: any) {
        if (checkIsAuthError(secondFallbackError)) throw new Error("API_KEY_INVALID");
        if (checkIsInvalidKeyError(secondFallbackError)) throw new Error("INVALID_KEY_FROM_GOOGLE");
        throw new Error("שגיאה בניתוח המרכיבים, אנא נסו שוב מאוחר יותר.");
      }
    }
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY" || error.message === "API_KEY_INVALID" || error.message === "INVALID_KEY_FROM_GOOGLE") {
      throw error;
    }
    throw new Error("שגיאה בניתוח המרכיבים, אנא נסו שוב מאוחר יותר.");
  }
}
