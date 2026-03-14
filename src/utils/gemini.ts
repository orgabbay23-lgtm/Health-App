/// <reference types="vite/client" />
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_MODEL = "gemini-3-flash-preview";

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

function createMealModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
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

  const model = createMealModel(apiKey);

  try {
    const result = await model.generateContent(description.trim());
    const responseText = result.response.text().trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty response body.");
    }

    return mealResponseParser.parse(JSON.parse(responseText));
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}
