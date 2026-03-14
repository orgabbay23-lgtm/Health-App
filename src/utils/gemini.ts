/// <reference types="vite/client" />
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { z } from "zod";

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

function createMealModel(apiKey: string, modelName: string) {
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: mealResponseSchema,
    },
  });
}

export type ParsedMealDescription = z.infer<typeof mealResponseParser>;

export async function parseMealDescription(
  description: string,
): Promise<ParsedMealDescription> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env");
  }

  const performRequest = async (modelName: string) => {
    const model = createMealModel(apiKey, modelName);
    const result = await model.generateContent(description.trim());
    const responseText = result.response.text().trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty response body.");
    }

    return mealResponseParser.parse(JSON.parse(responseText));
  };

  try {
    return await performRequest(PRIMARY_MODEL);
  } catch (error: any) {
    console.error(`Primary model (${PRIMARY_MODEL}) failed:`, error);
    const isQuotaError =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.toLowerCase().includes("quota") ||
      error?.message?.toLowerCase().includes("too many requests");

    if (isQuotaError) {
      console.warn(`Retrying with fallback model (${FALLBACK_MODEL})...`);
      try {
        return await performRequest(FALLBACK_MODEL);
      } catch (fallbackError) {
        console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackError);
        throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
      }
    }
    
    throw new Error("שגיאה בניתוח הארוחה, אנא נסו שוב מאוחר יותר.");
  }
}
