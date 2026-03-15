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
        sodium: {
          type: SchemaType.NUMBER,
          description: "Sodium in milligrams.",
        },
        potassium: {
          type: SchemaType.NUMBER,
          description: "Potassium in milligrams.",
        },
        magnesium: {
          type: SchemaType.NUMBER,
          description: "Magnesium in milligrams.",
        },
        calcium: {
          type: SchemaType.NUMBER,
          description: "Calcium in milligrams.",
        },
        iron: { type: SchemaType.NUMBER, description: "Iron in milligrams." },
        vitaminA: {
          type: SchemaType.NUMBER,
          description: "Vitamin A in micrograms.",
        },
        vitaminC: {
          type: SchemaType.NUMBER,
          description: "Vitamin C in milligrams.",
        },
        vitaminD: {
          type: SchemaType.NUMBER,
          description: "Vitamin D in micrograms.",
        },
        vitaminE: {
          type: SchemaType.NUMBER,
          description: "Vitamin E in milligrams.",
        },
        vitaminB12: {
          type: SchemaType.NUMBER,
          description: "Vitamin B12 in micrograms.",
        },
      },
      required: [
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
  }),
});

const SYSTEM_INSTRUCTION =
  "You are an expert clinical nutritionist and structured data extractor. Analyze Hebrew meal descriptions, estimate reasonable Israeli portion sizes when omitted, and return only valid JSON matching the requested schema. Do not return markdown, explanations, or extra keys.";

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
